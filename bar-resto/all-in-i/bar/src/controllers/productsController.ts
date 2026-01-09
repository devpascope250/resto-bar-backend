import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { cleanupUploadedFiles } from '../utils/paths';
import { ApiService } from '../utils/ApiService';
import { ItemsList } from '@/types/models/ItemsList';
import redisCache from '../lib/redisCache';
import { CacheNamespace } from '../../types/cachesNameSpace';
import { StockManagement, stockOutData } from '../services/StockManagement';
import { StockInOutSaveItem } from '@/types/models/StockInOutData';
import taxRounder from '../utils/taxRounding';
export const getProducts = async (req: Request, res: Response) => {
    const partnerId = req?.user?.partnerId;
    if (!partnerId) {
        return res.status(404).json({
            message: 'Your`re UnAuthorized for this actions'
        });
    }

    const [namespace, key] = CacheNamespace.products.partner(partnerId);
    try {
        const headers = {
            'EbmToken': `Bearer ${req.context?.ebm_token}`

        }
        // const cache = await redisCache.get(namespace, key);
        // if (cache) {
        //     return res.status(200).json(cache);
        // }

        const getSyncEbmProducts = new ApiService(headers);
        const prod = await getSyncEbmProducts.fetch<ItemsList[]>('/selectItems', "GET");

        const itemCodes = prod?.map((item) => item?.itemCd).filter((code): code is string => code !== undefined);
        const countAllProducts = await prisma.product.count(
            {
                where: {
                    partnerId: partnerId,
                    deletedAt: null,
                }
            }
        );
        if (countAllProducts < itemCodes.length) {
            await redisCache.delete(namespace, key);
            await prisma.$transaction(async (tx) => {
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
                        await prisma.product.create({
                            data: {
                                itemCd: item.itemCd!,
                                itemClCd: item.itemClsCd!,
                                itemTyCd: item.itemTyCd!,
                                taxTyCd: item.taxTyCd!,
                                name: item.itemNm!,
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
                    } else {
                        // update existing product record
                        await prisma.product.update({
                            where: {
                                id: existingProduct.id
                            },
                            data: {
                                itemClCd: item.itemClsCd!,
                                itemTyCd: item.itemTyCd!,
                                taxTyCd: item.taxTyCd!,
                                description: item.addInfo || null,
                            }
                        });
                    }
                }
            });
        }

        const products = await prisma.product.findMany(
            {
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
                    },
                    discount: true
                }
            }
        );
        const newProducts = products.map((product) => {
            return {
                ...product,
                discount: (product.discount && !product.discount.isDeleted && product.discount.endDate > new Date()) ? product.discount : null,
                image: product.image ? `${process.env.IMAGE_URL}/${product.image}` : product.imageUrl
            }
        });
        await redisCache.save(namespace, key, newProducts);
        return res.status(200).json(newProducts);
    } catch (error) {
        console.log(error);

        return res.status(500).json(
            {
                message: error
            }
        );
    }
}

export const addProduct = async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    try {
        const partnerId = req?.user?.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            });
        }
        const [namespace, key] = CacheNamespace.products.partner(partnerId);
        const { name, price, productType, description, currentStock, beverageSize, beverageCategoryId, imageUrl, itemClsCd, itemCd, itemTyCd, orgnNatCd, qtyUnitCd, pkgUnitCd, taxTyCd, isrcAplcbYn, useYn } = req.body;

        const headers = {
            'EbmToken': `Bearer ${req.context?.ebm_token}`

        }
        const getSyncEbmProducts = new ApiService(headers);
        const itemData: ItemsList = {
            itemClsCd,
            itemCd,
            itemTyCd,
            orgnNatCd,
            qtyUnitCd,
            pkgUnitCd,
            taxTyCd,
            isrcAplcbYn: isrcAplcbYn ? isrcAplcbYn : 'N',
            useYn: useYn ? useYn : 'Y',
            dftPrc: Number(price),
            addInfo: description,
            itemNm: name,
        };

        const itemByCreat: StockInOutSaveItem = {
            itemSeq: 1,
            itemCd: itemData.itemCd,
            itemClsCd: itemData.itemClsCd ?? "",
            itemNm: itemData.itemNm ?? "",
            bcd: null,
            pkgUnitCd: itemData?.pkgUnitCd ?? "",
            pkg: currentStock ?? 0,
            qtyUnitCd: itemData?.qtyUnitCd ?? "",
            qty: currentStock ?? 0,
            itemExprDt: '',
            prc: price ?? 0,
            splyAmt: Number(price) * (currentStock ?? 0),
            totDcAmt: 0,
            taxblAmt: Number(price) * (currentStock ?? 0),
            taxTyCd: itemData?.taxTyCd ?? "",
            taxAmt: taxRounder(taxTyCd === "B" ? (Number(price) * (currentStock ?? 0)) * 18 / 118 : 0),
            totAmt: Number(price) * (currentStock ?? 0)

        }
        const response = await getSyncEbmProducts.fetch<ItemsList>('/saveItems', "POST", itemData);
        if ((response as any).resultCd !== '000') {
            return res.status(500).json(response);
        }
        const imageFile = files?.image?.[0];
        await prisma.product.create(
            {
                data: {
                    itemCd: itemCd,
                    itemClCd: itemClsCd,
                    itemTyCd: itemTyCd,
                    taxTyCd: taxTyCd,
                    name: name,
                    partnerId: partnerId,
                    price: Number(price),
                    productType: productType,
                    currentStock: currentStock ? Number(currentStock) : 0,
                    beverageSize: beverageSize,
                    beverageCategoryId: parseInt(beverageCategoryId),
                    description: description,
                    image: imageFile ? imageFile.filename : null,
                    imageUrl: imageUrl ? imageUrl : null
                }
            }
        );
        const stoctOut = new StockManagement(headers);
        await stoctOut.saveStockMaster([{ itemCd: itemCd, quantity: currentStock ? parseInt(currentStock) : 0 }], "IN", "CREATE");
        await stoctOut.createStockIn([{ itemCd: itemCd, itemNm: name, price: Number(price), quantity: currentStock ? parseInt(currentStock) : 0 }], '00', itemByCreat);
        await redisCache.delete(namespace, key);
        return res.status(200).json({ message: "successFul recorded" });
    } catch (error) {
        cleanupUploadedFiles(files);
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
}

