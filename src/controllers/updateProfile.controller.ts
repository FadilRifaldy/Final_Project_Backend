import { Request, Response } from "express";
import prisma from "../prisma";
import { sendVerificationEmail } from "../services/sendVerificationEmail.service";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const payload = req.user as { userId: string };
    const userId = payload.userId;

    const { name, email, phone, profileImage } = req.body;

    if (
      name === undefined &&
      email === undefined &&
      phone === undefined &&
      profileImage === undefined
    ) {
      return res.status(400).json({
        message: "Tidak ada data yang diperbarui",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const emailChanged =
      email !== undefined && email !== user.email;

    if (emailChanged) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(409).json({
          message: "Email sudah digunakan",
        });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(profileImage !== undefined && { profileImage }),
        ...(emailChanged && { isVerified: false }),
      },
    });

    if (emailChanged) {
      await prisma.verificationToken.deleteMany({
        where: {
          userId,
          type: "EMAIL_VERIFICATION",
        },
      });

      await sendVerificationEmail({
        userId,
        email: email!,
        isVerified: false,
      });

      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });
    }

    return res.json({
      success: true,
      emailChanged,
      message: emailChanged
        ? "Email diperbarui. Silakan verifikasi email baru."
        : "Profil berhasil diperbarui",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan server",
    });
  }
};
