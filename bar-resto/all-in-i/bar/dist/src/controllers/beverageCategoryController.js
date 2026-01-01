"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBeverageCategories = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getBeverageCategories = async (req, res) => {
    const beverageCategories = await prisma_1.default.beverageCategory.findMany();
    res.json(beverageCategories);
};
exports.getBeverageCategories = getBeverageCategories;
