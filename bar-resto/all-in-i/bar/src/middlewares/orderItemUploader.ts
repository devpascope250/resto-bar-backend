// middlewares/upload.ts
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Common upload folder
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

import { Request, Response, NextFunction } from 'express';

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  if (!allowed.includes(ext)) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// For user and partner images
export const uploadUserAndPartnerImages = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'logoUrl', maxCount: 1 },
]);
export const uploadOrderItems = (req: Request, res: Response, next: NextFunction) => {
  // First check if req.body exists and has content
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    return next(); // Skip file processing if no body
  }

  // Check if there are any order files
  const hasOrderFiles = Object.keys(req.body).some(key => 
    typeof key === 'string' && key.startsWith('orders[')
  );

  if (!hasOrderFiles) {
    return next();
  }

  // Create dynamic fields configuration
  const fields: multer.Field[] = [];
  const orderIndices = new Set<string>();

  // Safely process body keys
  Object.keys(req.body).forEach(key => {
    if (typeof key === 'string') {
      const match = key.match(/orders\[(\d+)\]\[packagePicture\]/);
      if (match && match[1]) {
        orderIndices.add(match[1]);
      }
    }
  });

  // Add a field for each order's packagePicture
  orderIndices.forEach(index => {
    fields.push({
      name: `orders[${index}][packagePicture]`,
      maxCount: 1
    });
  });

  // If no files to process, continue
  if (fields.length === 0) {
    return next();
  }

  // Use multer with the dynamic fields
  upload.fields(fields)(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large (max 5MB)' });
      }
      if (err.message.includes('Only image files are allowed')) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: 'File upload failed' });
    }
    next();
  });
};