-- AlterTable
ALTER TABLE `request` MODIFY `status` ENUM('ReadyForReview', 'ReadyToAcceptance', 'Replace', 'Repair', 'Accepted', 'Rejected') NULL;
