"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadImages = exports.uploadUserAndPartnerImages = exports.upload = void 0;
// middlewares/upload.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Common upload folder
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png'];
    if (!allowed.includes(ext)) {
        return cb(new Error('Only .jpg, .jpeg, .png files are allowed'));
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({ storage, fileFilter });
// Accept both images
exports.uploadUserAndPartnerImages = exports.upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'logoUrl', maxCount: 1 },
]);
exports.UploadImages = exports.upload.fields([
    { name: 'image', maxCount: 1 },
]);
