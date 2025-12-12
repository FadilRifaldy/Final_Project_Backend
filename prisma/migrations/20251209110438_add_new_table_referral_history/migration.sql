-- CreateEnum
CREATE TYPE "ReferralReason" AS ENUM ('REFERRAL_SIGNUP', 'REWARD_FREE_SHIPPING', 'REWARD_VOUCHER', 'ADMIN_ADJUSTMENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "referralPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReferralPointHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" "ReferralReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralPointHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReferralPointHistory" ADD CONSTRAINT "ReferralPointHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
