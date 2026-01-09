"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockManagement = void 0;
const ApiService_1 = require("../utils/ApiService");
const date_time_1 = require("../utils/date-time");
const prisma_1 = __importDefault(require("../lib/prisma"));
const taxRounding_1 = __importDefault(require("../utils/taxRounding"));
class StockManagement extends ApiService_1.ApiService {
    constructor(headers) {
        super(headers);
        this.getItemsByItemCd = async (itemCd) => {
            const results = await this.fetch('/get-items-by-itemCd', "POST", itemCd);
            return results;
        };
        this.currentStock = async (itemCd, type, mode) => {
            const getproducts = await prisma_1.default.product.findMany({
                where: {
                    itemCd: {
                        in: itemCd.map((id) => id.itemCd),
                    }
                },
                select: {
                    itemCd: true,
                    currentStock: true
                }
            });
            if (type === "IN" && mode !== "CREATE") {
                await prisma_1.default.$transaction(async (tx) => {
                    var _a, _b;
                    for (const item of itemCd) {
                        if ((item.quantity !== undefined && item.quantity !== 0)) {
                            await tx.product.update({
                                where: {
                                    itemCd: (_a = item.itemCd) !== null && _a !== void 0 ? _a : ""
                                },
                                data: {
                                    currentStock: {
                                        increment: (_b = item.quantity) !== null && _b !== void 0 ? _b : 0
                                    },
                                }
                            });
                        }
                    }
                });
            }
            const productsWithQuantity = getproducts.map(product => {
                var _a;
                {
                    const item = itemCd.find(i => i.itemCd === product.itemCd);
                    return {
                        itemCd: product.itemCd,
                        currentStock: (type === "IN" && mode !== "CREATE") ? product.currentStock + ((_a = item === null || item === void 0 ? void 0 : item.quantity) !== null && _a !== void 0 ? _a : 0) : product.currentStock
                    };
                }
            });
            return productsWithQuantity;
        };
        this.createStockIn = async (ItemDt, stockinType) => {
            const itemData = await this.getItemsByItemCd(ItemDt.map(item => ({ itemCd: item.itemCd })));
            const getSingleItem = (itemCd) => itemData.find(item => item.itemCd === itemCd);
            const getSingleItemFromItemDt = (itemCd) => ItemDt.find(item => item.itemCd === itemCd);
            const TotalTaxableAmount = ItemDt.reduce((acc, item) => { var _a; return acc + (item === null || item === void 0 ? void 0 : item.itemCd) ? (((_a = getSingleItem(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _a === void 0 ? void 0 : _a.taxTyCd) === "B" ? (item.price * item.quantity) : 0) : 0; }, 0);
            const TotalTaxAmount = TotalTaxableAmount * 18 / 118;
            const TotalAmount = ItemDt.reduce((acc, item) => acc + item.price, 0);
            const stockInData = {
                regTyCd: 'A',
                custTin: null,
                custNm: null,
                custBhfId: null,
                sarTyCd: stockinType,
                ocrnDt: date_time_1.DateUtils.formatToYYYYMMDD(new Date()),
                totItemCnt: itemData.length,
                totTaxblAmt: TotalTaxableAmount,
                totTaxAmt: (0, taxRounding_1.default)(TotalTaxAmount),
                totAmt: TotalAmount,
                remark: null,
                regrNm: "admin",
                regrId: "admin",
                modrNm: "admin",
                modrId: "admin",
                itemList: itemData.map((item, index) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
                    return ({
                        itemSeq: index + 1,
                        itemCd: item.itemCd,
                        itemClsCd: item.itemClsCd,
                        itemNm: (_b = (item.itemCd ? (_a = getSingleItemFromItemDt(item.itemCd)) === null || _a === void 0 ? void 0 : _a.itemNm : "")) !== null && _b !== void 0 ? _b : "",
                        bcd: item.bcd,
                        pkgUnitCd: item.pkgUnitCd,
                        pkg: (_e = (_c = item.pkg) !== null && _c !== void 0 ? _c : ((item === null || item === void 0 ? void 0 : item.itemCd) ? (_d = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _d === void 0 ? void 0 : _d.quantity : 0)) !== null && _e !== void 0 ? _e : 0,
                        qtyUnitCd: item.qtyUnitCd,
                        qty: (_g = ((item === null || item === void 0 ? void 0 : item.itemCd) ? (_f = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _f === void 0 ? void 0 : _f.quantity : 0)) !== null && _g !== void 0 ? _g : 0,
                        itemExprDt: item.itemExprDt,
                        prc: (_j = ((item === null || item === void 0 ? void 0 : item.itemCd) ? (_h = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _h === void 0 ? void 0 : _h.price : 0)) !== null && _j !== void 0 ? _j : 0,
                        splyAmt: TotalAmount,
                        totDcAmt: 0,
                        taxblAmt: item.taxTyCd === "B" ? (((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_l = (_k = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _k === void 0 ? void 0 : _k.price) !== null && _l !== void 0 ? _l : 0) : 0) * ((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_o = (_m = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _m === void 0 ? void 0 : _m.quantity) !== null && _o !== void 0 ? _o : 0) : 0)) : 0,
                        taxTyCd: item.taxTyCd,
                        taxAmt: (0, taxRounding_1.default)(item.taxTyCd === "B" ? (((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_q = (_p = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _p === void 0 ? void 0 : _p.price) !== null && _q !== void 0 ? _q : 0) : 0) * ((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_s = (_r = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _r === void 0 ? void 0 : _r.quantity) !== null && _s !== void 0 ? _s : 0) : 0)) * 18 / 118 : 0),
                        totAmt: (((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_u = (_t = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _t === void 0 ? void 0 : _t.price) !== null && _u !== void 0 ? _u : 0) : 0) * ((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_w = (_v = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _v === void 0 ? void 0 : _v.quantity) !== null && _w !== void 0 ? _w : 0) : 0)),
                    });
                })
            };
            const result = await this.fetch('/saveStockItems', "POST", stockInData);
            return result;
        };
        this.createStockOut = async (ItemDt, stockinType) => {
            const itemData = await this.getItemsByItemCd(ItemDt === null || ItemDt === void 0 ? void 0 : ItemDt.stock.map(item => ({ itemCd: item.itemCd })));
            const getSingleItem = (itemCd) => itemData.find(item => item.itemCd === itemCd);
            const getSingleItemFromItemDt = (itemCd) => ItemDt === null || ItemDt === void 0 ? void 0 : ItemDt.stock.find(item => item.itemCd === itemCd);
            const TotalTaxableAmount = ItemDt === null || ItemDt === void 0 ? void 0 : ItemDt.stock.reduce((acc, item) => { var _a; return acc + (item === null || item === void 0 ? void 0 : item.itemCd) ? (((_a = getSingleItem(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _a === void 0 ? void 0 : _a.taxTyCd) === "B" ? (item.price * item.quantity) : 0) : 0; }, 0);
            const TotalTaxAmount = TotalTaxableAmount * 18 / 118;
            const TotalAmount = ItemDt === null || ItemDt === void 0 ? void 0 : ItemDt.stock.reduce((acc, item) => acc + item.price, 0);
            const stockInData = {
                regTyCd: 'A',
                custTin: null,
                custNm: null,
                custBhfId: null,
                sarTyCd: stockinType,
                ocrnDt: date_time_1.DateUtils.formatToYYYYMMDD(new Date()),
                totItemCnt: itemData.length,
                totTaxblAmt: TotalTaxableAmount,
                totTaxAmt: (0, taxRounding_1.default)(TotalTaxAmount),
                totAmt: TotalAmount,
                remark: null,
                regrNm: "admin",
                regrId: "admin",
                modrNm: "admin",
                modrId: "admin",
                itemList: itemData.map((item, index) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
                    return ({
                        itemSeq: index + 1,
                        itemCd: item.itemCd,
                        itemClsCd: item.itemClsCd,
                        itemNm: (_b = (item.itemCd ? (_a = getSingleItemFromItemDt(item.itemCd)) === null || _a === void 0 ? void 0 : _a.itemNm : "")) !== null && _b !== void 0 ? _b : "",
                        bcd: item.bcd,
                        pkgUnitCd: item.pkgUnitCd,
                        pkg: (_e = (_c = item.pkg) !== null && _c !== void 0 ? _c : ((item === null || item === void 0 ? void 0 : item.itemCd) ? (_d = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _d === void 0 ? void 0 : _d.quantity : 0)) !== null && _e !== void 0 ? _e : 0,
                        qtyUnitCd: item.qtyUnitCd,
                        qty: (_g = ((item === null || item === void 0 ? void 0 : item.itemCd) ? (_f = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _f === void 0 ? void 0 : _f.quantity : 0)) !== null && _g !== void 0 ? _g : 0,
                        itemExprDt: item.itemExprDt,
                        prc: (_j = ((item === null || item === void 0 ? void 0 : item.itemCd) ? (_h = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _h === void 0 ? void 0 : _h.price : 0)) !== null && _j !== void 0 ? _j : 0,
                        splyAmt: TotalAmount,
                        totDcAmt: 0,
                        taxblAmt: item.taxTyCd === "B" ? (((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_l = (_k = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _k === void 0 ? void 0 : _k.price) !== null && _l !== void 0 ? _l : 0) : 0) * ((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_o = (_m = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _m === void 0 ? void 0 : _m.quantity) !== null && _o !== void 0 ? _o : 0) : 0)) : 0,
                        taxTyCd: item.taxTyCd,
                        taxAmt: (0, taxRounding_1.default)(item.taxTyCd === "B" ? (((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_q = (_p = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _p === void 0 ? void 0 : _p.price) !== null && _q !== void 0 ? _q : 0) : 0) * ((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_s = (_r = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _r === void 0 ? void 0 : _r.quantity) !== null && _s !== void 0 ? _s : 0) : 0)) * 18 / 118 : 0),
                        totAmt: (((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_u = (_t = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _t === void 0 ? void 0 : _t.price) !== null && _u !== void 0 ? _u : 0) : 0) * ((item === null || item === void 0 ? void 0 : item.itemCd) ? ((_w = (_v = getSingleItemFromItemDt(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _v === void 0 ? void 0 : _v.quantity) !== null && _w !== void 0 ? _w : 0) : 0)),
                    });
                })
            };
            let result = {};
            await prisma_1.default.$transaction(async (tx) => {
                var _a;
                for (const item of ItemDt.stock) {
                    // await tx.product.update({
                    //     where: {
                    //         itemCd: item.itemCd ?? ""
                    //     },
                    //     data: {
                    //         currentStock: {
                    //             decrement: item.quantity
                    //         },
                    //     }
                    // })
                    // add stock in
                    await tx.stockOut.create({
                        data: {
                            userId: ItemDt.userId,
                            quantity: item.quantity,
                            sellingPrice: item.price,
                            reason: "SOLD OUT",
                            product: {
                                connect: {
                                    itemCd: (_a = item.itemCd) !== null && _a !== void 0 ? _a : ""
                                }
                            }
                        }
                    });
                }
                result = await this.fetch('/saveStockItems', "POST", stockInData);
            });
            return result;
        };
        // create stock master
        this.saveStockMaster = async (items, type, mode) => {
            const getcurrentStock = await this.currentStock(items, type, mode);
            const getSyncEbmProducts = new ApiService_1.ApiService(this.apiHeaders);
            const prod = await getSyncEbmProducts.fetch('/selectItems', "GET");
            const singleP = (itemCd) => prod.find((item) => item.itemCd === itemCd);
            await Promise.all(getcurrentStock.map(async (item) => {
                var _a, _b;
                const itsa = {
                    itemCd: (_a = item.itemCd) !== null && _a !== void 0 ? _a : "",
                    rsdQty: item.currentStock,
                    regrNm: "Admin",
                    regrId: "Admin",
                    modrNm: "Admin",
                    modrId: "Admin",
                };
                if (item.itemCd && ((_b = singleP(item.itemCd)) === null || _b === void 0 ? void 0 : _b.itemTyCd) !== "3") {
                    await this.fetch('/saveStockMaster', "POST", itsa);
                }
            }));
        };
        this.reverseStock = async (orderId) => {
            const appProducts = await prisma_1.default.orderItems.findMany({
                where: {
                    orderId: parseInt(orderId.toString())
                },
            });
            if (appProducts.length > 0) {
                await prisma_1.default.$transaction(async (tx) => {
                    var _a;
                    for (const item of appProducts) {
                        const product = await tx.product.findUnique({
                            where: {
                                id: item.productId
                            }
                        });
                        if (product) {
                            await tx.product.update({
                                where: {
                                    id: item.productId
                                },
                                data: {
                                    currentStock: {
                                        increment: (_a = item.quantity) !== null && _a !== void 0 ? _a : 0
                                    }
                                }
                            });
                        }
                    }
                });
            }
        };
        this.createStockInOfImport = async (ItemDt, stockinType) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
            let result = {};
            for (const [index, item] of ItemDt.entries()) {
                const itemData = await this.getItemsByItemCd([{ itemCd: item.itemCd }]);
                const getSingleItem = (itemCd) => itemData.find(item => item.itemCd === itemCd);
                const TotalTaxableAmount = ((_a = getSingleItem(item === null || item === void 0 ? void 0 : item.itemCd)) === null || _a === void 0 ? void 0 : _a.taxTyCd) === "B" ? item.invcFcurAmt : 0;
                const TotalTaxAmount = TotalTaxableAmount ? (TotalTaxableAmount * 18 / 118) : 0;
                const stockInData = {
                    regTyCd: 'A',
                    custTin: null,
                    custNm: null,
                    custBhfId: null,
                    sarTyCd: stockinType,
                    ocrnDt: date_time_1.DateUtils.formatToYYYYMMDD(new Date()),
                    totItemCnt: 1,
                    totTaxblAmt: (_b = Number(TotalTaxableAmount === null || TotalTaxableAmount === void 0 ? void 0 : TotalTaxableAmount.toFixed(2))) !== null && _b !== void 0 ? _b : 0,
                    totTaxAmt: (0, taxRounding_1.default)(TotalTaxAmount),
                    totAmt: (_d = Number((_c = item.invcFcurAmt) === null || _c === void 0 ? void 0 : _c.toFixed(2))) !== null && _d !== void 0 ? _d : 0,
                    remark: null,
                    regrNm: "admin",
                    regrId: "admin",
                    modrNm: "admin",
                    modrId: "admin",
                    itemList: [{
                            itemSeq: (_e = item.itemSeq) !== null && _e !== void 0 ? _e : 1,
                            itemCd: item.itemCd,
                            itemClsCd: (_g = (_f = item.itemClCd) !== null && _f !== void 0 ? _f : item.itemClsCd) !== null && _g !== void 0 ? _g : "",
                            itemNm: (_h = item.itemNm) !== null && _h !== void 0 ? _h : "",
                            bcd: (_k = (_j = getSingleItem(item.itemCd)) === null || _j === void 0 ? void 0 : _j.bcd) !== null && _k !== void 0 ? _k : "",
                            pkgUnitCd: (_o = (_l = item.pkgUnitCd) !== null && _l !== void 0 ? _l : (_m = getSingleItem(item.itemCd)) === null || _m === void 0 ? void 0 : _m.pkgUnitCd) !== null && _o !== void 0 ? _o : "",
                            pkg: (_p = item.pkg) !== null && _p !== void 0 ? _p : 0,
                            qtyUnitCd: item.pkgUnitCd ? ((_q = item.qtyUnitCd) !== null && _q !== void 0 ? _q : "") : ((_s = (_r = getSingleItem(item.itemCd)) === null || _r === void 0 ? void 0 : _r.qtyUnitCd) !== null && _s !== void 0 ? _s : ""),
                            qty: (_t = item.qty) !== null && _t !== void 0 ? _t : 0,
                            itemExprDt: "",
                            prc: (_v = Number((_u = item.invcFcurAmt) === null || _u === void 0 ? void 0 : _u.toFixed(2))) !== null && _v !== void 0 ? _v : 0,
                            splyAmt: (_x = Number((_w = item.invcFcurAmt) === null || _w === void 0 ? void 0 : _w.toFixed(2))) !== null && _x !== void 0 ? _x : 0,
                            totDcAmt: 0,
                            taxblAmt: (_y = Number(TotalTaxableAmount === null || TotalTaxableAmount === void 0 ? void 0 : TotalTaxableAmount.toFixed(2))) !== null && _y !== void 0 ? _y : 0,
                            taxTyCd: (_0 = (_z = getSingleItem(item.itemCd)) === null || _z === void 0 ? void 0 : _z.taxTyCd) !== null && _0 !== void 0 ? _0 : "",
                            taxAmt: (_1 = (0, taxRounding_1.default)(Number(TotalTaxAmount))) !== null && _1 !== void 0 ? _1 : 0,
                            totAmt: (_3 = Number((_2 = item.invcFcurAmt) === null || _2 === void 0 ? void 0 : _2.toFixed(2))) !== null && _3 !== void 0 ? _3 : 0,
                        }]
                };
                result = await this.fetch('/saveStockItems', "POST", stockInData);
            }
            return result;
        };
        this.createStockInOfPurchase = async (item, stockinType) => {
            var _a, _b, _c, _d, _e, _f, _g;
            let result = {};
            const itemData = await this.getItemsByItemCd((_b = (_a = item.itemList) === null || _a === void 0 ? void 0 : _a.map((item) => { var _a; return ({ itemCd: (_a = item.itemCd) !== null && _a !== void 0 ? _a : '' }); })) !== null && _b !== void 0 ? _b : []);
            const getSingleItem = (itemCd) => itemData.find(item => item.itemCd === itemCd);
            const TotalTaxableAmount = (_d = (_c = item.itemList) === null || _c === void 0 ? void 0 : _c.reduce((acc, item) => {
                var _a;
                const singleItem = getSingleItem((_a = item.itemCd) !== null && _a !== void 0 ? _a : '');
                return acc + ((singleItem === null || singleItem === void 0 ? void 0 : singleItem.taxTyCd) === "B" ? item.taxblAmt : 0);
            }, 0)) !== null && _d !== void 0 ? _d : 0;
            const TotalTaxAmount = TotalTaxableAmount ? (TotalTaxableAmount * 18 / 118) : 0;
            const totalAmount = (_f = (_e = item.itemList) === null || _e === void 0 ? void 0 : _e.reduce((acc, item) => {
                var _a;
                const singleItem = getSingleItem((_a = item.itemCd) !== null && _a !== void 0 ? _a : '');
                return acc + (singleItem ? item.totAmt : 0);
            }, 0)) !== null && _f !== void 0 ? _f : 0;
            const stockInData = {
                regTyCd: 'A',
                custTin: null,
                custNm: null,
                custBhfId: null,
                sarTyCd: stockinType,
                ocrnDt: date_time_1.DateUtils.formatToYYYYMMDD(new Date()),
                totItemCnt: 1,
                totTaxblAmt: TotalTaxableAmount !== null && TotalTaxableAmount !== void 0 ? TotalTaxableAmount : 0,
                totTaxAmt: (0, taxRounding_1.default)(TotalTaxAmount),
                totAmt: totalAmount,
                remark: null,
                regrNm: "admin",
                regrId: "admin",
                modrNm: "admin",
                modrId: "admin",
                itemList: (_g = itemData === null || itemData === void 0 ? void 0 : itemData.map((item, index) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21;
                    return {
                        itemSeq: (_c = (_b = getSingleItem((_a = item.itemCd) !== null && _a !== void 0 ? _a : "")) === null || _b === void 0 ? void 0 : _b.itemSeq) !== null && _c !== void 0 ? _c : 1,
                        itemCd: item.itemCd,
                        itemClsCd: (_g = (_f = (_e = getSingleItem((_d = item.itemCd) !== null && _d !== void 0 ? _d : "")) === null || _e === void 0 ? void 0 : _e.itemClsCd) !== null && _f !== void 0 ? _f : item.itemClsCd) !== null && _g !== void 0 ? _g : "",
                        itemNm: (_l = (_k = (_j = getSingleItem((_h = item.itemCd) !== null && _h !== void 0 ? _h : "")) === null || _j === void 0 ? void 0 : _j.itemNm) !== null && _k !== void 0 ? _k : item.itemNm) !== null && _l !== void 0 ? _l : "",
                        bcd: (_p = (_o = getSingleItem((_m = item.itemCd) !== null && _m !== void 0 ? _m : "")) === null || _o === void 0 ? void 0 : _o.bcd) !== null && _p !== void 0 ? _p : "",
                        pkgUnitCd: (_t = (_q = item.pkgUnitCd) !== null && _q !== void 0 ? _q : (_s = getSingleItem((_r = item.itemCd) !== null && _r !== void 0 ? _r : "")) === null || _s === void 0 ? void 0 : _s.pkgUnitCd) !== null && _t !== void 0 ? _t : "",
                        pkg: (_x = (_w = (_v = getSingleItem((_u = item.itemCd) !== null && _u !== void 0 ? _u : "")) === null || _v === void 0 ? void 0 : _v.qty) !== null && _w !== void 0 ? _w : item.pkg) !== null && _x !== void 0 ? _x : 0,
                        qtyUnitCd: item.pkgUnitCd ? ((_y = item.qtyUnitCd) !== null && _y !== void 0 ? _y : "") : ((_1 = (_0 = getSingleItem((_z = item.itemCd) !== null && _z !== void 0 ? _z : "")) === null || _0 === void 0 ? void 0 : _0.qtyUnitCd) !== null && _1 !== void 0 ? _1 : ""),
                        qty: (_5 = (_4 = (_3 = getSingleItem((_2 = item.itemCd) !== null && _2 !== void 0 ? _2 : "")) === null || _3 === void 0 ? void 0 : _3.qty) !== null && _4 !== void 0 ? _4 : item.qty) !== null && _5 !== void 0 ? _5 : 0,
                        itemExprDt: "",
                        prc: (_9 = (_8 = (_7 = getSingleItem((_6 = item.itemCd) !== null && _6 !== void 0 ? _6 : "")) === null || _7 === void 0 ? void 0 : _7.prc) !== null && _8 !== void 0 ? _8 : item.prc) !== null && _9 !== void 0 ? _9 : 0,
                        splyAmt: ((_11 = getSingleItem((_10 = item.itemCd) !== null && _10 !== void 0 ? _10 : "")) === null || _11 === void 0 ? void 0 : _11.prc) ? ((_14 = (_13 = getSingleItem((_12 = item.itemCd) !== null && _12 !== void 0 ? _12 : "")) === null || _13 === void 0 ? void 0 : _13.prc) !== null && _14 !== void 0 ? _14 : 0) * ((_17 = (_16 = getSingleItem((_15 = item.itemCd) !== null && _15 !== void 0 ? _15 : "")) === null || _16 === void 0 ? void 0 : _16.qty) !== null && _17 !== void 0 ? _17 : 0) : (_18 = item.splyAmt) !== null && _18 !== void 0 ? _18 : 0,
                        totDcAmt: 0,
                        taxblAmt: TotalTaxableAmount !== null && TotalTaxableAmount !== void 0 ? TotalTaxableAmount : 0,
                        taxTyCd: (_21 = (_20 = getSingleItem((_19 = item.itemCd) !== null && _19 !== void 0 ? _19 : "")) === null || _20 === void 0 ? void 0 : _20.taxTyCd) !== null && _21 !== void 0 ? _21 : "",
                        taxAmt: (0, taxRounding_1.default)(TotalTaxAmount),
                        totAmt: totalAmount,
                    };
                })) !== null && _g !== void 0 ? _g : []
            };
            result = await this.fetch('/saveStockItems', "POST", stockInData);
            return result;
        };
        this.apiHeaders = headers;
    }
}
exports.StockManagement = StockManagement;
