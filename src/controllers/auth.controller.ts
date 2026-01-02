import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
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
      if (emailExist.provider === "GOOGLE") {
        return res.status(400).json({
          message:
            "Email sudah terdaftar dengan Google. Silakan login dengan Google.",
        });
      }
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
        provider: "CREDENTIAL",
        providerId: null,
        isVerified: false,
      },
    });

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
      where: {
        email,
      },
    });

    if (!user || user.provider !== "CREDENTIAL") {
      return res.status(400).json({
        message:
          "Akun ini terdaftar menggunakan Google. Silakan login dengan Google.",
      });
    }

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
        provider: user.provider,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res
      .status(200)
      .cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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

export async function getMe(req: Request, res: Response) {
  const payload = req.user as { userId: string };

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      provider: true,
      isVerified: true,
      profileImage: true,
      referralCode: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  return res.status(200).json({ user });
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function socialLogin(req: Request, res: Response) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res
        .status(400)
        .json({ success: false, message: "Access token required" });
    }

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid OAuth token" });
    }

    const email = data.user.email!;
    const name = data.user.user_metadata?.full_name || "User";

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          isVerified: true, 
          role: "CUSTOMER",
          provider: "GOOGLE",
          providerId: data.user.id,
        },
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.json({
      success: true,
      message: "Login Google berhasil",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
