import type { Request, Response } from "express";
import prisma from "../prisma";
import { calculateDistance } from "../lib/distance";

export async function createStore(req: Request, res: Response) {
  try {
    const {
      name,
      address,
      city,
      province,
      postalCode,
      latitude,
      longitude,
      phone,
      maxServiceRadius,
      isActive,
    } = req.body;

    // Validation
    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and address are required",
      });
    }

    if (!city?.trim() || !province?.trim()) {
      return res.status(400).json({
        success: false,
        message: "City and province are required",
      });
    }

    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid coordinates are required",
      });
    }

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode?.trim() || "",
        latitude,
        longitude,
        phone: phone || null,
        maxServiceRadius:
          typeof maxServiceRadius === "number" ? maxServiceRadius : 10,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error("[CREATE STORE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create store",
    });
  }
}

export async function getStores(req: Request, res: Response) {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: stores,
    });
  } catch (error) {
    console.error("[GET STORES ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data store",
    });
  }
}

export async function getStoreById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
    }

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        userStores: {
          where: {
            user: {
              role: "STORE_ADMIN",
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Format response with admin info
    const storeWithAdmin = {
      ...store,
      admin: store.userStores?.[0]?.user || null,
      userStores: undefined,
    };

    return res.status(200).json({
      success: true,
      data: storeWithAdmin,
    });
  } catch (error) {
    console.error("[GET STORE BY ID ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get store details",
    });
  }
}

export async function updateStore(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      province,
      postalCode,
      latitude,
      longitude,
      phone,
      maxServiceRadius,
      isActive,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Store id is required",
      });
    }

    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Validation
    if (!city?.trim() || !province?.trim()) {
      return res.status(400).json({
        success: false,
        message: "City and province are required",
      });
    }

    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid coordinates are required",
      });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name: name?.trim() ?? existingStore.name,
        address: address?.trim() ?? existingStore.address,
        city: city?.trim() ?? existingStore.city,
        province: province?.trim() ?? existingStore.province,
        postalCode: postalCode?.trim() || existingStore.postalCode,
        latitude: latitude ?? existingStore.latitude,
        longitude: longitude ?? existingStore.longitude,
        phone: phone ?? existingStore.phone,
        maxServiceRadius:
          typeof maxServiceRadius === "number"
            ? maxServiceRadius
            : existingStore.maxServiceRadius,
        isActive:
          typeof isActive === "boolean" ? isActive : existingStore.isActive,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedStore,
    });
  } catch (error) {
    console.error("[UPDATE STORE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update store",
    });
  }
}

export async function deleteStore(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Store id is required",
      });
    }

    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    await prisma.store.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE STORE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete store",
    });
  }
}

export async function getStoreProducts(req: Request, res: Response) {
  try {
    const { id: storeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Get products from inventory with their variants
    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where: {
          storeId,
          quantity: { gt: 0 }, // Only products with stock
        },
        include: {
          productVariant: {
            include: {
              product: {
                include: {
                  category: true,
                  images: {
                    orderBy: { order: "asc" },
                    take: 1,
                  },
                },
              },
              assignedImages: {
                where: { isPrimary: true },
                include: {
                  image: true,
                },
                take: 1,
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          updatedAt: "desc",
        },
      }),
      prisma.inventory.count({
        where: {
          storeId,
          quantity: { gt: 0 },
        },
      }),
    ]);

    // Transform data for frontend
    const products = inventory.map((inv: any) => {
      const variant = inv.productVariant;
      const product = variant.product;

      // Get primary image from variant or product
      const primaryImage =
        variant.assignedImages[0]?.image?.imageUrl ||
        product.images[0]?.imageUrl ||
        null;

      return {
        id: variant.id,
        productId: product.id,
        name: product.name,
        variantName: variant.name,
        variantSlug: variant.slug, // Added for deep linking
        fullName: `${product.name} ${variant.name}`,
        price: parseFloat(variant.price.toString()),
        image: primaryImage,
        stock: inv.quantity,
        reserved: inv.reserved,
        availableStock: inv.quantity - inv.reserved,
        sku: variant.sku,
        category: product.category.name,
        categoryId: product.category.id,
        sold: 0,
      };
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error("[GET STORE PRODUCTS ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get store products",
    });
  }
}

export async function getNearestStore(req: Request, res: Response) {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const userLat = parseFloat(latitude as string);
    const userLon = parseFloat(longitude as string);

    // Validate coordinates
    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    // Get ALL active stores (pure GPS approach)
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
      },
    });

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stores available",
      });
    }

    // Calculate distance for each store
    const storesWithDistance = stores.map((store: any) => {
      const distance = calculateDistance(
        userLat,
        userLon,
        store.latitude,
        store.longitude
      );

      return {
        ...store,
        distance: parseFloat(distance.toFixed(2)), // dalam KM
        isInRange: distance <= store.maxServiceRadius,
      };
    });

    // Sort by distance (ascending)
    const sortedStores = storesWithDistance.sort(
      (a: any, b: any) => a.distance - b.distance
    );

    // Get nearest store that is within service radius
    const nearestInRange = sortedStores.find((s: any) => s.isInRange);

    // If no store in range, return the nearest one anyway
    const nearestStore = nearestInRange || sortedStores[0];

    return res.status(200).json({
      success: true,
      data: {
        nearestStore,
        isInServiceArea: !!nearestInRange,
        message: nearestInRange
          ? "Store found within service area"
          : `Nearest store is ${nearestStore.distance} KM away (outside ${nearestStore.maxServiceRadius} KM service radius)`,
      },
    });
  } catch (error) {
    console.error("[GET NEAREST STORE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to find nearest store",
    });
  }
}
