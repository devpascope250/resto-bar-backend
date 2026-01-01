"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupUploadedFiles = exports.deleteImage = exports.imageFileExists = exports.imageDir = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// image path
exports.imageDir = path_1.default.join(__dirname, '..', '..', '..', 'uploads');
// check if image directory exists
const imageFileExists = (filename) => {
    const filePath = path_1.default.join(exports.imageDir, filename);
    return fs_1.default.existsSync(filePath);
};
exports.imageFileExists = imageFileExists;
// delete image if exists with imageDir
const deleteImage = (filename) => {
    const filePath = path_1.default.join(exports.imageDir, filename);
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlinkSync(filePath);
    }
};
exports.deleteImage = deleteImage;
// cleanup multiple uploaded files (reusable)
const cleanupUploadedFiles = (files) => {
    if (!files)
        return;
    Object.values(files).forEach(fileArr => {
        fileArr.forEach(file => {
            (0, exports.deleteImage)(file.filename);
        });
    });
};
exports.cleanupUploadedFiles = cleanupUploadedFiles;
