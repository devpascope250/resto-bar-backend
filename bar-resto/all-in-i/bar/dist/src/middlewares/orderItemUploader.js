"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadOrderItems = exports.uploadUserAndPartnerImages = exports.upload = void 0;
// middlewares/upload.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Common upload folder
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowed.includes(ext)) {
        return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});
// For user and partner images
exports.uploadUserAndPartnerImages = exports.upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'logoUrl', maxCount: 1 },
]);
const uploadOrderItems = (req, res, next) => {
    // First check if req.body exists and has content
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return next(); // Skip file processing if no body
    }
    // Check if there are any order files
    const hasOrderFiles = Object.keys(req.body).some(key => typeof key === 'string' && key.startsWith('orders['));
    if (!hasOrderFiles) {
        return next();
    }
    // Create dynamic fields configuration
    const fields = [];
    const orderIndices = new Set();
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
    exports.upload.fields(fields)(req, res, (err) => {
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
exports.uploadOrderItems = uploadOrderItems;
