/*
  Warnings:

  - You are about to drop the column `contactType` on the `sellers` table. All the data in the column will be lost.
  - You are about to drop the column `contactValue` on the `sellers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sellers" DROP COLUMN "contactType",
DROP COLUMN "contactValue",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;
