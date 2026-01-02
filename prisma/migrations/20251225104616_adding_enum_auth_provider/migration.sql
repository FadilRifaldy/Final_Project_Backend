/*
  Warnings:

  - The `provider` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'EMAIL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- AlterTable
ALTER TABLE "users" DROP COLUMN "provider",
ADD COLUMN     "provider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIAL';
