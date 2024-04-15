/*
  Warnings:

  - You are about to alter the column `productRequirements` on the `request` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `request` MODIFY `productRequirements` JSON NOT NULL;
