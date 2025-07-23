-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
