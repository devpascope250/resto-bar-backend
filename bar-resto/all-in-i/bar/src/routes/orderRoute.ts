import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
// get orders by MANAGER
router.get('/orders', authMiddleware(['MANAGER','CHEF','WAITER','KITCHEN',"PARTNER_ADMIN"]), orderController.getAllOrders);
// get orders by other
// router.get('/orders/others', authMiddleware(['CHEF','WAITER','KITCHEN']), orderController.getAllOrdersForOthers);
router.post('/orders', authMiddleware(['MANAGER','WAITER']), orderController.createNewOrder);
// // change order status
router.put('/orders/status', authMiddleware(['MANAGER',"PARTNER_ADMIN"]), orderController.changeOrderStatus);
// // get order by id
router.get('/orders/:orderId', authMiddleware(['MANAGER','WAITER',"CHEF","PARTNER_ADMIN"]), orderController.getOrderDetails);
// get order stats
router.get('/orders/stats/get', authMiddleware(['MANAGER','WAITER',"CHEF","PARTNER_ADMIN"]), orderController.getOrderStats);

// getting all orders by productId and date

router.get('/orders/:productId/:date', authMiddleware(['MANAGER','PARTNER_ADMIN']), orderController.getAllOrdersByProductAndDate);

router.post('/orders/change-item-status', authMiddleware(['MANAGER']), orderController.changeOrderItemStatus);
router.post('/orders/change-all-order-status', authMiddleware(['MANAGER']), orderController.changeAllOrderStatus);
export default router;