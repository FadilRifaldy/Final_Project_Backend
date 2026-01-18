import type { Request, Response } from "express";
import prisma from "../prisma";

export async function getStoreAdmins(req: Request, res: Response) {
  try {
    const storeAdmins = await prisma.user.findMany({
      where: {
        role: "STORE_ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        userStores: {
          select: {
            id: true,
            storeId: true,
            store: {
              select: {
                id: true,
                name: true,
                city: true,
                province: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const formattedAdmins = storeAdmins.map((admin: any) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      userStoreId: admin.userStores[0]?.id || null,
      storeId: admin.userStores[0]?.storeId || null,
      store: admin.userStores[0]?.store || null,
    }));

    return res.status(200).json({
      success: true,
      data: formattedAdmins,
    });
  } catch (error) {
    console.error("[GET STORE ADMINS ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store admins",
    });
  }
}

export async function getAvailableStores(req: Request, res: Response) {
  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        city: true,
        province: true,
        address: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: stores,
    });
  } catch (error) {
    console.error("[GET AVAILABLE STORES ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available stores",
    });
  }
}

export async function assignStoreToAdmin(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { storeId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userStores: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "STORE_ADMIN") {
      return res.status(400).json({
        success: false,
        message: "User is not a store admin",
      });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const existingAssignment = user.userStores.find(
      (us: any) => us.storeId === storeId
    );

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "User is already assigned to this store",
      });
    }

    if (user.userStores.length > 0) {
      await prisma.userStore.deleteMany({
        where: {
          userId: userId,
        },
      });
    }

    await prisma.userStore.create({
      data: {
        userId: userId,
        storeId: storeId,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        userStores: {
          select: {
            id: true,
            storeId: true,
            store: {
              select: {
                id: true,
                name: true,
                city: true,
                province: true,
              },
            },
          },
        },
      },
    });

    const formattedUser = {
      id: updatedUser!.id,
      name: updatedUser!.name,
      email: updatedUser!.email,
      userStoreId: updatedUser!.userStores[0]?.id || null,
      storeId: updatedUser!.userStores[0]?.storeId || null,
      store: updatedUser!.userStores[0]?.store || null,
    };

    return res.status(200).json({
      success: true,
      data: formattedUser,
    });
  } catch (error) {
    console.error("[ASSIGN STORE TO ADMIN ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign store to admin",
    });
  }
}

export async function unassignStoreFromAdmin(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userStores: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.userStores.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to any store",
      });
    }

    await prisma.userStore.deleteMany({
      where: {
        userId: userId,
      },
    });

    const updatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      userStoreId: null,
      storeId: null,
      store: null,
    };

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("[UNASSIGN STORE FROM ADMIN ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unassign store from admin",
    });
  }
}