// delete product

export const deleteProduct = async (req: Request, res: Response) => {
    const partnerId = req?.user?.partnerId;
    const { productId } = req.params;
    if (!partnerId || !productId) {
        return res.status(404).json({
            message: 'Your`re UnAuthorized for this actions'
        });
    }
    try {
        const partnerId = req?.user?.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            });
        }
        await prisma.product.update(
            {
                where: {
                    id: parseInt(productId)
                },
                data: {
                    deletedAt: new Date(),
                }
            }
        );
        return res.status(200).json({ message: "successFul recorded" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });

    }
}

export const editProduct = async (req: Request, res: Response) => {

    const partnerId = req?.user?.partnerId;
    const { productId } = req.params;
    if (!partnerId || !productId) {
        return res.status(404).json({
            message: 'Your`re UnAuthorized for this actions'
        });
    }
    const [namespace, key] = CacheNamespace.products.partner(partnerId);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    try {
        const partnerId = req?.user?.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            });
        }
        const { name, price, productType, description, currentStock, beverageSize, beverageCategoryId, imageUrl } = req.body;
        const imageFile = files?.image?.[0];
        const updateData: {
            name: any;
            partnerId: string;
            price: number;
            productType: any;
            // currentStock: number;
            beverageSize: any;
            beverageCategoryId: number;
            description: any;
            image?: string | null;  // 添加可选的 image 属性
            imageUrl?: string | null;  // 添加可选的 imageUrl 属性  
        } = {
            name: name,
            partnerId: partnerId,
            price: Number(price),
            productType: productType,
            // currentStock: parseInt(currentStock),
            beverageSize: beverageSize,
            beverageCategoryId: parseInt(beverageCategoryId),
            description: description,
        };

        // update image if there is a new one else keep the old one
        if (imageFile) {
            updateData.image = imageFile ? imageFile.filename : null
        }

        if (imageUrl) {
            updateData.imageUrl = imageUrl
        }

        await prisma.product.update(
            {
                where: {
                    id: parseInt(productId),
                    partnerId: partnerId
                },
                data: updateData
            }
        );
        await redisCache.delete(namespace, key);
        return res.status(200).json({ message: "successFul updated" });
    } catch (error) {
        cleanupUploadedFiles(files);
        console.log(error);
        return res.status(500).json({
            message: error
        });

    }
}

export const stockIn = async (req: Request, res: Response) => {
    const headers = {
        'EbmToken': `Bearer ${req.context?.ebm_token}`
    };
    const partnerId = req?.user?.partnerId;
    const userId = req?.user?.id;
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
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });

    }
}

// stock out
export const stockOut = async (req: Request, res: Response) => {
    const partnerId = req?.user?.partnerId;
    const userId = req?.user?.id;
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
        const partnerId = req?.user?.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            })
        }

        const { quantity, reason } = req.body;
        await prisma.$transaction(async (tx) => {
            const prod = await tx.product.update({
                where: {
                    id: parseInt(productId),
                    partnerId: partnerId
                },
                data: {
                    currentStock: {
                        decrement: parseInt(quantity)
                    },
                }
            })

            if (!userId) {
                return res.status(404).json({
                    message: 'Your`re UnAuthorized for this actions'
                })
            }
            // add stock in
            await tx.stockOut.create({
                data: {
                    quantity: parseInt(quantity),
                    reason: reason,
                    productId: parseInt(productId),
                    userId: userId,

                }
            })
        })

        return res.status(200).json({ message: "successFul recorded" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
}

// get monthly report

export const getMonthlyStockReportCalculation = async (req: Request, res: Response) => {
    const stDate = req?.query?.start_date;
    const endDate = req?.query?.end_date;
    const today = stDate ? new Date(stDate as string) : new Date();
    today.setHours(0, 0, 0, 0);

    const atEndOfDay = endDate ? new Date(endDate as string) : new Date();
    atEndOfDay.setHours(23, 59, 59, 999);
    try {
        const partnerId = req?.user?.partnerId?.toString();
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            })
        }
        await createDailyStockSnapshot(partnerId);
        const report = await getMonthlyStockReport(today, atEndOfDay, partnerId);
        return res.status(200).json(report);
    } catch (error) {
        console.log(error);
        return res.status(500).json
    }
}

