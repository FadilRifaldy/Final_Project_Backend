import type { Request, Response } from "express";
import prisma from "../prisma";
import { geocode } from "../lib/geocode";

export async function createStore(req: Request, res: Response) {
  try {
    const { name, address, phone, maxServiceRadius, isActive } = req.body;

    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and address are required",
      });
    }

    let geo;
    try {
      geo = await geocode(address);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Alamat tidak valid atau tidak ditemukan",
      });
    }

    if (!geo?.latitude || !geo?.longitude) {
      return res.status(400).json({
        success: false,
        message: "Gagal menentukan lokasi dari alamat",
      });
    }

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        phone: phone || null,
        maxServiceRadius:
          typeof maxServiceRadius === "number" ? maxServiceRadius : 20,
        isActive: typeof isActive === "boolean" ? isActive : true,

        latitude: geo.latitude,
        longitude: geo.longitude,
        city: geo.city || "",
        province: geo.province || "",
        postalCode: geo.postalCode || "",
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
      userStores: undefined, // Remove userStores array from response
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
    const { name, address, phone, maxServiceRadius, isActive } = req.body;

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

    let geoData = null;

    if (address && address !== existingStore.address) {
      try {
        geoData = await geocode(address);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Alamat tidak valid atau tidak ditemukan",
        });
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name: name?.trim() ?? existingStore.name,
        address: address?.trim() ?? existingStore.address,
        phone: phone ?? existingStore.phone,
        maxServiceRadius:
          typeof maxServiceRadius === "number"
            ? maxServiceRadius
            : existingStore.maxServiceRadius,
        isActive:
          typeof isActive === "boolean" ? isActive : existingStore.isActive,

        ...(geoData && {
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          city: geoData.city,
          province: geoData.province,
          postalCode: geoData.postalCode,
        }),
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
    const products = inventory.map((inv) => {
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