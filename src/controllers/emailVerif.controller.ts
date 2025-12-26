import { Request, Response } from "express";
import prisma from "../prisma";
import { transporter } from "../lib/mailer";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

export async function sendEmailVerification(req: Request, res: Response) {
  const payload = req.user as { userId: string };

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      isVerified: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  await prisma.verificationToken.updateMany({
    where: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      isUsed: false,
    },
    data: { isUsed: true },
  });

  const token = uuid();

  await prisma.verificationToken.create({
    data: {
      token,
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  const link = `${process.env.APP_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    to: user.email,
    subject: "Verify your email",
    html: `
      <h3>Email Verification</h3>
      <p>Click the link below</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 1 hour</p>
    `,
  });

  return res.json({ message: "Verification email sent" });
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Invalid token" });
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return res.status(400).json({ message: "Token not found" });
  }

  if (record.type !== "EMAIL_VERIFICATION") {
    return res.status(400).json({ message: "Invalid token type" });
  }

  if (record.isUsed) {
    return res.status(400).json({ message: "Token already used" });
  }

  if (record.expiresAt < new Date()) {
    return res.status(400).json({ message: "Token expired" });
  }

  if (record.user.provider === "GOOGLE") {
  return res.status(400).json({
    message: "Email tidak dapat diubah untuk akun Google",
  });
}


  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { isVerified: true },
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

  return res.redirect(`${process.env.APP_URL}/signInPage?verified=success`);
}

export async function resendEmailVerification(req: Request, res: Response) {
  const user = req.user;

  if (user.isVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  return sendEmailVerification(req, res);
}

export async function confirmEmailVerification(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token dan password wajib diisi",
      });
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return res.status(400).json({ message: "Token tidak valid" });
    }

    if (record.type !== "EMAIL_VERIFICATION") {
      return res.status(400).json({ message: "Token tidak valid" });
    }

    if (record.isUsed) {
      return res.status(400).json({ message: "Token sudah digunakan" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token sudah kadaluarsa" });
    }

    const user = record.user;

    if (!user || !user.password) {
      return res.status(400).json({ message: "User tidak valid" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
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

    return res.json({
      success: true,
      message: "Email berhasil diverifikasi. Silakan login kembali.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan server",
    });
  }
}
