// middlewares/upload.ts
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Common upload folder
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png'];
  if (!allowed.includes(ext)) {
    return cb(new Error('Only .jpg, .jpeg, .png files are allowed'));
  }
  cb(null, true);
};

export const upload = multer({ storage, fileFilter });

// Accept both images
export const uploadUserAndPartnerImages = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'logoUrl', maxCount: 1 },
]);

export const UploadImages = upload.fields([
  { name: 'image', maxCount: 1 },
]);
