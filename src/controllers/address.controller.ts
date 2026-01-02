import type { Request, Response } from "express";
import prisma from "../prisma";
import { geocode } from "../lib/geocode";

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

    const { label, recipientName, phone, addressLine, notes, isPrimary } =
      req.body;

    if (!label || !recipientName || !phone || !addressLine) {
      return res.status(400).json({ message: "Data alamat tidak lengkap" });
    }

    // reset primary
    if (isPrimary) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    if (!addressLine || addressLine.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Address must be at least 3 characters'
      });
    }

    const geo = await geocode(addressLine);

    const address = await prisma.address.create({
      data: {
        userId,
        label,
        recipientName,
        phone,
        addressLine,
        notes,
        isPrimary: isPrimary ?? false,

        street: geo.street,
        city: geo.city,
        district: geo.district,
        province: geo.province,
        postalCode: geo.postalCode,
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    });

    return res.status(201).json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create address",
    });
  }
}

export async function updateAddress(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const data = req.body;

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    let geoData = {};

    if (data.addressLine && data.addressLine !== address.addressLine) {
      const geo = await geocode(data.addressLine);

      geoData = {
        street: geo.street,
        city: geo.city,
        district: geo.district,
        province: geo.province,
        postalCode: geo.postalCode,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
    }

    if (data.isPrimary) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        ...data,
        ...geoData, 
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error(error);
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
