import type { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, email, password, referralCode } = req.body;

    if (!name || !email || !password) {
      throw new Error("Register Field Empty");
    }

    // cek duplicate email
    const emailExist = await prisma.user.findUnique({
      where: { email },
    });
    if (emailExist) {
      throw new Error("Email already registered");
    }

    // cek referral valid
    let refOwner = null;
    if (referralCode) {
      refOwner = await prisma.user.findUnique({
        where: { referralCode: referralCode },
      });
    }

    const hashedPass = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPass,
        referredById: refOwner?.id ?? null,
      },
    });

    if (refOwner) {
      await prisma.user.update({
        where: { id: refOwner.id },
        data: {
          referralPoints: { increment: 5 },
        },
      });
    }

    res.status(201).json({
      message: "Register Success",
      newUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // Cek user ada atau tidak
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(404).json({ message: "Email atau Password Salah" });
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({ message: "Email atau Password Salah" });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      }
    );

    // Hapus password sebelum mengirim balik ke FE
    const { password: _, ...userWithoutPassword } = user;

    return res
      .status(200)
      .cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true hanya di production (https)
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
      })
      .json({
        message: "Login Successfully",
        user: userWithoutPassword,
      });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    res
      .clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      })
      .status(200)
      .json({ message: "Logout Successfully" });
  } catch (error) {
    next(error);
  }
}

export function verifyTokenHandler(req: Request, res: Response) {
  return res.status(200).json({
    loggedIn: true,
    user: req.user,
  });
}

export async function getDashboard(req: Request, res: Response) {
  res.json({
    user: req.user,
  });
}