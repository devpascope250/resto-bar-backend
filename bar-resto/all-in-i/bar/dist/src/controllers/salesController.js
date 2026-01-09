"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesController = void 0;
const ApiService_1 = require("../utils/ApiService");
const date_time_1 = require("../utils/date-time");
const prisma_1 = __importDefault(require("../lib/prisma"));
const StockManagement_1 = require("../services/StockManagement");
const taxRounding_1 = __importDefault(require("../utils/taxRounding"));
exports.salesController = {
    //get all sales
    createNewSale: async (req, res) => {
        var _a, _b;
        const headers = {
            'EbmToken': `Bearer ${(_a = req.context) === null || _a === void 0 ? void 0 : _a.ebm_token}`,
            'MRC-code': ((_b = req.context) === null || _b === void 0 ? void 0 : _b.mrc_code) || ''
        };
        const apiService = new ApiService_1.ApiService(headers);
        // convert body to json
        const { body } = req;
        const salesData = body;
        try {
            const latestInvoiceId = await apiService.fetch('/get-latest-invoice-id');
            console.log("the latestNumber", latestInvoiceId);
            // 2. Prepare all customer data in parallel
            const customerDataPromises = salesData.customer.map(async (customer) => {
                const getitemCdNotCancelled = await prisma_1.default.orderItems.findMany({
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
                const getItems = await apiService.fetch('/get-items-by-itemCd', "POST", getItemCd);
                return {
                    customer,
                    items: getItems,
                    discounts: getitemCdNotCancelled.map((item) => item.product)
                };
            });
            const preparedCustomers = await Promise.all(customerDataPromises);
            const allInvoFromSameOrder = await prisma_1.default.customerInvoices.findMany({
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
                var _a, _b, _c, _d, _e, _f, _g;
                const { customer, items, discounts } = data;
                // Helper functions
                function findProd(itemCd) {
                    var _a, _b, _c;
                    const result = customer.items.find((item) => item.itemCd === itemCd);
                    return {
                        quantity: (_a = result === null || result === void 0 ? void 0 : result.quantity) !== null && _a !== void 0 ? _a : 0,
                        price: (_b = result === null || result === void 0 ? void 0 : result.price) !== null && _b !== void 0 ? _b : 0,
                        productName: (_c = result === null || result === void 0 ? void 0 : result.productName) !== null && _c !== void 0 ? _c : "",
                    };
                }
                function calculateDiscount(itemCd, price) {
                    var _a;
                    const discount = (_a = discounts.find((item) => item.itemCd === itemCd)) === null || _a === void 0 ? void 0 : _a.discount;
                    if (discount === null || discount === void 0 ? void 0 : discount.rate) {
                        const discountAmount = (price * discount.rate) / 100;
                        const discountedPrice = price - discountAmount;
                        return {
                            originalPrice: price,
                            discountRate: discount.rate,
                            discountAmount: discountAmount,
                            discountedPrice: discountedPrice,
                            taxPrice: discountedPrice // For tax calculation
                        };
                    }
                    return {
                        originalPrice: price,
                        discountRate: 0,
                        discountAmount: 0,
                        discountedPrice: price,
                        taxPrice: price
                    };
                }
                // Calculate item-wise details
                const itemCalculations = items.map(item => {
                    var _a, _b;
                    const product = findProd((_a = item.itemCd) !== null && _a !== void 0 ? _a : '');
                    const discount = calculateDiscount((_b = item.itemCd) !== null && _b !== void 0 ? _b : '', product.price);
                    const quantity = product.quantity;
                    // Calculate amounts
                    const splyAmt = product.price * quantity; // Supply amount (before discount)
                    const dcAmt = discount.discountAmount * quantity; // Total discount amount
                    const taxblAmt = discount.discountedPrice * quantity; // Taxable amount (after discount)
                    // Calculate tax
                    let taxAmt = 0;
                    if (item.taxTyCd === "B") {
                        // For 18% tax included
                        taxAmt = (0, taxRounding_1.default)(taxblAmt * 18 / 118);
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
                    prcOrdCd: (_a = customer.prcOrdCd) !== null && _a !== void 0 ? _a : null,
                    custNm: customer.name,
                    salesTyCd: salesData.salesTyCd.charAt(0),
                    rcptTyCd: salesData.salesTyCd.charAt(1),
                    pmtTyCd: customer.paymentType,
                    salesSttsCd: "02",
                    cfmDt: date_time_1.DateUtils.format(new Date),
                    salesDt: date_time_1.DateUtils.formatToYYYYMMDD(new Date),
                    stockRlsDt: null,
                    cnclReqDt: null,
                    cnclDt: null,
                    rfdDt: null,
                    rfdRsnCd: null,
                    totItemCnt: customer.items.length,
                    taxblAmtA: (0, taxRounding_1.default)(taxableTotalA),
                    taxblAmtB: (0, taxRounding_1.default)(taxableTotalB),
                    taxblAmtC: (0, taxRounding_1.default)(taxableTotalC),
                    taxblAmtD: (0, taxRounding_1.default)(taxableTotalD),
                    taxRtA: 0,
                    taxRtB: 18,
                    taxRtC: 0,
                    taxRtD: 0,
                    taxAmtA: 0,
                    taxAmtB: (0, taxRounding_1.default)(taxAmtB),
                    taxAmtC: 0,
                    taxAmtD: 0,
                    totTaxblAmt: (0, taxRounding_1.default)(totalTaxblAmt),
                    totTaxAmt: (0, taxRounding_1.default)(totalTaxAmt),
                    totAmt: (0, taxRounding_1.default)(totalAmt),
                    prchrAcptcYn: "N",
                    remark: null,
                    regrId: "admin",
                    regrNm: "admin",
                    modrId: "admin",
                    modrNm: "admin",
                };
                const receiptT = {
                    custTIn: customer.tin,
                    custMblNo: customer.mobile,
                    rptNo: 1,
                    trdeNm: (_b = salesData.trdeNm) !== null && _b !== void 0 ? _b : null,
                    adrs: (_c = salesData.address) !== null && _c !== void 0 ? _c : null,
                    topMsg: (_d = salesData.topMsg) !== null && _d !== void 0 ? _d : null,
                    btmMsg: (_e = salesData.btmMsg) !== null && _e !== void 0 ? _e : null,
                    prchrAcptcYn: "N"
                };
                const itemListT = itemCalculations.map((calc, index) => {
                    var _a, _b, _c, _d;
                    return {
                        itemSeq: index + 1,
                        itemCd: (_a = calc.item.itemCd) !== null && _a !== void 0 ? _a : "",
                        itemClsCd: calc.item.itemClsCd,
                        itemNm: calc.product.productName,
                        bcd: calc.item.bcd,
                        pkgUnitCd: (_b = calc.item.pkgUnitCd) !== null && _b !== void 0 ? _b : "",
                        pkg: calc.quantity,
                        qtyUnitCd: (_c = calc.item.qtyUnitCd) !== null && _c !== void 0 ? _c : "",
                        qty: calc.quantity,
                        prc: calc.product.price,
                        splyAmt: (0, taxRounding_1.default)(calc.splyAmt),
                        dcRt: calc.discount.discountRate,
                        dcAmt: (0, taxRounding_1.default)(calc.dcAmt),
                        isrccCd: null,
                        isrccNm: null,
                        isrcRt: null,
                        isrcAmt: null,
                        taxTyCd: (_d = calc.taxType) !== null && _d !== void 0 ? _d : "",
                        taxblAmt: (0, taxRounding_1.default)(calc.taxblAmt),
                        taxAmt: (0, taxRounding_1.default)(calc.taxAmt),
                        totAmt: (0, taxRounding_1.default)(calc.totAmt),
                    };
                });
                const salesTransaction = Object.assign(Object.assign({}, salesT), { receipt: Object.assign({}, receiptT), itemList: itemListT });
                // Make API call
                await apiService.fetch("/saveSales", "POST", { salesTransaction, allInvo: allInvoFromSameOrder === null || allInvoFromSameOrder === void 0 ? void 0 : allInvoFromSameOrder.map((it) => ({ invcNo: it.invcNo })) });
                if (salesData.salesTyCd === "NS") {
                    const itemss = itemListT.map((item) => {
                        var _a, _b, _c, _d;
                        return {
                            itemCd: (_a = item.itemCd) !== null && _a !== void 0 ? _a : "",
                            itemNm: (_b = item.itemNm) !== null && _b !== void 0 ? _b : "",
                            price: (_c = item.prc) !== null && _c !== void 0 ? _c : 0,
                            quantity: (_d = item.pkg) !== null && _d !== void 0 ? _d : 0,
                        };
                    });
                    const stockOutItem = {
                        custNm: customer.name,
                        custTin: receiptT.custTIn,
                        stock: itemss,
                        userId: (_g = (_f = req.user) === null || _f === void 0 ? void 0 : _f.id) !== null && _g !== void 0 ? _g : "",
                    };
                    const stoctOut = new StockManagement_1.StockManagement(headers);
                    await stoctOut.createStockOut(stockOutItem, '10');
                    await stoctOut.saveStockMaster(itemss.map(i => ({ itemCd: i.itemCd, quantity: i.quantity })), "OUT");
                }
            });
            await Promise.all(apiPromises);
            // 4. Execute database transaction (ONLY database operations)
            await prisma_1.default.$transaction(async (tx) => {
                const notExisted = await tx.orderCustomers.findMany({
                    where: {
                        orderId: salesData.orderId,
                        id: {
                            notIn: salesData.customer.map((c) => c.id)
                        }
                    }
                });
                if ((notExisted === null || notExisted === void 0 ? void 0 : notExisted.length) > 0) {
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
                        });
                    }
                    else {
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
                        });
                    }
                }
            }, {
                // Set reasonable timeout just in case
                timeout: 10000 // 10 seconds should be plenty for DB ops only
            });
            res.status(200).json({ message: "Sales saved successfully" });
        }
        catch (err) {
            console.log(err);
            const error = err;
            const errMessage = err;
            res.status(500).json(err);
        }
    },
    getInvoices: async (req, res) => {
        var _a, _b, _c, _d;
        const body = req.body;
        const headers = {
            'EbmToken': `Bearer ${(_a = req.context) === null || _a === void 0 ? void 0 : _a.ebm_token}`,
            'MRC-code': ((_b = req.context) === null || _b === void 0 ? void 0 : _b.mrc_code) || ''
        };
        const apiService = new ApiService_1.ApiService(headers);
        const latestInvoiceId = await apiService.fetch('/get-latest-invoice-id');
        try {
            if (!body.orderId || !body.type) {
                throw new Error("orderId and type are required");
            }
            //get latest invcNo from orderInvoices
            const getallInvo = await prisma_1.default.customerInvoices.groupBy({
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
            const getallFreshInvo = await prisma_1.default.customerInvoices.groupBy({
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
                };
            }
            // get all Invo group by salesTyCd and order by invcNo desc
            const getallInvoByTyCd = await prisma_1.default.customerInvoices.groupBy({
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
            const getGenerated = await apiService.fetch('/generate-transaction-invoice', "POST", Object.assign(Object.assign({ type: body.type, freshInv: getallFreshInvo.map((inv) => { return { invcNo: inv._max.invcNo }; }), currentInv: getallInvo.map((inv) => { return { invcNo: inv._max.invcNo }; }), allInvo: getallInvoByTyCd.map((inv) => { return { invcNo: inv._max.invcNo }; }) }, (body.rfdRsnCd ? { rfdRsnCd: body.rfdRsnCd } : {})), { custData: body.custData }));
            const response = await getGenerated;
            if (response.status === 201) {
                for (const inv of expectedNewInvId) {
                    await prisma_1.default.customerInvoices.upsert({
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
                    });
                }
                const upStock = new StockManagement_1.StockManagement(headers);
                if (body.type === "NR") {
                    await upStock.reverseStock(body.orderId);
                }
            }
            res.status(200).json({
                status: response.status,
                data: response.data
            });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: (_d = (_c = error.message) !== null && _c !== void 0 ? _c : error.resultMsg) !== null && _d !== void 0 ? _d : "Error getting invoices" });
        }
    }
};
