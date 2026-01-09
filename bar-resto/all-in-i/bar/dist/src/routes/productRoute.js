"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products = __importStar(require("../controllers/productsController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const upload_1 = require("../middlewares/upload");
const stockManagementController_1 = require("../controllers/stockManagementController");
const router = (0, express_1.Router)();
router.get('/products', (0, authMiddleware_1.authMiddleware)(["MANAGER", "WAITER", "PARTNER_ADMIN"]), products.getProducts);
router.post('/products/discount', (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), products.createDiscount);
router.delete('/products/discount/:id', (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), products.deleteDiscount);
router.post('/products', (req, res, next) => {
    (0, upload_1.UploadImages)(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), products.addProduct);
router.put('/products/:productId', (req, res, next) => {
    (0, upload_1.UploadImages)(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), products.editProduct);
router.delete('/products/:productId', (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), products.deleteProduct);
router.put('/products/stock-in/many', (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), products.stockIn);
router.put('/products/stock-out/:productId', (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), products.stockOut);
// get monthly report
router.get('/products/report', (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), products.getMonthlyStockReportCalculation);
router.post('/products/import/items', (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), new stockManagementController_1.StockManagementController().importProducts);
router.post('/products/save/purchases', (0, authMiddleware_1.authMiddleware)(["MANAGER", "PARTNER_ADMIN"]), new stockManagementController_1.StockManagementController().importProductsPurchases);
exports.default = router;
