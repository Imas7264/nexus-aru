/*
  Warnings:

  - The values [CLASS_NOTES] on the enum `NoteCategory` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[name,scope]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `department` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NoteCategory_new" AS ENUM ('ASSIGNMENT', 'EXPERIMENT', 'NOTES', 'OTHER');
ALTER TABLE "Note" ALTER COLUMN "category" TYPE "NoteCategory_new" USING ("category"::text::"NoteCategory_new");
ALTER TYPE "NoteCategory" RENAME TO "NoteCategory_old";
ALTER TYPE "NoteCategory_new" RENAME TO "NoteCategory";
DROP TYPE "NoteCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_name_scope_key" ON "Channel"("name", "scope");
