import { Response, Request } from "express";
import prisma from "../lib/prisma";
export const getBeverageCategories = async (req: Request, res: Response) => {
    const beverageCategories = await prisma.beverageCategory.findMany();
    res.json(beverageCategories);
}
