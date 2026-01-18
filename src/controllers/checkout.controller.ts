// controllers/checkout.controller.ts
import { Request, Response } from 'express';
import prisma from '../prisma';
import { getRajaOngkirShippingCost, findRajaOngkirLocation, LocationResult } from '../services/rajaongkir.service';
import { calculateDistance } from '../lib/distance';

/**
 * Generate mock shipping options based on distance and weight
 */
function generateMockShippingOptions(distance: number, weight: number) {
  // Base rates per kg per km
  const baseRatePerKgKm = {
    jne: 0.8,
    pos: 0.6,
    tiki: 0.75,
  };

  const weightInKg = weight / 1000;
  
  return [
    {
      courier: 'JNE',
      courierName: 'JNE Express',
      service: 'REG',
      description: 'Layanan Reguler',
      cost: Math.round(15000 + (distance * weightInKg * baseRatePerKgKm.jne * 100)),
      etd: distance < 50 ? '1-2 hari' : distance < 200 ? '2-3 hari' : '3-5 hari',
    },
    {
      courier: 'JNE',
      courierName: 'JNE Express',
      service: 'YES',
      description: 'Yakin Esok Sampai',
      cost: Math.round(25000 + (distance * weightInKg * baseRatePerKgKm.jne * 150)),
      etd: '1 hari',
    },
    {
      courier: 'POS',
      courierName: 'POS Indonesia',
      service: 'Pos Reguler',
      description: 'Layanan Pos Reguler',
      cost: Math.round(12000 + (distance * weightInKg * baseRatePerKgKm.pos * 100)),
      etd: distance < 50 ? '2-3 hari' : distance < 200 ? '3-4 hari' : '4-7 hari',
    },
    {
      courier: 'TIKI',
      courierName: 'TIKI',
      service: 'REG',
      description: 'Regular Service',
      cost: Math.round(14000 + (distance * weightInKg * baseRatePerKgKm.tiki * 100)),
      etd: distance < 50 ? '1-2 hari' : distance < 200 ? '2-4 hari' : '3-6 hari',
    },
  ];
}

/**
 * GET /checkout/addresses
 * Get user's addresses
 */
export async function getUserAddresses(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    console.error('Error getting addresses:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat alamat',
    });
  }
}

/**
 * POST /checkout/shipping-cost
 * Calculate shipping cost using RajaOngkir (with fallback to mock data)
 */
export async function calculateShippingCost(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const { addressId, weight } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: 'Alamat pengiriman wajib dipilih',
      });
    }

    // Get destination address
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Alamat tidak ditemukan',
      });
    }

    // Get user's cart to find origin store and calculate real weight from items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        store: true,
        items: {
          include: {
            productVariant: true
          }
        }
      },
    });

    if (!cart || !cart.store) {
      return res.status(404).json({
        success: false,
        message: 'Toko asal tidak ditemukan untuk keranjang ini',
      });
    }

    // Use weight from body (estimated by frontend) or calculate from cart items
    let totalWeight = weight;
    if (!totalWeight) {
      totalWeight = cart.items.reduce((sum: number, item: any) => {
        return sum + (item.productVariant.weight * item.quantity);
      }, 0);
    }
    
    // Minimum weight for shipping calculation
    if (!totalWeight || totalWeight <= 0) totalWeight = 1000;

    // Try RajaOngkir first
    let shippingOptions: any[] = [];
    let source = 'fallback';

    try {
      // 1. Find Origin Location (Store)
      // Store usually has city/province. We try to find precise location if "district" is added to schema, currently likely just city.
      // Search: City Name
      const originLocation = await findRajaOngkirLocation(cart.store.city);
      
      // 2. Find Destination Location (User Address)
      // User address has: province, city, district (kecamatan), postalCode
      // We try precise search: "Kecamatan City"
      let destLocation: LocationResult | null = null;
      
      // Try searching with District first for higher accuracy (Kecamatan)
      if (address.district) {
        destLocation = await findRajaOngkirLocation(`${address.district} ${address.city}`);
      }
      
      // Fallback to searching by City only if district search failed
      if (!destLocation) {
        destLocation = await findRajaOngkirLocation(address.city);
      }

      if (originLocation && destLocation) {
        const rajaResult = await getRajaOngkirShippingCost(
          originLocation.id,
          originLocation.type,
          destLocation.id,
          destLocation.type,
          totalWeight,
          'jne,pos,tiki'
        );

        if (rajaResult.success && rajaResult.options && rajaResult.options.length > 0) {
          shippingOptions = rajaResult.options;
          source = 'rajaongkir';
        }
      } else {
        console.warn(`[Checkout] Location mapping failed. Origin: ${originLocation?.label}, Dest: ${destLocation?.label}`);
      }
    } catch (rajaError: any) {
      console.warn('RajaOngkir API failed, using fallback:', rajaError.message);
    }

    // Fallback to mock data if RajaOngkir fails
    if (shippingOptions.length === 0) {
      const distance = calculateDistance(
        cart.store.latitude,
        cart.store.longitude,
        address.latitude,
        address.longitude
      );
      
      shippingOptions = generateMockShippingOptions(distance, totalWeight);
      source = 'mock';
      
      console.log(`Using mock shipping data. Distance: ${distance.toFixed(2)}km, Weight: ${totalWeight}g`);
    }

    return res.status(200).json({
      success: true,
      data: {
        origin: {
          city: cart.store.city,
          province: cart.store.province,
        },
        destination: {
          city: address.city,
          province: address.province,
        },
        weight: totalWeight,
        options: shippingOptions,
        source, // 'rajaongkir' or 'mock'
      },
    });
  } catch (error: any) {
    console.error('[Checkout Controller] Error calculating shipping:', error);
    return res.status(500).json({
      success: false,
      message: `Gagal menghitung ongkos kirim: ${error.message || 'Unknown error'}`,
    });
  }
}
