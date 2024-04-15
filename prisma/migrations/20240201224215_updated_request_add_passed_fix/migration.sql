/*
  Warnings:

  - Made the column `coatingPassed` on table `request` required. This step will fail if there are existing NULL values in that column.
  - Made the column `machiningPassed` on table `request` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `request` MODIFY `coatingPassed` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `machiningPassed` BOOLEAN NOT NULL DEFAULT false;
