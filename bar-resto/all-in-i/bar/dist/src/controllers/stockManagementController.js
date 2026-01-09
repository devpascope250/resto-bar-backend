"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockManagementController = void 0;
const ApiService_1 = require("../utils/ApiService");
const StockManagement_1 = require("../services/StockManagement");
const date_time_1 = require("../utils/date-time");
const cachesNameSpace_1 = require("../../types/cachesNameSpace");
const redisCache_1 = __importDefault(require("../lib/redisCache"));
class StockManagementController {
    constructor() {
        this.importProducts = async (req, res) => {
            var _a, _b, _c;
            const partnerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.partnerId;
            if (!partnerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const [namespace, key] = cachesNameSpace_1.CacheNamespace.products.partner(partnerId);
            await redisCache_1.default.delete(namespace, key);
            try {
                const headers = {
                    'EbmToken': `Bearer ${(_b = req.context) === null || _b === void 0 ? void 0 : _b.ebm_token}`
                };
                const apiService = new ApiService_1.ApiService(headers);
                const importProducts = new StockManagement_1.StockManagement(headers);
                // convert body to json
                const { body } = req;
                const data = body;
                const importItmData = data.map((item) => {
                    var _a;
                    return {
                        id: item.id,
                        taskCd: item.taskCd,
                        dclDe: item.dclDe,
                        itemSeq: item.itemSeq,
                        hsCd: item.hsCd,
                        itemClsCd: (_a = item.itemClCd) !== null && _a !== void 0 ? _a : item.itemClsCd,
                        itemCd: item.itemCd,
                        modrNm: "Admin",
                        modrId: "Admin",
                        imptItemSttsCd: item.imptItemSttsCd,
                    };
                });
                await apiService.fetch('/updateImportItems', "POST", importItmData);
                if (((_c = data[0]) === null || _c === void 0 ? void 0 : _c.imptItemSttsCd) !== "4") {
                    await importProducts.createStockInOfImport(data, "01");
                    await importProducts.saveStockMaster(data.map((item) => { var _a; return ({ itemCd: item.itemCd, quantity: (_a = item.qty) !== null && _a !== void 0 ? _a : 0 }); }), "IN");
                }
                res.status(200).json({ message: "Import products processed successfully" });
            }
            catch (error) {
                console.log(error);
                res.status(500).json(error !== null && error !== void 0 ? error : { message: "Failed to process import products" });
            }
        };
        this.importProductsPurchases = async (req, res) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
            const partnerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.partnerId;
            if (!partnerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const [namespace, key] = cachesNameSpace_1.CacheNamespace.products.partner(partnerId);
            await redisCache_1.default.delete(namespace, key);
            try {
                const headers = {
                    'EbmToken': `Bearer ${(_b = req.context) === null || _b === void 0 ? void 0 : _b.ebm_token}`
                };
                const apiService = new ApiService_1.ApiService(headers);
                const latestSalesId = await apiService.fetch('/get-latest-sales-transaction-id');
                const importPurchases = new StockManagement_1.StockManagement(headers);
                // convert body to json
                const { body } = req;
                const data = body.data;
                const purchaseItmData = {
                    tin: (_c = data.tin) !== null && _c !== void 0 ? _c : "",
                    bhfId: (_d = data.bhfId) !== null && _d !== void 0 ? _d : "",
                    spplrTin: (_e = data.spplrTin) !== null && _e !== void 0 ? _e : "",
                    invcNo: 1,
                    orgInvcNo: 0,
                    spplrBhfId: (_f = data.spplrBhfId) !== null && _f !== void 0 ? _f : "",
                    spplrNm: (_g = data.spplrNm) !== null && _g !== void 0 ? _g : "",
                    spplrInvcN: (_h = data.spplrInvcN) !== null && _h !== void 0 ? _h : 0,
                    spplrSdcId: "",
                    regTyCd: "A",
                    pchsTyCd: "N",
                    rcptTyCd: "P",
                    pmtTyCd: (_j = data.pmtTyCd) !== null && _j !== void 0 ? _j : "",
                    pchsSttsCd: (_k = data.pchsSttsCd) !== null && _k !== void 0 ? _k : "",
                    cfmDt: date_time_1.DateUtils.format(new Date()),
                    pchsDt: date_time_1.DateUtils.formatToYYYYMMDD(new Date()),
                    wrhsDt: "",
                    cnclReqDt: "",
                    cnclDt: "",
                    rfdDt: "",
                    totItemCnt: (_l = data.totItemCnt) !== null && _l !== void 0 ? _l : 0,
                    taxblAmtA: (_m = data.taxblAmtA) !== null && _m !== void 0 ? _m : 0,
                    taxblAmtB: (_o = data.taxblAmtB) !== null && _o !== void 0 ? _o : 0,
                    taxblAmtC: (_p = data.taxblAmtC) !== null && _p !== void 0 ? _p : 0,
                    taxblAmtD: (_q = data.taxblAmtD) !== null && _q !== void 0 ? _q : 0,
                    taxRtA: (_r = data.taxRtA) !== null && _r !== void 0 ? _r : 0,
                    taxRtB: (_s = data.taxRtB) !== null && _s !== void 0 ? _s : 0,
                    taxRtC: (_t = data.taxRtC) !== null && _t !== void 0 ? _t : 0,
                    taxRtD: (_u = data.taxRtD) !== null && _u !== void 0 ? _u : 0,
                    taxAmtA: (_v = data.taxAmtA) !== null && _v !== void 0 ? _v : 0,
                    taxAmtB: (_w = data.taxAmtB) !== null && _w !== void 0 ? _w : 0,
                    taxAmtC: (_x = data.taxAmtC) !== null && _x !== void 0 ? _x : 0,
                    taxAmtD: (_y = data.taxAmtD) !== null && _y !== void 0 ? _y : 0,
                    totTaxblAmt: (_z = data.totTaxblAmt) !== null && _z !== void 0 ? _z : 0,
                    totTaxAmt: (_0 = data.totTaxAmt) !== null && _0 !== void 0 ? _0 : 0,
                    totAmt: (_1 = data.totAmt) !== null && _1 !== void 0 ? _1 : 0,
                    remark: (_2 = data.remark) !== null && _2 !== void 0 ? _2 : "",
                    regrNm: 'admin',
                    regrId: 'admin',
                    modrNm: 'admin',
                    modrId: 'admin',
                    itemList: (_4 = (_3 = data === null || data === void 0 ? void 0 : data.itemList) === null || _3 === void 0 ? void 0 : _3.map((item) => {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
                        return {
                            itemSeq: (_a = item.itemSeq) !== null && _a !== void 0 ? _a : 0,
                            itemCd: (_b = item.itemCd) !== null && _b !== void 0 ? _b : "",
                            itemClsCd: (_c = item.itemClsCd) !== null && _c !== void 0 ? _c : "",
                            itemNm: (_d = item.itemNm) !== null && _d !== void 0 ? _d : "",
                            bcd: (_e = item.bcd) !== null && _e !== void 0 ? _e : "",
                            spplrItemClsCd: null,
                            spplrItemCd: null,
                            spplrItemNm: null,
                            pkgUnitCd: (_f = item.pkgUnitCd) !== null && _f !== void 0 ? _f : "",
                            pkg: (_g = item.pkg) !== null && _g !== void 0 ? _g : 0,
                            qtyUnitCd: (_h = item.qtyUnitCd) !== null && _h !== void 0 ? _h : "",
                            qty: (_j = item.qty) !== null && _j !== void 0 ? _j : 0,
                            prc: (_k = item.prc) !== null && _k !== void 0 ? _k : 0,
                            splyAmt: (_l = item.splyAmt) !== null && _l !== void 0 ? _l : 0,
                            dcRt: (_m = item.dcRt) !== null && _m !== void 0 ? _m : 0,
                            dcAmt: (_o = item.dcAmt) !== null && _o !== void 0 ? _o : 0,
                            taxblAmt: (_p = item.taxblAmt) !== null && _p !== void 0 ? _p : 0,
                            taxTyCd: (_q = item.taxTyCd) !== null && _q !== void 0 ? _q : "",
                            taxAmt: (_r = item.taxAmt) !== null && _r !== void 0 ? _r : 0,
                            totAmt: (_s = item.totAmt) !== null && _s !== void 0 ? _s : 0,
                            itemExprDt: null
                        };
                    })) !== null && _4 !== void 0 ? _4 : []
                };
                await apiService.fetch('/savePurchases', "POST", { data: purchaseItmData, id: body.id });
                await importPurchases.createStockInOfPurchase(data, "02");
                await importPurchases.saveStockMaster((_5 = data.itemList) === null || _5 === void 0 ? void 0 : _5.map((item) => { var _a, _b; return ({ itemCd: (_a = item.itemCd) !== null && _a !== void 0 ? _a : "", quantity: (_b = item.qty) !== null && _b !== void 0 ? _b : 0 }); }), "IN");
                res.status(200).json({ message: "Import products processed successfully" });
            }
            catch (error) {
                console.log(error);
                res.status(500).json(error !== null && error !== void 0 ? error : { message: "Failed to process import products" });
            }
        };
    }
}
exports.StockManagementController = StockManagementController;
