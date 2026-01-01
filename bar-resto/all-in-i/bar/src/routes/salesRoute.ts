import { Router } from "express";
import { salesController } from "../controllers/salesController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
// get orders by MANAGER  
router.post('/sales/create-sale-transaction', authMiddleware(['MANAGER']), salesController.createNewSale);
router.post('/sales/get-invoice', authMiddleware(['MANAGER']), salesController.getInvoices);
export default router;