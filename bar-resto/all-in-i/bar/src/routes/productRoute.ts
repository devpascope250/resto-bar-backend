import { Router } from "express";
import * as products from "../controllers/productsController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { UploadImages } from "../middlewares/upload";
import { StockManagementController } from "../controllers/stockManagementController";
const router = Router();

router.get('/products', authMiddleware(["MANAGER", "WAITER", "PARTNER_ADMIN"]), products.getProducts);
router.post('/products/discount', authMiddleware(["MANAGER", "PARTNER_ADMIN"]), products.createDiscount);
router.delete('/products/discount/:id', authMiddleware(["MANAGER", "PARTNER_ADMIN"]), products.deleteDiscount);
router.post('/products', (req, res, next) => {
    UploadImages(req as any, res as any, (err: any) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, authMiddleware(["MANAGER", "PARTNER_ADMIN"]), products.addProduct);
router.put('/products/:productId',(req, res, next) => {
    UploadImages(req as any, res as any, (err: any) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, authMiddleware(["MANAGER", "PARTNER_ADMIN"]), products.editProduct);
router.delete('/products/:productId', authMiddleware(["MANAGER", "PARTNER_ADMIN"]), products.deleteProduct);
router.put('/products/stock-in/many', authMiddleware(["MANAGER", "PARTNER_ADMIN"]), products.stockIn);
router.put('/products/stock-out/:productId', authMiddleware(["MANAGER", "PARTNER_ADMIN"]), products.stockOut);
// get monthly report
router.get('/products/report', authMiddleware(["MANAGER", "PARTNER_ADMIN"]), products.getMonthlyStockReportCalculation);
router.post('/products/import/items', authMiddleware(["MANAGER", "PARTNER_ADMIN"]), new StockManagementController().importProducts);
router.post('/products/save/purchases', authMiddleware(["MANAGER", "PARTNER_ADMIN"]), new StockManagementController().importProductsPurchases);
export default router;