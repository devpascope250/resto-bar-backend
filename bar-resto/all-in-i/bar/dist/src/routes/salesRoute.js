"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const salesController_1 = require("../controllers/salesController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// get orders by MANAGER  
router.post('/sales/create-sale-transaction', (0, authMiddleware_1.authMiddleware)(['MANAGER']), salesController_1.salesController.createNewSale);
router.post('/sales/get-invoice', (0, authMiddleware_1.authMiddleware)(['MANAGER']), salesController_1.salesController.getInvoices);
exports.default = router;
