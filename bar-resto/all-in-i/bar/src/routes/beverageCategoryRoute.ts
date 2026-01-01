import { Router } from "express";
import * as beverageCategoryController from "../controllers/beverageCategoryController";

const router = Router();

router.get("/bvgcat", beverageCategoryController.getBeverageCategories);

export default router;