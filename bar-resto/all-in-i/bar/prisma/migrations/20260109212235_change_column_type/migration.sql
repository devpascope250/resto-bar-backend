/*
  Warnings:

  - You are about to alter the column `quantity` on the `orderitems` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `quantity` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `currentStock` on the `product` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `quantity` on the `stockin` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `quantity` on the `stockout` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE `orderitems` MODIFY `quantity` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `quantity` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `currentStock` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `stockin` MODIFY `quantity` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `stockout` MODIFY `quantity` DECIMAL(10, 2) NULL;
