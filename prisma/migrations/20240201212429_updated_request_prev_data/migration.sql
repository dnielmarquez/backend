-- AlterTable
ALTER TABLE `request` ADD COLUMN `prevReviewedCoating` JSON NULL,
    ADD COLUMN `prevReviewedMachining` JSON NULL;
