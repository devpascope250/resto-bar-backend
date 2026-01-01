-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('ALCOHOLIC', 'NON_ALCOHOLIC') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partnerId` VARCHAR(191) NOT NULL,
    `itemCd` VARCHAR(191) NULL,
    `itemClCd` VARCHAR(191) NULL,
    `productType` ENUM('BEVERAGE', 'FOOD', 'OTHER') NOT NULL,
    `beverageCategoryId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL,
    `currentStock` INTEGER NOT NULL DEFAULT 0,
    `lowStockThreshold` INTEGER NOT NULL DEFAULT 10,
    `beverageSize` ENUM('SMALL', 'MEDIUM', 'LARGE', 'XL', 'NORMAL') NULL,
    `temperature` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Product_itemCd_key`(`itemCd`),
    INDEX `Product_partnerId_idx`(`partnerId`),
    INDEX `Product_name_idx`(`name`),
    INDEX `Product_currentStock_idx`(`currentStock`),
    INDEX `Product_productType_currentStock_idx`(`productType`, `currentStock`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockIn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL,
    `dozens` INTEGER NULL DEFAULT 0,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `reason` VARCHAR(191) NULL,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `sellingPrice` DOUBLE NOT NULL DEFAULT 0,
    `expiredDate` DATETIME(3) NULL,
    `status` ENUM('IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockIn_productId_createdAt_idx`(`productId`, `createdAt`),
    INDEX `StockIn_expiredDate_idx`(`expiredDate`),
    INDEX `StockIn_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockOut` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `stockInId` INTEGER NULL,
    `userId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL,
    `dozens` INTEGER NULL DEFAULT 0,
    `reason` VARCHAR(191) NULL,
    `sellingPrice` DOUBLE NOT NULL DEFAULT 0,
    `tax` DOUBLE NULL DEFAULT 0,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('SOLD', 'RETURNED', 'LOST', 'DAMAGED', 'EXPIRED') NOT NULL DEFAULT 'SOLD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockOut_productId_createdAt_idx`(`productId`, `createdAt`),
    INDEX `StockOut_stockInId_idx`(`stockInId`),
    INDEX `StockOut_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderName` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL,
    `dozens` INTEGER NULL,
    `tax` DOUBLE NULL DEFAULT 0,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL,
    `orderedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `confirmedBy` VARCHAR(191) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Orders_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItems` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `stockInId` INTEGER NULL,
    `quantity` INTEGER NULL,
    `beverageType` ENUM('COLD', 'HOT', 'ROOM_TEMPERATURE', 'FROZEN', 'NORMAL') NULL,
    `dozens` INTEGER NULL,
    `sellingPrice` DOUBLE NOT NULL DEFAULT 0,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',

    INDEX `OrderItems_orderId_idx`(`orderId`),
    INDEX `OrderItems_stockInId_idx`(`stockInId`),
    INDEX `OrderItems_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderCustomers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tin` VARCHAR(191) NULL,
    `paymentType` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderCustomers_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerInvoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderCustomerId` INTEGER NOT NULL,
    `invcNo` INTEGER NOT NULL,
    `salesTyCd` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CustomerInvoices_invcNo_key`(`invcNo`),
    INDEX `CustomerInvoices_invcNo_idx`(`invcNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `openingStock` INTEGER NOT NULL,
    `closingStock` INTEGER NOT NULL,
    `stockIn` INTEGER NOT NULL,
    `stockOut` INTEGER NOT NULL,

    INDEX `StockHistory_productId_date_idx`(`productId`, `date`),
    UNIQUE INDEX `StockHistory_productId_date_key`(`productId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_beverageCategoryId_fkey` FOREIGN KEY (`beverageCategoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockIn` ADD CONSTRAINT `StockIn_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockOut` ADD CONSTRAINT `StockOut_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockOut` ADD CONSTRAINT `StockOut_stockInId_fkey` FOREIGN KEY (`stockInId`) REFERENCES `StockIn`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItems` ADD CONSTRAINT `OrderItems_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItems` ADD CONSTRAINT `OrderItems_stockInId_fkey` FOREIGN KEY (`stockInId`) REFERENCES `StockIn`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItems` ADD CONSTRAINT `OrderItems_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderCustomers` ADD CONSTRAINT `OrderCustomers_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerInvoices` ADD CONSTRAINT `CustomerInvoices_orderCustomerId_fkey` FOREIGN KEY (`orderCustomerId`) REFERENCES `OrderCustomers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockHistory` ADD CONSTRAINT `StockHistory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
