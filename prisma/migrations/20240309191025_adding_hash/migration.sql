-- AlterTable
ALTER TABLE `request` ADD COLUMN `blockchainTx` VARCHAR(191) NULL,
    ADD COLUMN `fileOnchainHash` VARCHAR(191) NULL;
