/*
  Warnings:

  - You are about to drop the `_assignedsuppliers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `supplierId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_assignedsuppliers` DROP FOREIGN KEY `_AssignedSuppliers_A_fkey`;

-- DropForeignKey
ALTER TABLE `_assignedsuppliers` DROP FOREIGN KEY `_AssignedSuppliers_B_fkey`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `supplierId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `_assignedsuppliers`;

-- CreateTable
CREATE TABLE `Supplier` (
    `id` VARCHAR(191) NOT NULL,
    `supplierName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Supplier_supplierName_key`(`supplierName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RequestToSupplier` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_RequestToSupplier_AB_unique`(`A`, `B`),
    INDEX `_RequestToSupplier_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RequestToSupplier` ADD CONSTRAINT `_RequestToSupplier_A_fkey` FOREIGN KEY (`A`) REFERENCES `Request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RequestToSupplier` ADD CONSTRAINT `_RequestToSupplier_B_fkey` FOREIGN KEY (`B`) REFERENCES `Supplier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
