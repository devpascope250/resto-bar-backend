"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyStockReportCalculation = exports.stockOut = exports.stockIn = exports.editProduct = exports.deleteProduct = exports.addProduct = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const paths_1 = require("../utils/paths");
const ApiService_1 = require("../utils/ApiService");
const redisCache_1 = __importDefault(require("../lib/redisCache"));
const cachesNameSpace_1 = require("../../types/cachesNameSpace");
const getProducts = async (req, res) => {
    var _a, _b;
    const partnerId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.partnerId;
    if (!partnerId) {
        return res.status(404).json({
            message: 'Your`re UnAuthorized for this actions'
        });
    }
    const [namespace, key] = cachesNameSpace_1.CacheNamespace.products.partner(partnerId);
    try {
        const headers = {
            'EbmToken': `Bearer ${(_b = req.context) === null || _b === void 0 ? void 0 : _b.ebm_token}`
        };
        const cache = await redisCache_1.default.get(namespace, key);
        if (cache) {
            return res.status(200).json(cache);
        }
        const getSyncEbmProducts = new ApiService_1.ApiService(headers);
        const prod = await getSyncEbmProducts.fetch('/selectItems', "GET");
        const itemCodes = prod === null || prod === void 0 ? void 0 : prod.map((item) => item === null || item === void 0 ? void 0 : item.itemCd).filter((code) => code !== undefined);
        const countAllProducts = await prisma_1.default.product.count({
            where: {
                partnerId: partnerId,
                deletedAt: null,
            }
        });
        if (countAllProducts < itemCodes.length) {
            await redisCache_1.default.delete(namespace, key);
            await prisma_1.default.$transaction(async (tx) => {
                // there are new products in EBM that are not in our DB yet
                for (const item of prod) {
                    const existingProduct = await tx.product.findFirst({
                        where: {
                            partnerId: partnerId,
                            itemCd: item.itemCd
                        }
                    });
                    if (!existingProduct) {
                        // create new product record
                        await prisma_1.default.product.create({
                            data: {
                                itemCd: item.itemCd,
                                itemClCd: item.itemClsCd,
                                itemTyCd: item.itemTyCd,
                                taxTyCd: item.taxTyCd,
                                name: item.itemNm,
                                partnerId: partnerId,
                                price: item.dftPrc || 0,
                                productType: 'BEVERAGE',
                                currentStock: item.sftyQty || 0,
                                beverageCategoryId: null,
                                description: item.addInfo || null,
                                image: null,
                                imageUrl: null
                            }
                        });
                    }
                    else {
                        // update existing product record
                        await prisma_1.default.product.update({
                            where: {
                                id: existingProduct.id
                            },
                            data: {
                                itemClCd: item.itemClsCd,
                                itemTyCd: item.itemTyCd,
                                taxTyCd: item.taxTyCd,
                                description: item.addInfo || null,
                            }
                        });
                    }
                }
            });
        }
        const products = await prisma_1.default.product.findMany({
            where: {
                partnerId: partnerId,
                deletedAt: null,
                itemCd: {
                    in: itemCodes
                }
            },
            select: {
                id: true,
                itemCd: true,
                itemClCd: true,
                itemTyCd: true,
                taxTyCd: true,
                name: true,
                price: true,
                productType: true,
                currentStock: true,
                beverageSize: true,
                description: true,
                image: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
                beverageCategory: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        description: true
                    }
                }
            }
        });
        const newProducts = products.map((product) => {
            return Object.assign(Object.assign({}, product), { image: product.image ? `${process.env.IMAGE_URL}/${product.image}` : product.imageUrl });
        });
        await redisCache_1.default.save(namespace, key, newProducts);
        return res.status(200).json(newProducts);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
};
exports.getProducts = getProducts;
const addProduct = async (req, res) => {
    var _a, _b, _c;
    const files = req.files;
    try {
        const partnerId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            });
        }
        const [namespace, key] = cachesNameSpace_1.CacheNamespace.products.partner(partnerId);
        const { name, price, productType, description, currentStock, beverageSize, beverageCategoryId, imageUrl, itemClsCd, itemCd, itemTyCd, orgnNatCd, qtyUnitCd, pkgUnitCd, taxTyCd, isrcAplcbYn, useYn } = req.body;
        const headers = {
            'EbmToken': `Bearer ${(_b = req.context) === null || _b === void 0 ? void 0 : _b.ebm_token}`
        };
        const getSyncEbmProducts = new ApiService_1.ApiService(headers);
        const itemData = {
            itemClsCd,
            itemCd,
            itemTyCd,
            orgnNatCd,
            qtyUnitCd,
            pkgUnitCd,
            taxTyCd,
            isrcAplcbYn: isrcAplcbYn ? isrcAplcbYn : 'N',
            useYn: useYn ? useYn : 'Y',
            dftPrc: parseInt(price),
            addInfo: description,
            itemNm: name,
        };
        await getSyncEbmProducts.fetch('/saveItems', "POST", itemData);
        const imageFile = (_c = files === null || files === void 0 ? void 0 : files.image) === null || _c === void 0 ? void 0 : _c[0];
        await prisma_1.default.product.create({
            data: {
                itemCd: itemCd,
                itemClCd: itemClsCd,
                itemTyCd: itemTyCd,
                taxTyCd: taxTyCd,
                name: name,
                partnerId: partnerId,
                price: parseInt(price),
                productType: productType,
                currentStock: currentStock ? parseInt(currentStock) : 0,
                beverageSize: beverageSize,
                beverageCategoryId: parseInt(beverageCategoryId),
                description: description,
                image: imageFile ? imageFile.filename : null,
                imageUrl: imageUrl ? imageUrl : null
            }
        });
        await redisCache_1.default.delete(namespace, key);
        return res.status(200).json({ message: "successFul recorded" });
    }
    catch (error) {
        (0, paths_1.cleanupUploadedFiles)(files);
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
};
exports.addProduct = addProduct;
// delete product
const deleteProduct = async (req, res) => {
    var _a, _b;
    const partnerId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.partnerId;
    const { productId } = req.params;
    if (!partnerId || !productId) {
        return res.status(404).json({
            message: 'Your`re UnAuthorized for this actions'
        });
    }
    try {
        const partnerId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            });
        }
        await prisma_1.default.product.update({
            where: {
                id: parseInt(productId)
            },
            data: {
                deletedAt: new Date(),
            }
        });
        return res.status(200).json({ message: "successFul recorded" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
};
exports.deleteProduct = deleteProduct;
const editProduct = async (req, res) => {
    var _a, _b, _c;
    const partnerId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.partnerId;
    const { productId } = req.params;
    if (!partnerId || !productId) {
        return res.status(404).json({
            message: 'Your`re UnAuthorized for this actions'
        });
    }
    const files = req.files;
    try {
        const partnerId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            });
        }
        const { name, price, productType, description, currentStock, beverageSize, beverageCategoryId, imageUrl } = req.body;
        const imageFile = (_c = files === null || files === void 0 ? void 0 : files.image) === null || _c === void 0 ? void 0 : _c[0];
        const updateData = {
            name: name,
            partnerId: partnerId,
            price: parseInt(price),
            productType: productType,
            currentStock: parseInt(currentStock),
            beverageSize: beverageSize,
            beverageCategoryId: parseInt(beverageCategoryId),
            description: description,
        };
        // update image if there is a new one else keep the old one
        if (imageFile) {
            updateData.image = imageFile ? imageFile.filename : null;
        }
        if (imageUrl) {
            updateData.imageUrl = imageUrl;
        }
        await prisma_1.default.product.update({
            where: {
                id: parseInt(productId),
                partnerId: partnerId
            },
            data: updateData
        });
        return res.status(200).json({ message: "successFul updated" });
    }
    catch (error) {
        (0, paths_1.cleanupUploadedFiles)(files);
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
};
exports.editProduct = editProduct;
const stockIn = async (req, res) => {
    var _a, _b, _c;
    const headers = {
        'EbmToken': `Bearer ${(_a = req.context) === null || _a === void 0 ? void 0 : _a.ebm_token}`
    };
    const partnerId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.partnerId;
    const userId = (_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id;
    try {
        if (!partnerId) {
            return res.status(401).json({
                message: 'Your`re UnAuthorized for this actions'
            });
        }
        if (!userId) {
            return res.status(401).json({
                message: 'Your`re UnAuthorized for this actions'
            });
        }
        // const result = await StockInItemInEbm.createStockIn(req.body.items, req.body.stockinType);
        // if (result.resultCd !== "000") {
        //     throw result;
        // } else {
        //     if (!partnerId) {
        //         return res.status(404).json({
        //             message: 'Your`re UnAuthorized for this actions'
        //         });
        //     }
        //     if (!userId) {
        //         return res.status(404).json({
        //             message: 'Your`re UnAuthorized for this actions'
        //         });
        //     }
        //     // await prisma.$transaction(async (tx) => {
        //     //     for (const item of (req.body.items as ItemDt[])){
        //     //         await tx.product.update({
        //     //         where: {
        //     //             id: item.productId,
        //     //             partnerId: partnerId
        //     //         },
        //     //         data: {
        //     //             currentStock: {
        //     //                 increment: item.quantity
        //     //             },
        //     //         }
        //     //     })
        //     //     // add stock in
        //     //     await tx.stockIn.create({
        //     //         data: {
        //     //             quantity: item.quantity,
        //     //             reason: null,
        //     //             productId: item.productId ?? 0,
        //     //             status: 'IN_STOCK',
        //     //             userId: userId,
        //     //         }
        //     //     })
        //     //     }
        //     // });
        //     return res.status(200).json({ message: "successFul recorded" });
        // }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
};
exports.stockIn = stockIn;
// stock out
const stockOut = async (req, res) => {
    var _a, _b, _c;
    const partnerId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.partnerId;
    const userId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.id;
    const { productId } = req.params;
    if (!partnerId || !productId) {
        return res.status(404).json({
            message: 'Your`re UnAuthorized for this actions'
        });
    }
    if (!userId) {
        return res.status(404).json({
            message: 'Your`re UnAuthorized for this actions'
        });
    }
    try {
        const partnerId = (_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            });
        }
        const { quantity, reason } = req.body;
        await prisma_1.default.$transaction(async (tx) => {
            await tx.product.update({
                where: {
                    id: parseInt(productId),
                    partnerId: partnerId
                },
                data: {
                    currentStock: {
                        decrement: parseInt(quantity)
                    },
                }
            });
            if (!userId) {
                return res.status(404).json({
                    message: 'Your`re UnAuthorized for this actions'
                });
            }
            // add stock in
            await tx.stockOut.create({
                data: {
                    quantity: parseInt(quantity),
                    reason: reason,
                    productId: parseInt(productId),
                    userId: userId,
                }
            });
        });
        return res.status(200).json({ message: "successFul recorded" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
};
exports.stockOut = stockOut;
// get monthly report
const getMonthlyStockReportCalculation = async (req, res) => {
    var _a, _b, _c, _d;
    const stDate = (_a = req === null || req === void 0 ? void 0 : req.query) === null || _a === void 0 ? void 0 : _a.start_date;
    const endDate = (_b = req === null || req === void 0 ? void 0 : req.query) === null || _b === void 0 ? void 0 : _b.end_date;
    const today = stDate ? new Date(stDate) : new Date();
    today.setHours(0, 0, 0, 0);
    const atEndOfDay = endDate ? new Date(endDate) : new Date();
    atEndOfDay.setHours(23, 59, 59, 999);
    try {
        const partnerId = (_d = (_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.partnerId) === null || _d === void 0 ? void 0 : _d.toString();
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            });
        }
        await createDailyStockSnapshot(partnerId);
        const report = await getMonthlyStockReport(today, atEndOfDay, partnerId);
        return res.status(200).json(report);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json;
    }
};
exports.getMonthlyStockReportCalculation = getMonthlyStockReportCalculation;
// 1. DAILY STOCK SNAPSHOT JOB (runs at midnight)
async function createDailyStockSnapshot(partnerId) {
    const products = await prisma_1.default.product.findMany({
        where: {
            partnerId: partnerId,
            deletedAt: null
        }
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    // Process products in parallel for better performance
    await Promise.all(products.map(async (product) => {
        var _a;
        const [stockInToday, stockOutToday, yesterdaySnapshot] = await Promise.all([
            prisma_1.default.stockIn.aggregate({
                where: {
                    productId: product.id,
                    createdAt: { gte: today, lte: now }
                },
                _sum: { quantity: true }
            }),
            prisma_1.default.stockOut.aggregate({
                where: {
                    productId: product.id,
                    status: 'SOLD',
                    createdAt: { gte: today, lte: now }
                },
                _sum: { quantity: true }
            }),
            prisma_1.default.stockHistory.findUnique({
                where: {
                    productId_date: {
                        productId: product.id,
                        date: new Date(new Date().setDate(today.getDate() - 1))
                    }
                }
            })
        ]);
        const stockInQty = stockInToday._sum.quantity || 0;
        const stockOutQty = stockOutToday._sum.quantity || 0;
        const openingStock = (_a = yesterdaySnapshot === null || yesterdaySnapshot === void 0 ? void 0 : yesterdaySnapshot.closingStock) !== null && _a !== void 0 ? _a : (product.currentStock - stockInQty + stockOutQty);
        await prisma_1.default.stockHistory.upsert({
            where: {
                productId_date: {
                    productId: product.id,
                    date: today
                }
            },
            update: {
                closingStock: product.currentStock,
                stockIn: stockInQty,
                stockOut: stockOutQty,
                openingStock: openingStock
            },
            create: {
                productId: product.id,
                date: today,
                openingStock: openingStock,
                closingStock: product.currentStock,
                stockIn: stockInQty,
                stockOut: stockOutQty
            }
        });
    }));
}
// 2. LIGHTNING-FAST REPORTS
async function getMonthlyStockReport(startDate, endDate, partnerId) {
    // by default will get report for the current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    if (!startDate || !endDate) {
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
    }
    // INSTANT query - no complex calculations!
    const stockH = await prisma_1.default.stockHistory.findMany({
        where: {
            product: {
                partnerId: partnerId,
                deletedAt: null
            },
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            product: true
        },
        orderBy: { date: 'asc' }
    });
    return stockH.map((hist) => {
        return {
            id: hist.id,
            productId: hist.productId,
            productType: hist.product.productType,
            currentStock: hist.product.currentStock,
            name: hist.product.name,
            totalIn: hist.stockIn,
            totalOut: hist.stockOut,
            openingStock: hist.openingStock,
            closingStock: hist.closingStock,
            date: hist.date,
            soldAmount: hist.stockOut * hist.product.price,
            totalAmount: hist.stockIn * hist.product.price,
        };
    });
}
async function generateRealTimeStockReport(partnerId, startDate, endDate) {
    const products = await prisma_1.default.product.findMany({
        where: {
            partnerId: partnerId,
            deletedAt: null
        },
        include: {
            stockHistory: {
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            }
        }
    });
    const report = await Promise.all(products.map(async (product) => {
        const stockIn = await prisma_1.default.stockIn.aggregate({
            where: {
                productId: product.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: { quantity: true }
        });
        const stockOut = await prisma_1.default.stockOut.aggregate({
            where: {
                productId: product.id,
                status: 'SOLD',
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: { quantity: true }
        });
        return {
            id: product.id,
            name: product.name,
            currentStock: product.currentStock,
            totalIn: stockIn._sum.quantity || 0,
            totalOut: stockOut._sum.quantity || 0,
            openingStock: product.currentStock - (stockIn._sum.quantity || 0) + (stockOut._sum.quantity || 0),
            closingStock: product.currentStock,
            soldAmount: (stockOut._sum.quantity || 0) * product.price,
            totalAmount: ((stockIn === null || stockIn === void 0 ? void 0 : stockIn._sum.quantity) || 0) * product.price,
            date: endDate
        };
    }));
    return report;
}
// Example usage:
// const cocaColaReport = await getMonthlyStockReport(123, 2024, 3);
/*
Returns instantly:
[
  {
    date: 2024-03-01,
    openingStock: 100,
    closingStock: 85,
    stockIn: 0,
    stockOut: 15
  },
  {
    date: 2024-03-02,
    openingStock: 85,
    closingStock: 120,
    stockIn: 50,
    stockOut: 15
  },
  ...
]
*/
// 3. BUSINESS INTELLIGENCE QUERIES
async function getStockAnalytics(productId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return await prisma_1.default.stockHistory.groupBy({
        by: ['productId'],
        where: {
            productId,
            date: { gte: startDate }
        },
        _avg: {
            stockIn: true,
            stockOut: true,
            closingStock: true
        },
        _max: {
            closingStock: true,
            stockOut: true
        },
        _sum: {
            stockIn: true,
            stockOut: true
        }
    });
}
// 4. STOCK TURNOVER RATE (Important KPI)
async function calculateStockTurnover(productId, period) {
    const periods = { week: 7, month: 30, year: 365 };
    const days = periods[period];
    const history = await prisma_1.default.stockHistory.findMany({
        where: {
            productId,
            date: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
        }
    });
    const avgStock = history.reduce((sum, day) => sum + day.closingStock, 0) / history.length;
    const totalSold = history.reduce((sum, day) => sum + day.stockOut, 0);
    // Stock Turnover = Cost of Goods Sold / Average Inventory
    return totalSold / avgStock;
}
