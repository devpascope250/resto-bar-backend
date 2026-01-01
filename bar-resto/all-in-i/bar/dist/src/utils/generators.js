"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQrCode = generateQrCode;
exports.generateDeliveryQrCode = generateDeliveryQrCode;
exports.generateBatchNumber = generateBatchNumber;
exports.generateOrderIdentifiers = generateOrderIdentifiers;
// utils/generators.ts
const uuid_1 = require("uuid");
const nanoid_1 = require("nanoid");
/**
 * Generate a unique QR Code string using UUID
 * Format: QR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
function generateQrCode() {
    return `ORDER-QR-${(0, uuid_1.v4)()}`;
}
// QR for delivery
function generateDeliveryQrCode() {
    return `DELIVERY-QR-${(0, uuid_1.v4)()}`;
}
/**
 * Generate a unique Batch Number using nanoid
 * Format: BATCH-XXXXXXXXXX (10 random characters)
 */
function generateBatchNumber() {
    return `BATCH-${(0, nanoid_1.nanoid)(10).toUpperCase()}`;
}
function generateOrderIdentifiers() {
    return {
        qrCode: generateQrCode(),
        batchNumber: generateBatchNumber(),
        deliveryQrCode: generateDeliveryQrCode(),
    };
}
