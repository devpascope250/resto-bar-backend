"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockManagementController = void 0;
const ApiService_1 = require("../utils/ApiService");
const StockManagement_1 = require("../services/StockManagement");
const date_time_1 = require("../utils/date-time");
class StockManagementController {
    constructor() {
        this.importProducts = async (req, res) => {
            var _a, _b;
            try {
                const headers = {
                    'EbmToken': `Bearer ${(_a = req.context) === null || _a === void 0 ? void 0 : _a.ebm_token}`
                };
                const apiService = new ApiService_1.ApiService(headers);
                const latestSalesId = await apiService.fetch('/get-latest-sales-transaction-id');
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
                if (((_b = data[0]) === null || _b === void 0 ? void 0 : _b.imptItemSttsCd) !== "4") {
                    await importProducts.createStockInOfImport(data, "06", latestSalesId);
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4;
            try {
                const headers = {
                    'EbmToken': `Bearer ${(_a = req.context) === null || _a === void 0 ? void 0 : _a.ebm_token}`
                };
                const apiService = new ApiService_1.ApiService(headers);
                const latestSalesId = await apiService.fetch('/get-latest-sales-transaction-id');
                const importPurchases = new StockManagement_1.StockManagement(headers);
                // convert body to json
                const { body } = req;
                const data = body.data;
                const purchaseItmData = {
                    tin: (_b = data.tin) !== null && _b !== void 0 ? _b : "",
                    bhfId: (_c = data.bhfId) !== null && _c !== void 0 ? _c : "",
                    spplrTin: (_d = data.spplrTin) !== null && _d !== void 0 ? _d : "",
                    invcNo: 1,
                    orgInvcNo: 0,
                    spplrBhfId: (_e = data.spplrBhfId) !== null && _e !== void 0 ? _e : "",
                    spplrNm: (_f = data.spplrNm) !== null && _f !== void 0 ? _f : "",
                    spplrInvcN: (_g = data.spplrInvcN) !== null && _g !== void 0 ? _g : 0,
                    spplrSdcId: "",
                    regTyCd: "A",
                    pchsTyCd: "N",
                    rcptTyCd: "P",
                    pmtTyCd: (_h = data.pmtTyCd) !== null && _h !== void 0 ? _h : "",
                    pchsSttsCd: (_j = data.pchsSttsCd) !== null && _j !== void 0 ? _j : "",
                    cfmDt: date_time_1.DateUtils.format(new Date()),
                    pchsDt: date_time_1.DateUtils.formatToYYYYMMDD(new Date()),
                    wrhsDt: "",
                    cnclReqDt: "",
                    cnclDt: "",
                    rfdDt: "",
                    totItemCnt: (_k = data.totItemCnt) !== null && _k !== void 0 ? _k : 0,
                    taxblAmtA: (_l = data.taxblAmtA) !== null && _l !== void 0 ? _l : 0,
                    taxblAmtB: (_m = data.taxblAmtB) !== null && _m !== void 0 ? _m : 0,
                    taxblAmtC: (_o = data.taxblAmtC) !== null && _o !== void 0 ? _o : 0,
                    taxblAmtD: (_p = data.taxblAmtD) !== null && _p !== void 0 ? _p : 0,
                    taxRtA: (_q = data.taxRtA) !== null && _q !== void 0 ? _q : 0,
                    taxRtB: (_r = data.taxRtB) !== null && _r !== void 0 ? _r : 0,
                    taxRtC: (_s = data.taxRtC) !== null && _s !== void 0 ? _s : 0,
                    taxRtD: (_t = data.taxRtD) !== null && _t !== void 0 ? _t : 0,
                    taxAmtA: (_u = data.taxAmtA) !== null && _u !== void 0 ? _u : 0,
                    taxAmtB: (_v = data.taxAmtB) !== null && _v !== void 0 ? _v : 0,
                    taxAmtC: (_w = data.taxAmtC) !== null && _w !== void 0 ? _w : 0,
                    taxAmtD: (_x = data.taxAmtD) !== null && _x !== void 0 ? _x : 0,
                    totTaxblAmt: (_y = data.totTaxblAmt) !== null && _y !== void 0 ? _y : 0,
                    totTaxAmt: (_z = data.totTaxAmt) !== null && _z !== void 0 ? _z : 0,
                    totAmt: (_0 = data.totAmt) !== null && _0 !== void 0 ? _0 : 0,
                    remark: (_1 = data.remark) !== null && _1 !== void 0 ? _1 : "",
                    regrNm: 'admin',
                    regrId: 'admin',
                    modrNm: 'admin',
                    modrId: 'admin',
                    itemList: (_3 = (_2 = data === null || data === void 0 ? void 0 : data.itemList) === null || _2 === void 0 ? void 0 : _2.map((item) => {
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
                    })) !== null && _3 !== void 0 ? _3 : []
                };
                await apiService.fetch('/savePurchases', "POST", { data: purchaseItmData, id: body.id });
                await importPurchases.createStockInOfPurchase(data, "06", latestSalesId);
                await importPurchases.saveStockMaster((_4 = data.itemList) === null || _4 === void 0 ? void 0 : _4.map((item) => { var _a, _b; return ({ itemCd: (_a = item.itemCd) !== null && _a !== void 0 ? _a : "", quantity: (_b = item.qty) !== null && _b !== void 0 ? _b : 0 }); }), "IN");
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
