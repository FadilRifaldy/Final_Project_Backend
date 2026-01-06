import type { Request, Response } from "express";
import prisma from "../prisma";
import { geocode } from "../lib/geocode";

export async function createStore(req: Request, res: Response) {
  try {
    const {
      name,
      address,
      phone,
      maxServiceRadius,
      isActive,
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        message: "Name and address are required",
      });
    }

    const geo = await geocode(address);

    const store = await prisma.store.create({
      data: {
        name,
        address,
        phone,
        maxServiceRadius: maxServiceRadius ?? 10,
        isActive: isActive ?? true,

        latitude: geo.latitude,
        longitude: geo.longitude,
        city: geo.city,
        province: geo.province,
        postalCode: geo.postalCode,
      },
    });

    return res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    console.error("Create store error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create store",
    });
  }
}

export async function getStores(req: Request, res: Response) {
  try {
    const stores = await prisma.store.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: stores,
    });
  } catch (error) {
    console.error("GET STORES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data store",
    });
  }
}