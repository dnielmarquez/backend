-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_supplierId_fkey`;

-- AlterTable
ALTER TABLE `user` MODIFY `supplierId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
