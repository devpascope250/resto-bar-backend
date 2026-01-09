import { Request, Response } from "express";
import { ApiService } from "../utils/ApiService";
import { ItemsList } from "@/types/models/ItemsList";
import { SalesTransaction } from "@/types/models/SalesTransaction";
import { DateUtils } from "../utils/date-time";
import prisma from "../lib/prisma";
import { ResultData } from "@/types/models/data-clt";
import { StockManagement, stockOutData } from "../services/StockManagement";
import taxRounder from "../utils/taxRounding";
import { RegenerateGetCurrent } from "../services/regenerateGetCurrent";
interface Sales {
    customer: Customer[],
    salesTyCd: string,
    orderId: number,
    address?: string,
    topMsg?: string,
    btmMsg?: string,
    trdeNm?: string,
}
interface Customer {
    id: number,
    name: string,
    tin: string,
    prcOrdCd?: string;
    paymentType: string,
    mobile: string,
    amount: number,
    items: Item[]
}
interface Item {
    productId: number;
    itemCd: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}
export interface OutData {
    status: number,
    data: any[]
}
export const salesController = {
    //get all sales
    createNewSale: async (req: Request, res: Response) => {
        const headers = {
            'EbmToken': `Bearer ${req.context?.ebm_token}`,
            'MRC-code': req.context?.mrc_code || ''

        }
        const apiService = new ApiService(headers);
        // convert body to json
        const { body } = req;
        const salesData = body as Sales;

        try {
            const latestInvoiceId = await apiService.fetch<number>('/get-latest-invoice-id');

            console.log("the latestNumber", latestInvoiceId);

            // 2. Prepare all customer data in parallel
            const customerDataPromises = salesData.customer.map(async (customer) => {
                const getitemCdNotCancelled = await prisma.orderItems.findMany({
                    where: {
                        orderId: salesData.orderId,
                        status: { not: "CANCELLED" },
                        product: {
                            itemCd: { in: customer.items.map((item) => item.itemCd) }
                        }
                    },
                    select: { product: { select: { itemCd: true, discount: true } } }
                });

                const getItemCd = getitemCdNotCancelled.map((item) => ({
                    itemCd: item.product.itemCd
                }));

                const getItems = await apiService.fetch<ItemsList[]>('/get-items-by-itemCd', "POST", getItemCd);

                return {
                    customer,
                    items: getItems,
                    discounts: getitemCdNotCancelled.map((item) => item.product)
                };
            });

            const preparedCustomers = await Promise.all(customerDataPromises);

            const allInvoFromSameOrder = await prisma.customerInvoices.findMany({
                where: {
                    orderCustomer: {
                        orderId: salesData.orderId
                    }
                },
                orderBy: { invcNo: 'desc' },
                select: { invcNo: true }
            });


            // 3. Make API calls
            const apiPromises = preparedCustomers.map(async (data, index) => {
                const { customer, items, discounts } = data;

                // Helper functions
                function findProd(itemCd: string) {
                    const result = customer.items.find((item) => item.itemCd === itemCd);
                    return {
                        quantity: result?.quantity ?? 0,
                        price: result?.price ?? 0,
                        productName: result?.productName ?? "",
                    }
                }

                function calculateDiscount(itemCd: string, price: number) {
                    const discount = discounts.find((item) => item.itemCd === itemCd)?.discount;
                    if (discount?.rate) {
                        const discountAmount = (price * discount.rate) / 100;
                        const discountedPrice = price - discountAmount;
                        return {
                            originalPrice: price,
                            discountRate: discount.rate,
                            discountAmount: discountAmount,
                            discountedPrice: discountedPrice,
                            taxPrice: discountedPrice // For tax calculation
                        }
                    }
                    return {
                        originalPrice: price,
                        discountRate: 0,
                        discountAmount: 0,
                        discountedPrice: price,
                        taxPrice: price
                    }
                }

                // Calculate item-wise details
                const itemCalculations = items.map(item => {
                    const product = findProd(item.itemCd ?? '');
                    const discount = calculateDiscount(item.itemCd ?? '', product.price);
                    const quantity = product.quantity;

                    // Calculate amounts
                    const splyAmt = product.price * quantity; // Supply amount (before discount)
                    const dcAmt = discount.discountAmount * quantity; // Total discount amount
                    const taxblAmt = discount.discountedPrice * quantity; // Taxable amount (after discount)

                    // Calculate tax
                    let taxAmt = 0;
                    if (item.taxTyCd === "B") {
                        // For 18% tax included
                        taxAmt = taxRounder(taxblAmt * 18 / 118);
                    }
                    // else if (item.taxTyCd === "A") {
                    //     // For 18% tax excluded
                    //     taxAmt = taxRounder(taxblAmt * 18 / 100);
                    // }

                    const totAmt = taxblAmt; // Total amount (taxblAmt for tax-inclusive items)

                    return {
                        item,
                        product,
                        discount,
                        quantity,
                        splyAmt,
                        dcAmt,
                        taxblAmt,
                        taxAmt,
                        totAmt,
                        taxType: item.taxTyCd
                    };
                });

                // Calculate totals
                const taxableTotalA = itemCalculations
                    .filter(calc => calc.taxType === "A")
                    .reduce((acc, calc) => acc + calc.taxblAmt, 0);

                const taxableTotalB = itemCalculations
                    .filter(calc => calc.taxType === "B")
                    .reduce((acc, calc) => acc + calc.taxblAmt, 0);

                const taxAmtB = itemCalculations
                    .filter(calc => calc.taxType === "B")
                    .reduce((acc, calc) => acc + calc.taxAmt, 0);

                const taxableTotalC = itemCalculations
                    .filter(calc => calc.taxType === "C")
                    .reduce((acc, calc) => acc + calc.taxblAmt, 0);

                const taxableTotalD = itemCalculations
                    .filter(calc => calc.taxType === "D")
                    .reduce((acc, calc) => acc + calc.taxblAmt, 0);

                // Calculate final totals
                const totalTaxblAmt = itemCalculations.reduce((acc, calc) => acc + calc.taxblAmt, 0);
                const totalTaxAmt = itemCalculations.reduce((acc, calc) => acc + calc.taxAmt, 0);
                const totalAmt = totalTaxblAmt; // This should match totTaxblAmt for tax-inclusive system

                // Prepare salesTransaction
                const salesT = {
                    invcNo: Number(latestInvoiceId) + index + 1,
                    orgInvcNo: 0,
                    custTin: customer.tin,
                    prcOrdCd: customer.prcOrdCd ?? null,
                    custNm: customer.name,
                    salesTyCd: salesData.salesTyCd.charAt(0),
                    rcptTyCd: salesData.salesTyCd.charAt(1),
                    pmtTyCd: customer.paymentType,
                    salesSttsCd: "02",
                    cfmDt: DateUtils.format(new Date),
                    salesDt: DateUtils.formatToYYYYMMDD(new Date),
                    stockRlsDt: null,
                    cnclReqDt: null,
                    cnclDt: null,
                    rfdDt: null,
                    rfdRsnCd: null,
                    totItemCnt: customer.items.length,
                    taxblAmtA: taxRounder(taxableTotalA),
                    taxblAmtB: taxRounder(taxableTotalB),
                    taxblAmtC: taxRounder(taxableTotalC),
                    taxblAmtD: taxRounder(taxableTotalD),
                    taxRtA: 0,
                    taxRtB: 18,
                    taxRtC: 0,
                    taxRtD: 0,
                    taxAmtA: 0,
                    taxAmtB: taxRounder(taxAmtB),
                    taxAmtC: 0,
                    taxAmtD: 0,
                    totTaxblAmt: taxRounder(totalTaxblAmt),
                    totTaxAmt: taxRounder(totalTaxAmt),
                    totAmt: taxRounder(totalAmt),
                    prchrAcptcYn: "N",
                    remark: null,
                    regrId: "admin",
                    regrNm: "admin",
                    modrId: "admin",
                    modrNm: "admin",
                }

                const receiptT = {
                    custTIn: customer.tin,
                    custMblNo: customer.mobile,
                    rptNo: 1,
                    trdeNm: salesData.trdeNm ?? null,
                    adrs: salesData.address ?? null,
                    topMsg: salesData.topMsg ?? null,
                    btmMsg: salesData.btmMsg ?? null,
                    prchrAcptcYn: "N"
                }

                const itemListT = itemCalculations.map((calc, index) => {
                    return {
                        itemSeq: index + 1,
                        itemCd: calc.item.itemCd ?? "",
                        itemClsCd: calc.item.itemClsCd,
                        itemNm: calc.product.productName,
                        bcd: calc.item.bcd,
                        pkgUnitCd: calc.item.pkgUnitCd ?? "",
                        pkg: calc.quantity,
                        qtyUnitCd: calc.item.qtyUnitCd ?? "",
                        qty: calc.quantity,
                        prc: calc.product.price,
                        splyAmt: taxRounder(calc.splyAmt),
                        dcRt: calc.discount.discountRate,
                        dcAmt: taxRounder(calc.dcAmt),
                        isrccCd: null,
                        isrccNm: null,
                        isrcRt: null,
                        isrcAmt: null,
                        taxTyCd: calc.taxType ?? "",
                        taxblAmt: taxRounder(calc.taxblAmt),
                        taxAmt: taxRounder(calc.taxAmt),
                        totAmt: taxRounder(calc.totAmt),
                    }
                });

                const salesTransaction: SalesTransaction = {
                    ...salesT,
                    receipt: { ...receiptT },
                    itemList: itemListT
                }

                // Make API call
                await apiService.fetch<ResultData>("/saveSales", "POST", { salesTransaction, allInvo: allInvoFromSameOrder?.map((it) => ({ invcNo: it.invcNo })) });

                if (salesData.salesTyCd === "NS") {
                    const itemss = itemListT.map((item: any) => {
                        return {
                            itemCd: item.itemCd ?? "",
                            itemNm: item.itemNm ?? "",
                            price: item.prc ?? 0,
                            quantity: item.pkg ?? 0,
                        }
                    })
                    const stockOutItem: stockOutData = {
                        custNm: customer.name,
                        custTin: receiptT.custTIn,
                        stock: itemss,
                        userId: req.user?.id ?? "",
                    };
                    const stoctOut = new StockManagement(headers);
                    await stoctOut.createStockOut(stockOutItem, '10');
                    await stoctOut.saveStockMaster(itemss.map(i => ({ itemCd: i.itemCd, quantity: i.quantity })), "OUT");
                }
            });
            await Promise.all(apiPromises);

            // 4. Execute database transaction (ONLY database operations)
            await prisma.$transaction(async (tx) => {
                const notExisted = await tx.orderCustomers.findMany({
                    where: {
                        orderId: salesData.orderId,
                        id: {
                            notIn: salesData.customer.map((c) => c.id)
                        }
                    }
                });

                if (notExisted?.length > 0) {
                    await tx.customerInvoices.deleteMany({
                        where: {
                            orderCustomer: {
                                id: { in: notExisted.map((id) => id.id) }
                            }
                        }
                    });
                    await tx.orderCustomers.deleteMany({
                        where: { id: { in: notExisted.map((id) => id.id) } }
                    });
                }

                // Process each customer
                for (const [index, data] of preparedCustomers.entries()) {
                    const { customer, items } = data;
                    const invcNoCounter = Number(latestInvoiceId) + index + 1;

                    const customerExist = await tx.orderCustomers.findUnique({
                        where: {
                            id: customer.id,
                            orderId: salesData.orderId
                        }
                    });
                    if (customerExist) {
                        await tx.orderCustomers.update({
                            where: {
                                id: customer.id,
                                orderId: salesData.orderId
                            },
                            data: {
                                name: customer.name,
                                tin: customer.tin,
                                mobile: customer.mobile,
                                paymentType: customer.paymentType,
                            }
                        });

                        await tx.customerInvoices.create({
                            data: {
                                orderCustomerId: customerExist.id,
                                invcNo: invcNoCounter,
                                salesTyCd: salesData.salesTyCd,
                            }
                        })
                    } else {
                        const insertUp = await tx.orderCustomers.create({
                            data: {
                                orderId: salesData.orderId,
                                name: customer.name,
                                tin: customer.tin,
                                mobile: customer.mobile,
                                paymentType: customer.paymentType,
                            }
                        });
                        await tx.customerInvoices.create({
                            data: {
                                orderCustomerId: insertUp.id,
                                invcNo: invcNoCounter,
                                salesTyCd: salesData.salesTyCd,
                            }
                        })
                    }
                }
            }, {
                // Set reasonable timeout just in case
                timeout: 10000  // 10 seconds should be plenty for DB ops only
            });
            res.status(200).json({ message: "Sales saved successfully" });
        } catch (err) {
            console.log(err);

            const error = err as { resultMsg: string };
            const errMessage = err as TypeError;
            res.status(500).json(err);
        }
    },
    getInvoices: async (req: Request, res: Response) => {
        const body = req.body;
        const headers = {
            'EbmToken': `Bearer ${req.context?.ebm_token}`,
            'MRC-code': req.context?.mrc_code || ''
        }
        const regenerate = new RegenerateGetCurrent();
        let currentIncrement = 0;
        const maxRetries = 5; // Set a maximum to prevent infinite loops

        const fetchWithRetry = async (): Promise<any> => {
            while (currentIncrement <= maxRetries) {
                try {
                    const response = await regenerate.getReceipts(headers, body, currentIncrement);
                    console.log(`success with increment ${currentIncrement}`, response);
                    return response;
                } catch (err: any) {
                    console.log(`attempt ${currentIncrement} failed`, err);

                    if (err?.resultCd === 924 && currentIncrement < maxRetries) {
                        // Increase increment by 1 for next retry
                        currentIncrement++;
                        console.log(`Retrying with increment ${currentIncrement}`);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                        continue; // Try again with new increment
                    }
                    throw err; // Either not error 924 or reached max retries
                }
            }
            throw new Error(`Max retries (${maxRetries}) exceeded`);
        }

        try {
            const response = await fetchWithRetry();
            res.json(response);
        } catch (err: any) {
            console.log("failed after all retries", err);
            res.status(500).json(err);
        }
    }

}