import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { BeverageType, orderItemStatus, Orders, Prisma, StockOut } from '@prisma/client';
import redisCache from '../lib/redisCache';
import { CacheNamespace } from '../../types/cachesNameSpace';
const toDay = new Date();
const month = toDay.getMonth() + 1;
const year = toDay.getFullYear();
const day = toDay.getDate();
// full date wil year, month, day
const fullDate = `${year}-${month}-${day}`;
const thisDay = new Date(fullDate);
thisDay.setHours(0, 0, 0, 0);
interface OrderItem {
    id: number;
    productId: number;
    quantity: number;
    sellingPrice: number;
    beverageType: string;
    discount?: number;
}

interface CreateOrderRequest {
    orderName: string;
    items: OrderItem[];
    delete_current?: string;
}

export const createNewOrder = async (request: Request, res: Response) => {
    try {
        const { orderId } = request.query;
        const userId = request.user?.id;
        const partnerId = request.user?.partnerId;
        // Authentication check
        if (!userId || !partnerId) {
            return res.status(401).json({
                success: false,
                message: 'You are not authorized for this service!'
            });
        }
        const [namespace, key] = CacheNamespace.products.partner(partnerId);
        await redisCache.delete(namespace, key);
        const data: CreateOrderRequest = request.body;

        // reverse recent quantity
        if (data?.delete_current) {
            if (orderId) {

                const existingOrder = await prisma.orders.findUnique({
                    where: { id: parseInt(orderId.toString()) },
                    include: { 
                        orderItems: {
                            select: {
                                quantity: true,
                                product: true
                            }
                        }
                    }
                });

                if (!existingOrder) {
                    throw new Error('Order not found');
                }

                for (const item of existingOrder?.orderItems) {
                    if(item.product.itemTyCd !== "3"){
                        await prisma.product.update({
                            where: {
                                id: item.product.id,
                            },
                            data: {
                                currentStock: {
                                    increment: item.quantity ?? 0
                                }
                            }
                        })
                    }
                }
                // delete items
                await prisma.orderItems.deleteMany({
                    where: { orderId: parseInt(orderId.toString()) }
                });
                await prisma.orders.delete({
                    where: { id: parseInt(orderId.toString()) }
                })

                return res.status(200).json({
                    success: true,
                    message: 'Order deleted successfully',
                    data: null
                })

            } else {
                return res.status(200).json({
                    message: 'No order id provided'
                })
            }

        }

        // Input validation
        if (!data.orderName || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order name and at least one item are required'
            });
        }

        // get all discounts

        const discounts = await prisma.discounts.findMany({
            where: {
                isDeleted: false,
                productId: {
                    in: data.items.map((item) => item.productId)
                }
            }
        });

        const findDiscount = (productId: number, price: number): number => {
            const dis = discounts.find((discount) => discount.productId === productId)?.rate;
            if (dis) {
                return price - (price * dis) / 100;
            }
            return price;
        }
        // Validate items and calculate total
        let totalPrice = 0;
        const validatedItems: OrderItem[] = [];

        for (const item of data.items) {
            if (!item.productId || !item.quantity || !item.sellingPrice) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have productId, quantity, and sellingPrice'
                });
            }

            if (item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be greater than 0'
                });
            }

            if (item.sellingPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Selling price cannot be negative'
                });
            }

            const itemTotal = item.quantity * (findDiscount(item.productId, item.sellingPrice));
            totalPrice += itemTotal;
            validatedItems.push(item);
        }

        // Transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Check product availability and prepare stock updates
            const stockUpdates: { productId: number; quantity: number }[] = [];
            const stockOutRecords: Partial<StockOut>[] = [];

            // Verify stock availability and prepare updates
            for (const item of validatedItems) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, currentStock: true, name: true, itemTyCd: true }
                });

                if (!product) {
                    throw new Error(`Product with ID ${item.productId} not found`);
                }

                if (product.itemTyCd !== "3" && product.currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`);
                }

                stockUpdates.push({
                    productId: item.productId,
                    quantity: item.quantity
                });

                // stockOutRecords.push({
                //     productId: item.productId,
                //     quantity: item.quantity,
                //     userId: userId,
                //     reason: 'ORDER_SALE',
                //     sellingPrice: item.sellingPrice,
                //     totalPrice: item.quantity * item.sellingPrice,
                // });
            }

            // For upsert operation
            if (orderId) {
                const existingOrder = await tx.orders.findUnique({
                    where: {
                        id: parseInt(orderId.toString()),
                        // orderItems: {
                        //     none: {
                        //         status: "CANCELLED"
                        //     }
                        // }
                    },
                    include: {
                        orderItems:
                        {
                            select: {
                                quantity: true,
                                product: true
                            }
                        }
                    }
                });

                if (!existingOrder) {
                    throw new Error('Order not found');
                }
                if (existingOrder.status !== "PENDING") {
                    throw new Error(`This Order ${existingOrder.orderName} is already ${existingOrder.status}`);
                }

                if (existingOrder.userId !== userId && request.user?.role !== "MANAGER") {
                    throw new Error('Not authorized to update this order');
                }
                // reverse recent quantity
                for (const item of existingOrder.orderItems) {
                    if (item.product.itemTyCd !== "3")
                        await tx.product.update({
                            where: { id: item.product.id },
                            data: {
                                currentStock: {
                                    increment: item.quantity ?? 0
                                }
                            }
                        })

                }
                // Update product quantities
                for (const update of stockUpdates) {
                     const findp = await tx.product.findUnique(
                        {
                            where: {
                                id: update.productId
                            }
                        }
                    );
                    if(findp?.itemTyCd !== "3"){
                        await tx.product.update({
                            where: {
                                id: update.productId,
                                itemTyCd: { not: "3" }
                            },
                            data: {
                                currentStock: {
                                    decrement: update.quantity
                                }
                            }
                        });
                    } 
                }

                const itemIds = validatedItems.map(item => item.id);
                // delete all items not in the new order
                await tx.orderItems.deleteMany({
                    where: {
                        orderId: parseInt(orderId.toString()),
                        id: {
                            notIn: itemIds
                        }
                    }
                });

                // Update existing order items


                for (const item of validatedItems) {
                    await tx.orderItems.upsert({
                        where: {
                            id: item.id || -1
                        },
                        update: {
                            beverageType: item.beverageType as BeverageType,
                            productId: item.productId,
                            quantity: item.quantity,
                            sellingPrice: findDiscount(item.productId, item.sellingPrice),
                            totalPrice: item.quantity * findDiscount(item.productId, item.sellingPrice),
                        },
                        create: {
                            beverageType: item.beverageType as BeverageType,
                            productId: item.productId,
                            quantity: item.quantity,
                            sellingPrice: findDiscount(item.productId, item.sellingPrice),
                            totalPrice: item.quantity * findDiscount(item.productId, item.sellingPrice),
                            orderId: parseInt(orderId.toString())
                        }
                    })
                }

                // get all sum of orderitem price * quantity
                const getIt = await tx.orderItems.findMany({
                    where: {
                        orderId: parseInt(orderId.toString()),
                        status: {
                            not: "CANCELLED"
                        }
                    },
                    select: {
                        sellingPrice: true,
                        quantity: true
                    },
                })
                // update total price
                await tx.orders.update({
                    where: { id: parseInt(orderId.toString()) },
                    data: {
                        orderName: data.orderName,
                        totalPrice: getIt.reduce((acc, item) => acc + (item.sellingPrice * (item.quantity ?? 0)), 0)
                    }
                })
                return {
                    type: "UPDATED",
                    id: parseInt(orderId.toString())
                }
            } else {

                // Check is orderName is existed on pending Order
                const existingOrder = await tx.orders.findFirst({
                    where: {
                        partnerId: partnerId,
                        orderName: data.orderName,
                        status: "PENDING",
                    }
                });
                if (existingOrder) {
                    throw new Error('Order name already exists, please choose another name or Ask Manager To Confirm It.');
                }
                // Create new order first
                const newOrder = await tx.orders.create({
                    data: {
                        orderName: data.orderName,
                        status: "PENDING",
                        userId: userId,
                        partnerId: partnerId,
                        totalPrice: totalPrice,
                        orderItems: {
                            create: validatedItems.map(item => ({
                                beverageType: item.beverageType as BeverageType,
                                productId: item.productId,
                                quantity: item.quantity,
                                sellingPrice: findDiscount(item.productId, item.sellingPrice),
                                totalPrice: item.quantity * findDiscount(item.productId, item.sellingPrice)
                            }))
                        }
                    },
                    include: {
                        orderItems: true
                    }
                });

                // Update product quantities
                for (const update of stockUpdates) {
                    const findp = await tx.product.findUnique(
                        {
                            where: {
                                id: update.productId
                            }
                        }
                    );
                    if (findp?.itemTyCd !== "3") {
                        await tx.product.update({
                            where: { id: update.productId },
                            data: {
                                currentStock: {
                                    decrement: update.quantity
                                }
                            }
                        });
                    }

                }

                // Create stock out records with the new order ID
                // await tx.stockOut.createMany({
                //     data: stockOutRecords.map(record => ({
                //         productId: record.productId!,
                //         quantity: record.quantity!,
                //         userId: record.userId!,
                //         reason: record.reason!,
                //         sellingPrice: record.sellingPrice!,
                //         totalPrice: record.totalPrice!,
                //     }))
                // });

                // Return the order with updated product information
                return await tx.orders.findUnique({
                    where: { id: newOrder.id },
                    include: {
                        orderItems: {
                            include: {
                                product: {
                                    select: {
                                        name: true,
                                        currentStock: true
                                    }
                                }
                            }
                        },
                    }
                });
            }
        });

      return res.status(200).json({
            success: true,
            message: `Order ${orderId ? 'updated' : 'created'} successfully`,
            data: result
        });

    } catch (error: any) {
        console.error('Order creation error:', error);

        // Handle specific Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
               return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (error.code === 'P2002') {
               return res.status(400).json({
                    success: false,
                    message: 'Duplicate entry found'
                });
            }
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while creating order'
        });
    }
};

// Additional helper function to get order details
export const getOrderDetails = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const role = req.user?.role;
        const userId = req.user?.id;
        const orderDetail = req.query.orderDetail;
        if (!userId && !role) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        const order = await prisma.orders.findFirst({
            where: {
                id: parseInt(orderId),
                userId: (role === "MANAGER" || role === "PARTNER_ADMIN") ? undefined : userId,
                status: orderDetail ? undefined : "PENDING"
            },
            include: {
                invoices: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        tin: true,
                        paymentType: true
                    }
                },
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                itemCd: true,
                                beverageSize: true,
                                name: true,
                                price: true,
                                currentStock: true,
                                description: true,
                                image: true,
                                imageUrl: true,
                                beverageCategory: {
                                    select: {
                                        name: true,
                                        type: true
                                    }
                                },
                                discount: true
                            }
                        }
                    }
                },
            }
        });
        const newOrder = {
            id: order?.id,
            orderName: order?.orderName,
            createdAt: order?.createdAt,
            distributor: order?.userId,
            status: order?.status,
            orderCustomers: order?.invoices.map((customer) => ({
                id: customer.id,
                name: customer.name,
                mobile: customer.mobile,
                tin: customer.tin,
                paymentType: customer.paymentType
            })),
            orderItems: order?.orderItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                beverageType: item.beverageType,
                status: item.status,
                product: {
                    id: item.product.id,
                    itemCd: item.product.itemCd,
                    beverageSize: item.product.beverageSize,
                    beverageCategoryName: item.product.beverageCategory?.name,
                    beverageCategoryType: item.product.beverageCategory?.type,
                    name: item.product.name,
                    price: item.product.price,
                    currentStock: item.product.currentStock,
                    description: item.product.description,
                    image: item.product.image ? `${process.env.IMAGE_URL}/${item.product.image}` : item.product.imageUrl,
                    discount: item.product.discount
                }
            })
            )
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        return res.status(200).json(newOrder);
    } catch (error) {
        console.error('Get order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// get all orders for Manager

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const partnerId = req.user?.partnerId;
        const role = req.user?.role;


        const endDate = req.query.end as string;
        const startDate = req.query.start as string;
        const dateFilter: any = {};

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            dateFilter.gte = start;
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        // Only apply date filter if at least one date is provided
        const whereCondition: any = {
            partnerId: partnerId,
            userId: (role === 'MANAGER' || role === 'PARTNER_ADMIN') ? undefined : userId,
            orderItems: {
                some: {
                    product: {
                        partnerId: partnerId,
                    },
                }
            }
        };
        if (startDate || endDate) {
            whereCondition.createdAt = dateFilter;
        } else {
            whereCondition.createdAt = {
                gte: thisDay,
            };
        }


        if (!userId || !partnerId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        const orders = await prisma.orders.findMany({
            where: whereCondition,
            include: {
                orderItems: {
                    where: {
                        status: { not: "CANCELLED" }
                    },

                },
                invoices: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const newOrder = orders.map((order) => {
            return {
                id: order.id,
                name: order.orderName,
                status: order.status,
                createdAt: order.createdAt.toLocaleString(),
                distributor: order.userId,
                totalPrice: order.totalPrice,
                invoices: order.invoices,
            }
        });
        return res.json(newOrder);
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// get all orders by productId and date

export const getAllOrdersByProductAndDate = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const partnerId = req.user?.partnerId;
        const { productId, date } = req.params;
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        // Only apply date filter if at least one date is provided


        if (!userId || !partnerId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        const orders = await prisma.orders.findMany({
            where: {
                partnerId: partnerId,
                orderItems: {
                    some: {
                        product: {
                            partnerId: partnerId,
                            id: parseInt(productId)
                        }
                    }
                },
                createdAt: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                description: true,
                            }
                        }
                    }
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const newOrder = orders.map((order) => {
            return {
                id: order.id,
                name: order.orderName,
                status: order.status,
                createdAt: order.createdAt.toLocaleString(),
                distributor: order.userId,
                totalPrice: order.totalPrice,
            }
        });
        return res.json(newOrder);
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const getAllOrdersForOthers = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const partnerId = req.user?.partnerId;
        if (!userId || !partnerId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        const orders = await prisma.orders.findMany({
            where: {
                userId: userId,
                partnerId: partnerId,
                orderItems: {
                    some: {
                        product: {
                            partnerId: partnerId
                        }
                    }
                }
            },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                description: true,
                            }
                        }
                    }
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const newOrder = orders.map((order) => {
            return {
                id: order.id,
                name: order.orderName,
                status: order.status,
                createdAt: order.createdAt,
                distributor: order.userId,
                totalPrice: order.totalPrice,
            }
        });
        return res.json(newOrder);
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}



// change Order status

export const changeOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId, status } = req.body;
        const userId = req.user?.id;
        const partnerId = req.user?.partnerId;
        if (!userId || !partnerId) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        const [namespace, key] = CacheNamespace.products.partner(partnerId);
        await redisCache.delete(namespace, key);

        if (status === "CANCELLED") {
            await prisma.$transaction(async (tx) => {
                await tx.orders.update({
                    where: {
                        id: parseInt(orderId),
                    },
                    data: {
                        status: status
                    }
                });

                const existingOrder = await tx.orders.findUnique({
                    where: { id: parseInt(orderId.toString()) },
                    include: { orderItems: true }
                });

                if (!existingOrder) {
                    throw new Error('Order not found');
                }

                for (const item of existingOrder?.orderItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            currentStock: {
                                increment: item.quantity ?? 0
                            }
                        }
                    })
                }
            });
        } else if (status === "COMPLETED") {
            await prisma.$transaction(async (tx) => {
                await tx.orders.update({
                    where: {
                        id: parseInt(orderId),
                    },
                    data: {
                        status: status,
                        confirmedBy: userId,
                        confirmedAt: new Date()
                    }
                });
                const existingOrder = await tx.orders.findUnique({
                    where: { id: parseInt(orderId.toString()) },
                    include: { orderItems: true }
                });

                if (!existingOrder) {
                    throw new Error('Order not found');
                }
                for (const item of existingOrder?.orderItems) {
                    // create stockout
                    await tx.stockOut.create({
                        data: {
                            productId: item.productId,
                            quantity: item.quantity,
                            userId: userId,
                            reason: "ORDER",
                            status: 'SOLD',
                            sellingPrice: item.sellingPrice,
                            totalPrice: item.totalPrice,
                        }
                    })
                }
            })
        } else {
            await prisma.orders.update({
                where: {
                    id: parseInt(orderId),
                },
                data: {
                    status: status
                }
            });
        }
        return res.status(200).json({
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}
// stats

export const getOrderStats = async (req: Request, res: Response) => {
    const startDate = req.query.start as string;
    const endDate = req.query.end as string;

    try {
        const role = req.user?.role;
        const partnerId = req?.user?.partnerId;
        const userId = req?.user?.id;

        if (!role || !partnerId || !userId) {
            return res.status(401).json({ message: 'you are authorized for this service.' });
        }

        // Simple UTC date handling
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of day 30 days ago

        const whereClause: any = {
            partnerId: partnerId
        };

        // Only add date filter if dates are provided
        if (startDate || endDate) {
            whereClause.createdAt = {};

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                whereClause.createdAt.gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                whereClause.createdAt.lte = end;
            }
        } else {
            // Use default 30-day range
            whereClause.createdAt = {
                gte: thirtyDaysAgo,
                lte: today
            };
        }

        const orders = await prisma.orders.findMany({
            where: whereClause,
        });

        const recent5Orders = await prisma.orders.findMany({
            where: {
                partnerId: partnerId,
            },
            take: 5,
            orderBy: {
                createdAt: 'desc'
            }
        });


        // group by date
        const groupedOrders = orders.reduce((acc, order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(order);
            return acc;
        }, {} as { [key: string]: Orders[] });

        // calculate total sales for each date
        const salesData = Object.keys(groupedOrders).map((date) => {
            const orders = groupedOrders[date];
            const revenue = orders.reduce((acc, order) => {
                return acc + order.totalPrice;
            }, 0);
            const ordersCount = orders.length
            const averageOrderValue = revenue / ordersCount
            return { date, revenue, orders: ordersCount, averageOrderValue };
        })

        const dailyOrders = Object.keys(groupedOrders).map((date) => {
            const orders = groupedOrders[date];
            const ordersCount = orders.length
            const completed = orders.filter((order) => order.status === 'COMPLETED').length
            const cancelled = orders.filter((order) => order.status === 'CANCELLED').length
            return { date, orders: ordersCount, completed, cancelled };
        })
        const orderStatusData = [
            { name: "Completed", value: orders.filter((status) => status.status === 'COMPLETED').length, color: "#10b981" },
            { name: "Cancelled", value: orders.filter((status) => status.status === 'CANCELLED').length, color: "#ef4444" },
            { name: "Pending", value: orders.filter((status) => status.status === 'PENDING').length, color: "#6366f1" },
        ];

        const completeOrders = orders.filter((order) => order.status === "COMPLETED").length;
        const pendingOrders = orders.filter((order) => order.status === "PENDING").length;
        const cancelledOrders = orders.filter((order) => order.status === "CANCELLED").length;
        const totalOrders = orders.length;
        const successRate = (completeOrders / totalOrders) * 100;
        res.status(200).json({
            revenueData: salesData, dailyOrders, orderStatusData,
            countOrders: totalOrders,
            recent5Orders,
            qstats: {
                completeOrders: completeOrders,
                pendingOrders: pendingOrders,
                cancelledOrders: cancelledOrders,
                successRate: successRate ? successRate.toFixed(1).toString() + " %" : '0 %',
                revenues: orders.reduce((acc, order) => acc + order.totalPrice, 0)
            }
        })
    } catch (error) {
        return res.status(500).json({ message: 'there is an internal error' });
    }
}


export const changeOrderItemStatus = async (req: Request, res: Response) => {
    try {
        const { itemId, status } = req.body;
        const userId = req?.user?.id;
        const role = req?.user?.role;
        const partnerId = req?.user?.partnerId;
        if (!role || !partnerId || !userId) {
            return res.status(401).json({ message: 'you are authorized for this service.' });
        }


        const itemStatus = status.toString().toUpperCase();

        // check exist
        const orderItem = await prisma.orderItems.findUnique({
            where: {
                id: parseInt(itemId),
            }
        });

        if (!orderItem) {
            return res.status(404).json({ message: 'item not found' });
        }

        if ((itemStatus as orderItemStatus) === "CONFIRMED") {
            await prisma.$transaction(async (tx) => {
                if (orderItem.status === "CANCELLED") {
                    await tx.product.update({
                        where: {
                            id: orderItem.productId,
                        },
                        data: {
                            currentStock: {
                                decrement: orderItem.quantity ?? 0
                            }
                        }
                    });
                    await tx.orders.update({
                        where: {
                            id: orderItem.orderId,
                        },
                        data: {
                            totalPrice: {
                                increment: (orderItem.sellingPrice ?? 0) * (orderItem.quantity ?? 0)
                            }
                        }
                    }
                    )
                }
                await tx.orderItems.update({
                    where: {
                        id: parseInt(itemId),
                    },
                    data: {
                        status: "CONFIRMED"
                    }
                });
            });

        } else if ((itemStatus as orderItemStatus) === "CANCELLED") {

            await prisma.$transaction(async (tx) => {
                await tx.orderItems.update({
                    where: {
                        id: parseInt(itemId),
                    },
                    data: {
                        status: "CANCELLED"
                    }
                })

                await tx.product.update({
                    where: {
                        id: orderItem.productId,
                    },
                    data: {
                        currentStock: {
                            increment: orderItem.quantity ?? 0
                        }
                    }
                })


                await tx.orders.update({
                    where: {
                        id: orderItem.orderId,
                    },
                    data: {
                        totalPrice: {
                            decrement: (orderItem.sellingPrice ?? 0) * (orderItem.quantity ?? 0)
                        }
                    }

                })

            })
        }
        return res.status(200).json({ message: 'success' });

    } catch (error) {
        return res.status(500).json({ message: 'there is an internal error' });
    }
}



export const changeAllOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        const userId = req?.user?.id;
        const role = req?.user?.role;
        const partnerId = req?.user?.partnerId;
        if (!role || !partnerId || !userId) {
            return res.status(401).json({ message: 'you are authorized for this service.' });
        }

        // get all items

        const allitems = await prisma.orderItems.findMany({
            where: {
                orderId: parseInt(orderId),
            }
        });

        // update all items
        await prisma.$transaction(async (tx) => {
            // Process items sequentially
            for (const item of allitems) {
                if (item.status === "CANCELLED") {
                    // Usually you INCREMENT stock when items are cancelled
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            currentStock: {
                                decrement: item.quantity ?? 0  // Changed to increment
                            }
                        }
                    });

                    await tx.orders.update({
                        where: { id: item.orderId },
                        data: {
                            totalPrice: {
                                increment: (item.sellingPrice ?? 0) * (item.quantity ?? 0)
                            }
                        }
                    });
                }

                await tx.orderItems.update({
                    where: { id: item.id },
                    data: { status: "CONFIRMED" }
                });
            }
        });

        return res.status(200).json({ message: 'success' });

    } catch (error) {
        return res.status(500).json({ message: 'there is an internal error' });
    }
}