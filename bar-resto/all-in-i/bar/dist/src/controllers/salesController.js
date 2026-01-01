"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesController = void 0;
const ApiService_1 = require("../utils/ApiService");
exports.salesController = {
    //get all sales
    createNewSale: async (req, res) => {
        var _a;
        const headers = {
            'EbmToken': `Bearer ${(_a = req.context) === null || _a === void 0 ? void 0 : _a.ebm_token}`
        };
        const apiService = new ApiService_1.ApiService(headers);
        // convert body to json
        const { body } = req;
        const salesData = body;
        // try {
        //     const latestInvoiceId = await apiService.fetch<number>('/get-latest-invoice-id');
        //     const latestSalesId = await apiService.fetch<number>('/get-latest-sales-transaction-id');
        //     // 2. Prepare all customer data in parallel
        //     const customerDataPromises = salesData.customer.map(async (customer) => {
        //         const getitemCdNotCancelled = await prisma.orderItems.findMany({
        //             where: {
        //                 orderId: salesData.orderId,
        //                 status: { not: "CANCELLED" },
        //                 product: {
        //                     itemCd: { in: customer.items.map((item) => item.itemCd) }
        //                 }
        //             },
        //             select: { product: { select: { itemCd: true } } }
        //         });
        //         const getItemCd = getitemCdNotCancelled.map((item) => ({
        //             itemCd: item.product.itemCd
        //         }));
        //         const getItems = await apiService.fetch<ItemsList[]>('/get-items-by-itemCd', "POST", getItemCd);
        //         return {
        //             customer,
        //             items: getItems
        //         };
        //     });
        //     const preparedCustomers = await Promise.all(customerDataPromises);
        //     const allInvoFromSameOrder = await prisma.customerInvoices.findMany({
        //         where: {
        //             orderCustomer: {
        //                 orderId: salesData.orderId
        //             }
        //         },
        //         orderBy: { invcNo: 'desc' },
        //         select: { invcNo: true }
        //     });
        //     // 3. Make API calls
        //     const apiPromises = preparedCustomers.map(async (data, index) => {
        //         const { customer, items } = data;
        //         // Calculate totals
        //         function findProd(itemCd: string) {
        //             const result = customer.items.find((item) => item.itemCd === itemCd);
        //             return {
        //                 quantity: result?.quantity ?? 0,
        //                 price: result?.price ?? 0,
        //             }
        //         }
        //         // FOR TAXABLE A
        //         const taxableTotalA = items.filter((item) => item.taxTyCd === "A").reduce((acc, item) => acc + ((findProd(item.itemCd ?? '').price) * Number(findProd(item.itemCd ?? '').quantity)), 0);
        //         // FOR TAXABLE B
        //         const taxableTotalB = items.filter((item) => item.taxTyCd === "B").reduce((acc, item) => acc + ((findProd(item.itemCd ?? '').price) * Number(findProd(item.itemCd ?? '').quantity)), 0);
        //         const calCulateTaxB = Number((taxableTotalB * 18 / 118).toFixed(2));
        //         // FOR TAXABLE C
        //         const taxableTotalC = items.filter((item) => item.taxTyCd === "C").reduce((acc, item) => acc + ((findProd(item.itemCd ?? '').price) * Number(findProd(item.itemCd ?? '').quantity)), 0);
        //         // FOR TAXABLE D
        //         const taxableTotalD = items.filter((item) => item.taxTyCd === "D").reduce((acc, item) => acc + ((findProd(item.itemCd ?? '').price) * Number(findProd(item.itemCd ?? '').quantity)), 0);
        //         // total amount
        //         const totalAmount = items.reduce((acc, item) => acc + ((findProd(item.itemCd ?? '').price) * Number(findProd(item.itemCd ?? '').quantity)), 0);
        //         // Prepare salesTransaction
        //         const salesT = {
        //             invcNo: latestInvoiceId + index + 1, // increment invcNo by 1 for each customer
        //             orgInvcNo: 0,
        //             custTin: customer.tin,
        //             prcOrdCd: customer.prcOrdCd ?? null,
        //             custNm: customer.name,
        //             salesTyCd: salesData.salesTyCd.charAt(0),
        //             rcptTyCd: salesData.salesTyCd.charAt(1),
        //             pmtTyCd: customer.paymentType,
        //             salesSttsCd: "02",
        //             cfmDt: DateUtils.format(new Date),
        //             salesDt: DateUtils.formatToYYYYMMDD(new Date),
        //             stockRlsDt: null,
        //             cnclReqDt: null,
        //             cnclDt: null,
        //             rfdDt: null,
        //             rfdRsnCd: null,
        //             totItemCnt: customer.items.length,
        //             taxblAmtA: taxableTotalA,
        //             taxblAmtB: taxableTotalB,
        //             taxblAmtC: taxableTotalC,
        //             taxblAmtD: taxableTotalD,
        //             taxRtA: 0,
        //             taxRtB: 18,
        //             taxRtC: 0,
        //             taxRtD: 0,
        //             taxAmtA: 0,
        //             taxAmtB: calCulateTaxB,
        //             taxAmtC: 0,
        //             taxAmtD: 0,
        //             totTaxblAmt: totalAmount,
        //             totTaxAmt: calCulateTaxB,
        //             totAmt: totalAmount,
        //             prchrAcptcYn: "N",
        //             remark: null,
        //             regrId: "admin",
        //             regrNm: "admin",
        //             modrId: "admin",
        //             modrNm: "admin",
        //         }
        //         const receiptT = {
        //             custTIn: customer.tin,
        //             custMblNo: customer.mobile,
        //             rptNo: 1,
        //             trdeNm: salesData.trdeNm ?? null,
        //             adrs: salesData.address ?? null,
        //             topMsg: salesData.topMsg ?? null,
        //             btmMsg: salesData.btmMsg ?? null,
        //             prchrAcptcYn: "N"
        //         }
        //         const itemListT = items.map((item, index) => {
        //             const iteSeq = customer.items.find((i) => i.itemCd === item.itemCd);
        //             const totalAmount = (iteSeq?.quantity ?? 0) * (iteSeq?.price ?? 0);
        //             const totTaxAmount = item.taxTyCd === "B" ? Number((totalAmount * 18 / 118).toFixed(2)) : 0;
        //             return {
        //                 itemSeq: index + 1,
        //                 itemCd: item.itemCd ?? "",
        //                 itemClsCd: item.itemClsCd,
        //                 itemNm: iteSeq?.productName ?? "",
        //                 bcd: item.bcd,
        //                 pkgUnitCd: item.pkgUnitCd ?? "",
        //                 pkg: iteSeq?.quantity ?? 0,
        //                 qtyUnitCd: item.qtyUnitCd ?? "",
        //                 qty: iteSeq?.quantity ?? 0,
        //                 prc: iteSeq?.price ?? 0,
        //                 splyAmt: totalAmount,
        //                 dcRt: 0,
        //                 dcAmt: 0,
        //                 isrccCd: null,
        //                 isrccNm: null,
        //                 isrcRt: null,
        //                 isrcAmt: null,
        //                 taxTyCd: item.taxTyCd ?? "",
        //                 taxblAmt: totalAmount,
        //                 taxAmt: totTaxAmount,
        //                 totAmt: totalAmount,
        //             }
        //         });
        //         const salesTransaction: SalesTransaction = {
        //             ...salesT,
        //             receipt: {
        //                 ...receiptT
        //             },
        //             itemList: itemListT
        //         }
        //         // Make API call
        //         await apiService.fetch<ResultData>("/saveSales", "POST", { salesTransaction, allInvo: allInvoFromSameOrder?.map((it) => ({ invcNo: it.invcNo })) });
        //         if (salesData.salesTyCd === "NS") {
        //             const itemss = itemListT.map((item: any) => {
        //                 return {
        //                     itemCd: item.itemCd ?? "",
        //                     itemNm: item.itemNm ?? "",
        //                     price: item.prc ?? 0,
        //                     quantity: item.pkg ?? 0,
        //                 }
        //             })
        //             const stockOutItem: stockOutData = {
        //                 custNm: customer.name,
        //                 custTin: receiptT.custTIn,
        //                 stock: itemss,
        //                 userId: req.user?.id ?? "",
        //             };
        //             const stoctOut = new StockManagement(headers);
        //             await stoctOut.createStockOut(stockOutItem, '10', latestSalesId+index+1);
        //             await stoctOut.saveStockMaster(itemss.map(i => ({ itemCd: i.itemCd, quantity: i.quantity })), "OUT");
        //         }
        //     });
        //     await Promise.all(apiPromises);
        //     // 4. Execute database transaction (ONLY database operations)
        //     await prisma.$transaction(async (tx) => {
        //         const notExisted = await tx.orderCustomers.findMany({
        //             where: {
        //                 orderId: salesData.orderId,
        //                 id: {
        //                     notIn: salesData.customer.map((c) => c.id)
        //                 }
        //             }
        //         });
        //         if (notExisted?.length > 0) {
        //             await tx.customerInvoices.deleteMany({
        //                 where: {
        //                     orderCustomer: {
        //                         id: { in: notExisted.map((id) => id.id) }
        //                     }
        //                 }
        //             });
        //             await tx.orderCustomers.deleteMany({
        //                 where: { id: { in: notExisted.map((id) => id.id) } }
        //             });
        //         }
        //         // Process each customer
        //         for (const [index, data] of preparedCustomers.entries()) {
        //             const { customer, items } = data;
        //             const invcNo = latestInvoiceId ? latestInvoiceId : 0;
        //             const invcNoCounter = invcNo + index + 1;
        //             const customerExist = await tx.orderCustomers.findUnique({
        //                 where: {
        //                     id: customer.id,
        //                     orderId: salesData.orderId
        //                 }
        //             });
        //             if (customerExist) {
        //                 await tx.orderCustomers.update({
        //                     where: {
        //                         id: customer.id,
        //                         orderId: salesData.orderId
        //                     },
        //                     data: {
        //                         name: customer.name,
        //                         tin: customer.tin,
        //                         mobile: customer.mobile,
        //                         paymentType: customer.paymentType,
        //                     }
        //                 });
        //                 await tx.customerInvoices.create({
        //                     data: {
        //                         orderCustomerId: customerExist.id,
        //                         invcNo: invcNoCounter,
        //                         salesTyCd: salesData.salesTyCd,
        //                     }
        //                 })
        //             } else {
        //                 const insertUp = await tx.orderCustomers.create({
        //                     data: {
        //                         orderId: salesData.orderId,
        //                         name: customer.name,
        //                         tin: customer.tin,
        //                         mobile: customer.mobile,
        //                         paymentType: customer.paymentType,
        //                     }
        //                 });
        //                 await tx.customerInvoices.create({
        //                     data: {
        //                         orderCustomerId: insertUp.id,
        //                         invcNo: invcNoCounter,
        //                         salesTyCd: salesData.salesTyCd,
        //                     }
        //                 })
        //             }
        //         }
        //     }, {
        //         // Set reasonable timeout just in case
        //         timeout: 10000  // 10 seconds should be plenty for DB ops only
        //     });
        //     res.status(200).json({ message: "Sales saved successfully" });
        // } catch (err) {
        //     console.log(err);
        //     const error = err as { resultMsg: string };
        //     const errMessage = err as TypeError;
        //     res.status(500).json(err);
        // }
    },
    getInvoices: async (req, res) => {
        var _a;
        const body = req.body;
        const headers = {
            'EbmToken': `Bearer ${(_a = req.context) === null || _a === void 0 ? void 0 : _a.ebm_token}`
        };
        // try {
        //     if (!body.orderId || !body.type) {
        //         throw new Error("orderId and type are required");
        //     }
        //     const apiService = new ApiService(headers);
        //     //get latest invcNo from orderInvoices
        //     const getallInvo = await prisma.customerInvoices.groupBy({
        //         where: {
        //             orderCustomer: {
        //                 orderId: parseInt(body.orderId),
        //             },
        //             salesTyCd: body.type === "NR" ? "NS" : body.type === "TR" ? "TS" : body.type
        //         },
        //         by: ["orderCustomerId"],
        //         _max: {
        //             invcNo: true
        //         },
        //         orderBy: {
        //             _max: {
        //                 invcNo: 'desc'
        //             }
        //         },
        //     });
        //     const getallFreshInvo = await prisma.customerInvoices.groupBy({
        //         where: {
        //             orderCustomer: {
        //                 orderId: parseInt(body.orderId),
        //             },
        //             salesTyCd: body.type
        //         },
        //         by: ["orderCustomerId"],
        //         _max: {
        //             invcNo: true
        //         },
        //         orderBy: {
        //             _max: {
        //                 invcNo: 'desc'
        //             }
        //         },
        //     });
        //     if ((body.type === "NR" || body.type === "TR") && getallInvo.length === 0) {
        //         throw {
        //             message: `${body.type === "NR" ? "Normal Sale" : "Training Sale"} Invoice is not existed, You can not create Request For Refund without ${body.type === "NR" ? "Normal Sale" : "Training Sale"} Invoice`
        //         }
        //     }
        //     // get all Invo group by salesTyCd and order by invcNo desc
        //     const getallInvoByTyCd = await prisma.customerInvoices.groupBy({
        //         where: {
        //             orderCustomer: {
        //                 orderId: parseInt(body.orderId)
        //             }
        //         },
        //         by: ["salesTyCd"],
        //         _max: {
        //             invcNo: true
        //         },
        //         orderBy: {
        //             _max: {
        //                 invcNo: 'desc'
        //             }
        //         }
        //     })
        //     // get greatest invcNo from getallInvo
        //     const latestInvoiceId = getallInvoByTyCd[0];
        //     const invcNo = latestInvoiceId ? Number(latestInvoiceId._max.invcNo) : 0;
        //     const expectedNewInvId = [];
        //     for (let i = 1; i <= getallInvo.length; i++) {
        //         const orderCustomerId = getallInvo[i - 1].orderCustomerId;
        //         expectedNewInvId.push({ invcNo: invcNo + i, orderCustomerId: orderCustomerId });
        //     }
        //     const getGenerated = await apiService.fetch('/generate-transaction-invoice', "POST",
        //         {
        //             type: body.type,
        //             freshInv: getallFreshInvo.map((inv: any) => { return { invcNo: inv._max.invcNo } }),
        //             currentInv: getallInvo.map((inv: any) => { return { invcNo: inv._max.invcNo } }),
        //             allInvo: getallInvoByTyCd.map((inv) => { return { invcNo: inv._max.invcNo } }),
        //             ...(
        //                 body.rfdRsnCd ? { rfdRsnCd: body.rfdRsnCd } : {}
        //             )
        //         }
        //     );
        //     const response = await getGenerated as OutData;
        //     if ((response as OutData).status === 201) {
        //         for (const inv of expectedNewInvId) {
        //             await prisma.customerInvoices.upsert({
        //                 where: {
        //                     orderCustomerId: inv.orderCustomerId,
        //                     invcNo: inv.invcNo,
        //                     salesTyCd: body.type
        //                 },
        //                 update: {},
        //                 create: {
        //                     orderCustomerId: inv.orderCustomerId,
        //                     invcNo: inv.invcNo,
        //                     salesTyCd: body.type,
        //                 }
        //             })
        //         }
        //         const upStock = new StockManagement(headers);
        //         if(body.type === "NR") {
        //             await upStock.reverseStock(body.orderId);
        //         }
        //     }
        //     res.status(200).json({
        //         status: response.status,
        //         data: response.data
        //     });
        // } catch (error) {
        //     console.log(error);
        //     res.status(500).json({ message: (error as Error).message ?? (error as any).resultMsg ?? "Error getting invoices" });
        // }
    }
};
