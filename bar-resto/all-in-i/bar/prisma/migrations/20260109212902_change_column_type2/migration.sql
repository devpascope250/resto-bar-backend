/*
  Warnings:

  - You are about to alter the column `openingStock` on the `stockhistory` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.
  - You are about to alter the column `closingStock` on the `stockhistory` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE `stockhistory` MODIFY `openingStock` DECIMAL(10, 2) NOT NULL,
    MODIFY `closingStock` DECIMAL(10, 2) NOT NULL;
