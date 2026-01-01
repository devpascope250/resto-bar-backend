import { Request, Response } from "express";
import { ApiService } from "../utils/ApiService";
import { ListImportItem } from "@/types/models/ListImportItem";
import { StockManagement } from "../services/StockManagement";
import { PurchaseSalesTransaction } from "@/types/models/PurchaseSalesTransaction";
import { PurchaseSalesTransactionSave } from "@/types/models/PurchaseSalesTransactionSave";
import { tin } from "@turf/turf";
import { DateUtils } from "../utils/date-time";
import { CacheNamespace } from "../../types/cachesNameSpace";
import redisCache from "../lib/redisCache";
export class StockManagementController {
    importProducts = async (req: Request, res: Response) => {
        const partnerId = req.user?.partnerId;
        if (!partnerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const [namespace, key] = CacheNamespace.products.partner(partnerId);
        await redisCache.delete(namespace, key);
        try {

            const headers = {
                'EbmToken': `Bearer ${req.context?.ebm_token}`
            }
            const apiService = new ApiService(headers);
            const importProducts = new StockManagement(headers);
            // convert body to json
            const { body } = req;
            const data = body as ListImportItem[];
            const importItmData = data.map((item) => {
                return {
                    id: item.id,
                    taskCd: item.taskCd,
                    dclDe: item.dclDe,
                    itemSeq: item.itemSeq,
                    hsCd: item.hsCd,
                    itemClsCd: item.itemClCd ?? item.itemClsCd,
                    itemCd: item.itemCd,
                    modrNm: "Admin",
                    modrId: "Admin",
                    imptItemSttsCd: item.imptItemSttsCd,
                };
            })

            await apiService.fetch('/updateImportItems', "POST", importItmData);
            if (data[0]?.imptItemSttsCd !== "4") {
                await importProducts.createStockInOfImport(data, "01");
                await importProducts.saveStockMaster(data.map((item) => ({ itemCd: item.itemCd, quantity: item.qty ?? 0 })),"IN");
            }

            res.status(200).json({ message: "Import products processed successfully" });
        } catch (error) {
            console.log(error);
            res.status(500).json(error ?? { message: "Failed to process import products" });

        }
    }


    importProductsPurchases = async (req: Request, res: Response) => {
        const partnerId = req.user?.partnerId;
        if (!partnerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const [namespace, key] = CacheNamespace.products.partner(partnerId);
        await redisCache.delete(namespace, key);

        try {
            const headers = {
                'EbmToken': `Bearer ${req.context?.ebm_token}`
            }
            const apiService = new ApiService(headers);
            const latestSalesId = await apiService.fetch<number>('/get-latest-sales-transaction-id');
            const importPurchases = new StockManagement(headers);
            // convert body to json
            const { body } = req;
            const data = body.data as PurchaseSalesTransactionSave;
            const purchaseItmData: PurchaseSalesTransactionSave = {
            tin: data.tin ?? "",
            bhfId: data.bhfId ?? "",
            spplrTin: data.spplrTin ?? "",
            invcNo:  1,
            orgInvcNo:  0,
            spplrBhfId: data.spplrBhfId ?? "",
            spplrNm: data.spplrNm ?? "",
            spplrInvcN: data.spplrInvcN ?? 0,
            spplrSdcId: "",
            regTyCd: "A",
            pchsTyCd: "N",
            rcptTyCd: "P",
            pmtTyCd: data.pmtTyCd ?? "",
            pchsSttsCd: data.pchsSttsCd ?? "",
            cfmDt: DateUtils.format(new Date()),
            pchsDt: DateUtils.formatToYYYYMMDD(new Date()),
            wrhsDt: "",
            cnclReqDt: "",
            cnclDt: "",
            rfdDt:  "",
            totItemCnt: data.totItemCnt ?? 0,
            taxblAmtA: data.taxblAmtA ?? 0,
            taxblAmtB: data.taxblAmtB ?? 0,
            taxblAmtC: data.taxblAmtC ?? 0,
            taxblAmtD: data.taxblAmtD ?? 0,
            taxRtA: data.taxRtA ?? 0,
            taxRtB: data.taxRtB ?? 0,
            taxRtC: data.taxRtC ?? 0,
            taxRtD: data.taxRtD ?? 0,
            taxAmtA: data.taxAmtA ?? 0,
            taxAmtB: data.taxAmtB ?? 0,
            taxAmtC: data.taxAmtC ?? 0,
            taxAmtD: data.taxAmtD ?? 0,
            totTaxblAmt: data.totTaxblAmt ?? 0,
            totTaxAmt: data.totTaxAmt ?? 0,
            totAmt: data.totAmt ?? 0,
            remark: data.remark ?? "",
            regrNm: 'admin',
            regrId: 'admin',
            modrNm: 'admin',
            modrId: 'admin',
            itemList: data?.itemList?.map((item) => {
                return {
                    itemSeq: item.itemSeq ?? 0,
                    itemCd: item.itemCd ?? "",
                    itemClsCd: item.itemClsCd ?? "",
                    itemNm: item.itemNm ?? "",
                    bcd: item.bcd ?? "",
                    spplrItemClsCd: null,
                    spplrItemCd: null,
                    spplrItemNm: null,
                    pkgUnitCd: item.pkgUnitCd ?? "",
                    pkg: item.pkg ?? 0,
                    qtyUnitCd: item.qtyUnitCd ?? "",
                    qty: item.qty ?? 0,
                    prc: item.prc ?? 0,
                    splyAmt: item.splyAmt ?? 0,
                    dcRt: item.dcRt ?? 0,
                    dcAmt: item.dcAmt ?? 0,
                    taxblAmt: item.taxblAmt ?? 0,
                    taxTyCd: item.taxTyCd ?? "",
                    taxAmt: item.taxAmt ?? 0,
                    totAmt: item.totAmt ?? 0,
                    itemExprDt: null
                }
            }) ?? []
            }

            await apiService.fetch('/savePurchases', "POST", {data: purchaseItmData, id: body.id});
                await importPurchases.createStockInOfPurchase(data, "02")
                await importPurchases.saveStockMaster(data.itemList?.map((item) => ({ itemCd: item.itemCd ?? "", quantity: item.qty ?? 0 })), "IN");
            res.status(200).json({ message: "Import products processed successfully" });
        } catch (error) {
            console.log(error);
            res.status(500).json(error ?? { message: "Failed to process import products" });

        }
    }
}