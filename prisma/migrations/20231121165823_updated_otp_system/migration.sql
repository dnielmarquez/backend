-- AlterTable
ALTER TABLE `user` ADD COLUMN `otpExpiry` DATETIME(3) NULL,
    ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT false;
