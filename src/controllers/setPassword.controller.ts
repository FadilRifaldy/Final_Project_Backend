import { Request, Response } from "express";
import prisma from "../prisma";
import { transporter } from "../lib/mailer";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

export async function sendPassLinkEmail(req: Request, res: Response) {
  const { email, mode } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email wajib diisi" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return res.json({
      message: "Jika email terdaftar, link reset password telah dikirim",
    });
  }

  const tokenType = mode === "change" ? "PASSWORD_CHANGE" : "PASSWORD_RESET";

  await prisma.verificationToken.updateMany({
    where: { userId: user.id, type: tokenType, isUsed: false },
    data: { isUsed: true },
  });

  const token = uuid();

  await prisma.verificationToken.create({
    data: {
      token,
      userId: user.id,
      type: tokenType,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  const link = `${process.env.APP_URL}/confirm-password?token=${token}`;

  await transporter.sendMail({
    to: user.email,
    subject: "Ubah Password",
    html: `<a href="${link}">${link}</a>`,
  });

  return res.json({
    message: "Jika email terdaftar, link reset password telah dikirim",
  });
}

export async function confirmPassword(req: Request, res: Response) {
  try {
    const { token, newPassword, oldPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token dan password baru wajib diisi",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password baru minimal 6 karakter",
      });
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return res.status(400).json({
        message: "Token tidak valid",
      });
    }

    if (record.isUsed) {
      return res.status(400).json({
        message: "Token sudah digunakan",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        message: "Token sudah kedaluwarsa",
      });
    }

    const user = record.user;

    if (!user || !user.password) {
      return res.status(400).json({
        message: "Akun tidak valid untuk reset password",
      });
    }

    if (record.type === "PASSWORD_CHANGE") {
      if (!oldPassword) {
        return res.status(400).json({
          message: "Password lama wajib diisi",
        });
      }

      if (user.provider !== "CREDENTIAL") {
        return res.status(400).json({
          message: "Akun Google tidak memiliki password",
        });
      }

      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password
      );

      if (!isOldPasswordValid) {
        return res.status(400).json({
          message: "Password lama salah",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      }),
      prisma.verificationToken.update({
        where: { id: record.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      }),
    ]);

    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Password berhasil diperbarui. Silakan login kembali.",
    });
  } catch (error) {
    console.error("CONFIRM PASSWORD ERROR:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan server",
    });
  }
}

export async function checkPasswordToken(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        valid: false,
        message: "Token tidak valid",
      });
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return res.status(400).json({
        valid: false,
        message: "Token tidak ditemukan",
      });
    }

    if (record.isUsed) {
      return res.status(400).json({
        valid: false,
        message: "Token sudah digunakan",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        valid: false,
        message: "Token sudah kedaluwarsa",
      });
    }

    return res.status(200).json({
      valid: true,
      type: record.type,
      requireOldPassword: record.type === "PASSWORD_CHANGE",
    });
  } catch (error) {
    console.error("CHECK PASSWORD TOKEN ERROR:", error);
    return res.status(500).json({
      valid: false,
      message: "Terjadi kesalahan server",
    });
  }
}
