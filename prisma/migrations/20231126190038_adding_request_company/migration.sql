/*
  Warnings:

  - Added the required column `createdByUserId` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `request` ADD COLUMN `createdByUserId` VARCHAR(191) NOT NULL;
