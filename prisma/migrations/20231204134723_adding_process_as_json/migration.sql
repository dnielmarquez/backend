/*
  Warnings:

  - You are about to alter the column `process` on the `request` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Json`.

*/
-- AlterTable
ALTER TABLE `request` MODIFY `process` JSON NOT NULL;
