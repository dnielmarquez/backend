-- AlterTable
ALTER TABLE `request` ADD COLUMN `acceptanceRemarks` VARCHAR(191) NULL,
    ADD COLUMN `acceptedBy` VARCHAR(191) NULL,
    ADD COLUMN `dateAccepted` DATETIME(3) NULL,
    ADD COLUMN `supplierThatChecked` VARCHAR(191) NULL;
