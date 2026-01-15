import type { Request, Response } from "express";
import prisma from "../prisma";

export async function getAddresses(req: Request, res: Response) {
  try {
    const userId = req.user.userId;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isPrimary: "desc" },
    });

    return res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
}

export async function createAddress(req: Request, res: Response) {
  try {
    const userId = req.user.userId;

    const {
      label,
      recipientName,
      phone,
      addressLine,
      street,        // ✅ Terima dari frontend
      city,          // ✅ Terima dari frontend
      district,      // ✅ Terima dari frontend
      province,      // ✅ Terima dari frontend
      postalCode,    // ✅ Terima dari frontend
      latitude,      // ✅ Terima dari frontend
      longitude,     // ✅ Terima dari frontend
      notes,
      isPrimary,
    } = req.body;

    // Validation
    if (!label || !recipientName || !phone || !addressLine) {
      return res.status(400).json({ 
        success: false,
        message: "Data alamat tidak lengkap" 
      });
    }

    if (!street || !city || !province) {
      return res.status(400).json({
        success: false,
        message: "Street, city, and province are required",
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Coordinates are required",
      });
    }

    if (addressLine.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Address must be at least 3 characters",
      });
    }

    // Reset primary
    if (isPrimary) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label,
        recipientName,
        phone,
        addressLine,
        street,
        city,
        district: district || "",
        province,
        postalCode: postalCode || "",
        latitude,
        longitude,
        notes: notes || null,
        isPrimary: isPrimary ?? false,
      },
    });

    return res.status(201).json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("[CREATE ADDRESS ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create address",
    });
  }
}

export async function updateAddress(req: Request, res: Response) {
  try {
    const userId = req.user.userId; // ✅ Fix: gunakan userId konsisten
    const addressId = req.params.id;
    
    const {
      label,
      recipientName,
      phone,
      addressLine,
      street,        // ✅ Terima dari frontend
      city,          // ✅ Terima dari frontend
      district,      // ✅ Terima dari frontend
      province,      // ✅ Terima dari frontend
      postalCode,    // ✅ Terima dari frontend
      latitude,      // ✅ Terima dari frontend
      longitude,     // ✅ Terima dari frontend
      notes,
      isPrimary,
    } = req.body;

    // Check if address exists and belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Validation
    if (!street || !city || !province) {
      return res.status(400).json({
        success: false,
        message: "Street, city, and province are required",
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Coordinates are required",
      });
    }

    // Reset primary
    if (isPrimary) {
      await prisma.address.updateMany({
        where: { 
          userId,
          id: { not: addressId }  // Exclude current address
        },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        label,
        recipientName,
        phone,
        addressLine,
        street,
        city,
        district: district || "",
        province,
        postalCode: postalCode || "",
        latitude,
        longitude,
        notes: notes || null,
        isPrimary: isPrimary ?? false,
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[UPDATE ADDRESS ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
}

export async function deleteAddress(req: Request, res: Response) {
  try {
    const userId = req.user.userId;
    const addressId = req.params.id;

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await prisma.address.delete({
      where: { id: addressId }, 
    });

    return res.json({
      success: true,
      message: "Address deleted",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
}

export async function setPrimaryAddress(req: Request, res: Response) {
  try {
    const userId = req.user.userId;
    const addressId = req.params.id;

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      prisma.address.update({
        where: {
          id: addressId,
          userId, 
        },
        data: { isPrimary: true },
      }),
    ]);

    return res.json({
      success: true,
      message: "Primary address updated",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to set primary address",
    });
  }
}
