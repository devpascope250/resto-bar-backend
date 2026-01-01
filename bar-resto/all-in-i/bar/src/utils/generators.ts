// utils/generators.ts
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

/**
 * Generate a unique QR Code string using UUID
 * Format: QR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function generateQrCode(): string {
  return `ORDER-QR-${uuidv4()}`;
}

// QR for delivery

export function generateDeliveryQrCode(): string {
  return `DELIVERY-QR-${uuidv4()}`;
}


/**
 * Generate a unique Batch Number using nanoid
 * Format: BATCH-XXXXXXXXXX (10 random characters)
 */
export function generateBatchNumber(): string {
  return `BATCH-${nanoid(10).toUpperCase()}`;
}


export function generateOrderIdentifiers() {
  return {
    qrCode: generateQrCode(),
    batchNumber: generateBatchNumber(),
    deliveryQrCode: generateDeliveryQrCode(),
  };
}
