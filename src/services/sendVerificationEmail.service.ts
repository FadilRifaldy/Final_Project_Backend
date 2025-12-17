import prisma from "../prisma";
import { transporter } from "../lib/mailer";
import { v4 as uuid } from "uuid";

export async function sendVerificationEmail(user: {
  userId: string;
  email: string;
  isVerified: boolean;
}) {
  if (user.isVerified) {
    throw new Error("Email already verified");
  }

  await prisma.verificationToken.updateMany({
    where: {
      userId: user.userId,
      type: "EMAIL_VERIFICATION",
      isUsed: false,
    },
    data: { isUsed: true },
  });

  const token = uuid();

  await prisma.verificationToken.create({
    data: {
      token,
      userId: user.userId,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  const link = `${process.env.BACKEND_URL}/verify/verify-email?token=${token}`;

  await transporter.sendMail({
    to: user.email,
    subject: "Verify your email",
    html: `<a href="${link}">${link}</a>`,
  });
}
