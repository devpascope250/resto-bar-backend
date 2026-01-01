-- CreateTable
CREATE TABLE `Discounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `discountName` VARCHAR(191) NOT NULL,
    `rate` DOUBLE NOT NULL DEFAULT 0,
    `productId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Discounts_productId_key`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Discounts` ADD CONSTRAINT `Discounts_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
