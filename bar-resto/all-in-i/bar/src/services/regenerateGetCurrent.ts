import { OutData } from "../controllers/salesController";
import prisma from "../lib/prisma";
import { ApiService } from "../utils/ApiService";
import { StockManagement } from "./StockManagement";
export class RegenerateGetCurrent {
    async getReceipts(headers: any, body: any, increment?: number) {
        const apiService = new ApiService(headers);
        const latestInvoiceId = await apiService.fetch<number>('/get-latest-invoice-id');
        try {
            if (!body.orderId || !body.type) {
                throw new Error("orderId and type are required");
            }


            //get latest invcNo from orderInvoices
            const getallInvo = await prisma.customerInvoices.groupBy({
                where: {
                    orderCustomer: {
                        orderId: parseInt(body.orderId),
                    },
                    salesTyCd: body.type === "NR" ? "NS" : body.type === "TR" ? "TS" : body.type
                },
                by: ["orderCustomerId"],
                _max: {
                    invcNo: true
                },
                orderBy: {
                    _max: {
                        invcNo: 'desc'
                    }
                },

            });




            const getallFreshInvo = await prisma.customerInvoices.groupBy({
                where: {
                    orderCustomer: {
                        orderId: parseInt(body.orderId),
                    },
                    salesTyCd: body.type
                },
                by: ["orderCustomerId"],
                _max: {
                    invcNo: true
                },
                orderBy: {
                    _max: {
                        invcNo: 'desc'
                    }
                },

            });

            if ((body.type === "NR" || body.type === "TR") && getallInvo.length === 0) {
                throw {
                    message: `${body.type === "NR" ? "Normal Sale" : "Training Sale"} Invoice is not existed, You can not create Request For Refund without ${body.type === "NR" ? "Normal Sale" : "Training Sale"} Invoice`
                }
            }

            // get all Invo group by salesTyCd and order by invcNo desc
            const getallInvoByTyCd = await prisma.customerInvoices.groupBy({
                where: {
                    orderCustomer: {
                        orderId: parseInt(body.orderId)
                    }
                },
                by: ["salesTyCd"],
                _max: {
                    invcNo: true
                },
                orderBy: {
                    _max: {
                        invcNo: 'desc'
                    }
                }
            });




            // get greatest invcNo from getallInvo
            const expectedNewInvId = [];
            for (let i = 1; i <= getallInvo.length; i++) {
                const orderCustomerId = getallInvo[i - 1].orderCustomerId;
                expectedNewInvId.push({ invcNo: Number(latestInvoiceId) + 1, orderCustomerId: orderCustomerId });
            }

            const getGenerated = await apiService.fetch('/generate-transaction-invoice', "POST",
                {
                    type: body.type,
                    freshInv: getallFreshInvo.map((inv: any) => { return { invcNo: inv._max.invcNo } }),
                    currentInv: getallInvo.map((inv: any) => { return { invcNo: inv._max.invcNo } }),
                    allInvo: getallInvoByTyCd.map((inv) => { return { invcNo: inv._max.invcNo } }),
                    ...(
                        body.rfdRsnCd ? { rfdRsnCd: body.rfdRsnCd } : {}
                    ),
                    custData: body.custData,
                    ...(
                        increment ? { increment: increment } : {}
                    )
                }
            );


            const response = await getGenerated as OutData;
            if ((response as OutData).status === 201) {
                for (const inv of expectedNewInvId) {
                    await prisma.customerInvoices.upsert({
                        where: {
                            orderCustomerId: inv.orderCustomerId,
                            invcNo: inv.invcNo,
                            salesTyCd: body.type

                        },
                        update: {},
                        create: {
                            orderCustomerId: inv.orderCustomerId,
                            invcNo: inv.invcNo,
                            salesTyCd: body.type,
                        }
                    })
                }
                const upStock = new StockManagement(headers);

                if (body.type === "NR") {
                    await upStock.reverseStock(body.orderId);
                }
            }
            return {
                status: response.status,
                data: response.data
            };
        } catch (error) {
            const code = error as ({ resultCd: string, resultMsg: string });
            if (code.resultCd === "924") {
                throw {resultCd: 924}
            }
            throw {resultCd: 500, message: (error as Error).message ?? (error as any).resultMsg ?? "Error getting invoices" };
        }
    }
}