// create discount

export const createDiscount = async (req: Request, res: Response) => {
    try {
        const partnerId = req?.user?.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            })
        }

        const [namespace, key] = CacheNamespace.products.partner(partnerId);
        await redisCache.delete(namespace, key);
        // delete product if exist

        const existed = await prisma.discounts.findFirst({
            where: {
                productId: parseInt(req.body.productId),
            }
        });

        if (existed) {
            await prisma.discounts.delete({
                where: {
                    id: existed.id
                }
            })
        }
        await prisma.discounts.create({
            data: {
                ...req.body,
                productId: parseInt(req.body.productId)
            }
        })
        return res.status(200).json({ message: "successFul recorded" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
}


// delete discount

export const deleteDiscount = async (req: Request, res: Response) => {
    const discountId = req.params.id;
    try {
        const partnerId = req?.user?.partnerId;
        if (!partnerId) {
            return res.status(404).json({
                message: 'Your`re UnAuthorized for this actions \n there is not Organization assigned to you'
            })
        }
        const [namespace, key] = CacheNamespace.products.partner(partnerId);
        await redisCache.delete(namespace, key);

        await prisma.discounts.update({
            where: {
                id: parseInt(discountId)
            },
            data: {
                isDeleted: true
            }
        });
        return res.status(200).json({ message: "successFul recorded" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error
        });
    }
}

// 1. DAILY STOCK SNAPSHOT JOB (runs at midnight)
async function createDailyStockSnapshot(partnerId: string) {
    const products = await prisma.product.findMany({
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
        const [stockInToday, stockOutToday, yesterdaySnapshot] = await Promise.all([
            prisma.stockIn.aggregate({
                where: {
                    productId: product.id,
                    createdAt: { gte: today, lte: now }
                },
                _sum: { quantity: true }
            }),
            prisma.stockOut.aggregate({
                where: {
                    productId: product.id,
                    status: 'SOLD',
                    createdAt: { gte: today, lte: now }
                },
                _sum: { quantity: true }
            }),
            prisma.stockHistory.findUnique({
                where: {
                    productId_date: {
                        productId: product.id,
                        date: new Date(new Date().setDate(today.getDate() - 1))
                    }
                }
            })
        ]);

        const stockInQty = Number(stockInToday._sum.quantity || 0.00);
        const stockOutQty = Number(stockOutToday._sum.quantity || 0.00);
        const openingStock = yesterdaySnapshot?.closingStock ??
            (Number(product.currentStock) - stockInQty + stockOutQty);

        await prisma.stockHistory.upsert({
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
async function getMonthlyStockReport(startDate: Date | null, endDate: Date | null, partnerId: string) {
    // by default will get report for the current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    if (!startDate || !endDate) {
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
    }
    // INSTANT query - no complex calculations!
    const stockH = await prisma.stockHistory.findMany({
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
            soldAmount: hist.stockOut * Number(hist.product.price),
            totalAmount: hist.stockIn * Number(hist.product.price),
        }
    }
    )
}





async function generateRealTimeStockReport(partnerId: string, startDate: Date, endDate: Date) {
    const products = await prisma.product.findMany({
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
        const stockIn = await prisma.stockIn.aggregate({
            where: {
                productId: product.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: { quantity: true }
        });

        const stockOut = await prisma.stockOut.aggregate({
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
            openingStock: Number(product.currentStock) - Number(stockIn._sum.quantity || 0) + Number(stockOut._sum.quantity || 0),
            closingStock: product.currentStock,
            soldAmount: Number(stockOut._sum.quantity || 0) * Number(product.price),
            totalAmount: Number(stockIn?._sum.quantity || 0) * Number(product.price),
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
async function getStockAnalytics(productId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.stockHistory.groupBy({
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
async function calculateStockTurnover(productId: number, period: 'week' | 'month' | 'year') {
    const periods = { week: 7, month: 30, year: 365 };
    const days = periods[period];

    const history = await prisma.stockHistory.findMany({
        where: {
            productId,
            date: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
        }
    });

    const avgStock = history.reduce((sum, day) => sum + Number(day.closingStock), 0) / history.length;
    const totalSold = history.reduce((sum, day) => sum + day.stockOut, 0);

    // Stock Turnover = Cost of Goods Sold / Average Inventory
    return totalSold / avgStock;
}