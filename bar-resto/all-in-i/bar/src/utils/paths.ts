import path from "path";
import fs from "fs";

// image path
export const imageDir = path.join(__dirname, '..', '..', '..', 'uploads');

// check if image directory exists
export const imageFileExists = (filename: string) => {
  const filePath = path.join(imageDir, filename);
  return fs.existsSync(filePath);
}

// delete image if exists with imageDir
export const deleteImage = (filename: string) => {
  const filePath = path.join(imageDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};


// cleanup multiple uploaded files (reusable)
export const cleanupUploadedFiles = (
  files: { [field: string]: Express.Multer.File[] } | undefined
) => {
  if (!files) return;
  Object.values(files).forEach(fileArr => {
    fileArr.forEach(file => {
      deleteImage(file.filename);
    });
  });
};