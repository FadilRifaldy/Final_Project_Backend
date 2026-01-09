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
