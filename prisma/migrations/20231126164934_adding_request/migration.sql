-- CreateTable
CREATE TABLE `Request` (
    `id` VARCHAR(191) NOT NULL,
    `productName` ENUM('VAULT', 'COVER') NOT NULL,
    `productRequirements` VARCHAR(191) NOT NULL,
    `process` ENUM('MACHINING', 'COATING', 'BOTH') NOT NULL,
    `assignmentDate` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AssignedSuppliers` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AssignedSuppliers_AB_unique`(`A`, `B`),
    INDEX `_AssignedSuppliers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_AssignedSuppliers` ADD CONSTRAINT `_AssignedSuppliers_A_fkey` FOREIGN KEY (`A`) REFERENCES `Request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AssignedSuppliers` ADD CONSTRAINT `_AssignedSuppliers_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
