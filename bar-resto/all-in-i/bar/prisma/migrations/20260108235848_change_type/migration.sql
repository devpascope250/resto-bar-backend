/*
  Warnings:

  - Made the column `tax` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `orderitems` MODIFY `sellingPrice` DECIMAL(18, 2) NOT NULL,
    MODIFY `totalPrice` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `tax` DECIMAL(18, 2) NOT NULL,
    MODIFY `totalPrice` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `stockin` MODIFY `price` DECIMAL(18, 2) NOT NULL,
    MODIFY `totalPrice` DECIMAL(18, 2) NOT NULL,
    MODIFY `sellingPrice` DECIMAL(18, 2) NOT NULL;

-- AlterTable
ALTER TABLE `stockout` MODIFY `sellingPrice` DECIMAL(18, 2) NOT NULL,
    MODIFY `totalPrice` DECIMAL(18, 2) NOT NULL;
