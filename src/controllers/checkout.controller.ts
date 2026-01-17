// controllers/checkout.controller.ts
import { Request, Response } from 'express';
import prisma from '../prisma';

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
 * Calculate shipping cost (Placeholder)
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

    // Get user's cart to find origin store
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        store: true,
      },
    });

    if (!cart || !cart.store) {
      return res.status(404).json({
        success: false,
        message: 'Toko asal tidak ditemukan untuk keranjang ini',
      });
    }

    // TODO: Implement Shipping API (Biteship, RajaOngkir, etc.)
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
        weight: weight || 1000,
        options: [],
        message: 'Layanan kurir belum terintegrasi'
      },
    });
  } catch (error: any) {
    console.error(' [Checkout Controller] Error calculating shipping:', error);
    return res.status(500).json({
      success: false,
      message: `Gagal menghitung ongkos kirim: ${error.message || 'Unknown error'}`,
    });
  }
}

/**
 * POST /checkout/create-order
 * Create order from cart
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const {
      addressId,
      shippingCourier,
      shippingService,
      shippingDescription,
      shippingEstimate,
      shippingFee,
      paymentMethod,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Validation
    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: 'Alamat pengiriman wajib dipilih',
      });
    }

    if (!shippingCourier || !shippingService || !shippingFee) {
      return res.status(400).json({
        success: false,
        message: 'Metode pengiriman wajib dipilih',
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Metode pembayaran wajib dipilih',
      });
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        store: true,
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
                inventory: {
                  where: {
                    // storeId will be filtered inside logic or assuming correct relation
                    // Prisma include doesn't filter parent relation well here without explicit query
                    // Easier to fetch inventory separately or trust the join relation logic
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang kosong',
      });
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Alamat tidak valid',
      });
    }

    // Validate stock for all items
    for (const item of cart.items) {
      // Find inventory for this specific store
      const inventory = await prisma.inventory.findUnique({
        where: {
          productVariantId_storeId: {
            productVariantId: item.productVariantId,
            storeId: cart.storeId
          }
        }
      });
      
      const availableStock = inventory ? inventory.quantity - inventory.reserved : 0;

      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stok ${item.productVariant.name} tidak mencukupi`,
        });
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.priceAtAdd) * item.quantity,
      0
    );
    const total = subtotal + Number(shippingFee);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          shippingAddressId: addressId,
          shippingStoreId: cart.storeId,
          shippingCourier,
          shippingService,
          shippingDescription: shippingDescription || '',
          shippingEstimate: shippingEstimate || '',
          shippingFee: Number(shippingFee),
          subtotal,
          total,
          paymentMethod,
          paymentStatus: 'UNPAID',
          orderStatus: 'PENDING_PAYMENT',
          autoCancelAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Create order items
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productVariantId: item.productVariantId,
            sku: item.productVariant.sku,
            productName: item.productVariant.product.name,
            variantName: item.productVariant.name,
            price: Number(item.priceAtAdd),
            quantity: item.quantity,
            subtotal: Number(item.priceAtAdd) * item.quantity,
            total: Number(item.priceAtAdd) * item.quantity, // Simplification: discount logic later
          },
        });

        // Reserve stock
        await tx.inventory.update({
          where: {
            productVariantId_storeId: {
              productVariantId: item.productVariantId,
              storeId: cart.storeId,
            },
          },
          data: {
            reserved: {
              increment: item.quantity,
            },
          },
        });
      }

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod,
          status: 'UNPAID',
          amount: total,
        },
      });

      // Create order history
      await tx.orderHistory.create({
        data: {
          orderId: newOrder.id,
          toStatus: 'PENDING_PAYMENT',
          note: 'Order created',
          createdBy: userId,
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return res.status(200).json({
      success: true,
      message: 'Order berhasil dibuat',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat order',
    });
  }
}