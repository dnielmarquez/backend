/*
  Warnings:

  - You are about to drop the column `otp` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpiry` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `request` ADD COLUMN `reviewedCoating` JSON NULL,
    ADD COLUMN `reviewedMachining` JSON NULL,
    ADD COLUMN `status` ENUM('ReadyForReview', 'ReadyToAcceptance', 'Replace', 'Repair', 'Accepted') NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `otp`,
    DROP COLUMN `otpExpiry`;
