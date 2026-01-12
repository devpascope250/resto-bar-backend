import { ItemsList, ItemsListStockin } from "@/types/models/ItemsList";
import { ApiService } from "../utils/ApiService";
import { ResultData } from "@/types/models/data-clt";
import { StockInOutData, StockInOutSaveItem } from "@/types/models/StockInOutData";
import { DateUtils } from "../utils/date-time";
import prisma from "../lib/prisma";
import { ListImportItem } from "@/types/models/ListImportItem";
import { SaveStockMaster } from "@/types/models/SaveStockMaster";
import { PurchaseSalesTransactionSave } from "@/types/models/PurchaseSalesTransactionSave";
import taxRounder from "../utils/taxRounding";
export interface ItemDt {
    itemCd: string;
    itemNm: string;
    productId?: number;
    price: number;
    quantity: number;
}


export interface stockOutData {
    stock: StockItem[];
    custTin: string;
    custNm: string;
    userId: string;
}
interface StockItem {
    itemCd: string;
    itemNm: string;
    price: number;
    quantity: number;
}
export class StockManagement extends ApiService {
    private apiHeaders: any;
    constructor(headers: any) {
        super(headers);
        this.apiHeaders = headers;
    }

    getItemsByItemCd = async (itemCd: Array<{ itemCd: string }>): Promise<ItemsListStockin[]> => {
        const results = await this.fetch<ItemsListStockin[]>('/get-items-by-itemCd', "POST", itemCd);
        return results;
    }

    protected currentStock = async (itemCd: Array<{ itemCd: string, quantity: number }>, type: "IN" | "OUT", mode?: "CREATE" | "OTHERS"): Promise<Array<{ itemCd: string | null, currentStock: number }>> => {
        const getproducts = await prisma.product.findMany({
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
            await prisma.$transaction(async (tx) => {

                for (const item of itemCd) {
                    if ((item.quantity !== undefined && item.quantity !== 0)) {
                        await tx.product.update({
                            where: {
                                itemCd: item.itemCd ?? ""
                            },
                            data: {
                                currentStock: {
                                    increment: item.quantity ?? 0
                                },
                            }
                        })

                    }

                }
            });
        }

        const productsWithQuantity = getproducts.map(product => {
            {
                const item = itemCd.find(i => i.itemCd === product.itemCd);
                return {
                    itemCd: product.itemCd,
                    currentStock: (type === "IN" && mode !== "CREATE") ? Number(product.currentStock) + Number(item?.quantity ?? 0) : Number(product.currentStock)
                }
            }
        });
        return productsWithQuantity;
    }


    createStockIn = async (ItemDt: ItemDt[], stockinType: string, itemByCreat?: StockInOutSaveItem): Promise<ResultData> => {
        const itemData = await this.getItemsByItemCd(ItemDt.map(item => ({ itemCd: item.itemCd })));
        const getSingleItem = (itemCd: string) => itemData.find(item => item.itemCd === itemCd);
        const getSingleItemFromItemDt = (itemCd: string) => ItemDt.find(item => item.itemCd === itemCd);
        const TotalTaxableAmount = ItemDt.reduce((acc, item) => acc + item?.itemCd ? (getSingleItem(item?.itemCd)?.taxTyCd === "B" ? (item.price * item.quantity) : 0) : 0, 0);
        const TotalTaxAmount = TotalTaxableAmount * 18 / 118;
        const TotalAmount = ItemDt.reduce((acc, item) => acc + item.price, 0);
        const saveStockInOutItems: StockInOutSaveItem[] = [
            {
                itemSeq: 1,
                itemCd: itemByCreat?.itemCd ?? "",
                itemClsCd: itemByCreat?.itemClsCd ?? "",
                itemNm: itemByCreat?.itemNm ?? "",
                bcd: null,
                pkgUnitCd: itemByCreat?.pkgUnitCd ?? "",
                pkg: itemByCreat?.pkg ?? 0,
                qtyUnitCd: itemByCreat?.qtyUnitCd ?? "",
                qty: itemByCreat?.qty ?? 0,
                itemExprDt: '',
                prc: itemByCreat?.prc ?? 0,
                splyAmt: itemByCreat?.splyAmt ?? 0,
                totDcAmt: 0,
                taxblAmt: itemByCreat?.taxblAmt ?? 0,
                taxTyCd: itemByCreat?.taxTyCd ?? "",
                taxAmt: itemByCreat?.taxAmt ?? 0,
                totAmt: itemByCreat?.totAmt ?? 0,
            }
        ];
        const stockInData: StockInOutData = {
            regTyCd: 'A',
            custTin: null,
            custNm: null,
            custBhfId: null,
            sarTyCd: stockinType,
            ocrnDt: DateUtils.formatToYYYYMMDD(new Date()),
            totItemCnt: itemByCreat ? 1 : itemData.length,
            totTaxblAmt: TotalTaxableAmount,
            totTaxAmt: taxRounder(TotalTaxAmount),
            totAmt: TotalAmount,
            remark: null,
            regrNm: "admin",
            regrId: "admin",
            modrNm: "admin",
            modrId: "admin",
            itemList: itemByCreat ? saveStockInOutItems : itemData.map((item, index) => ({
                itemSeq: index + 1,
                itemCd: item.itemCd,
                itemClsCd: item.itemClsCd,
                itemNm: (item.itemCd ? getSingleItemFromItemDt(item.itemCd)?.itemNm : "") ?? "",
                bcd: item.bcd,
                pkgUnitCd: item.pkgUnitCd,
                pkg: item.pkg ?? (item?.itemCd ? getSingleItemFromItemDt(item?.itemCd)?.quantity : 0) ?? 0,
                qtyUnitCd: item.qtyUnitCd,
                qty: (item?.itemCd ? getSingleItemFromItemDt(item?.itemCd)?.quantity : 0) ?? 0,
                itemExprDt: item.itemExprDt,
                prc: (item?.itemCd ? getSingleItemFromItemDt(item?.itemCd)?.price : 0) ?? 0,
                splyAmt: TotalAmount,
                totDcAmt: 0,
                taxblAmt: item.taxTyCd === "B" ? ((item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.price ?? 0) : 0) * (item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.quantity ?? 0) : 0)) : 0,
                taxTyCd: item.taxTyCd,
                taxAmt: taxRounder(item.taxTyCd === "B" ? ((item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.price ?? 0) : 0) * (item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.quantity ?? 0) : 0)) * 18 / 118 : 0),
                totAmt: ((item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.price ?? 0) : 0) * (item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.quantity ?? 0) : 0)),
            }))
        }

        console.log('the results', itemData);


        console.log(stockInData);

        const result = await this.fetch<ResultData>('/saveStockItems', "POST", stockInData);
        return result;
    }


    createStockOut = async (ItemDt: stockOutData, stockinType: string): Promise<ResultData> => {
        const itemData = await this.getItemsByItemCd(ItemDt?.stock.map(item => ({ itemCd: item.itemCd })));
        const getSingleItem = (itemCd: string) => itemData.find(item => item.itemCd === itemCd);
        const getSingleItemFromItemDt = (itemCd: string) => ItemDt?.stock.find(item => item.itemCd === itemCd);
        const TotalTaxableAmount = ItemDt?.stock.reduce((acc, item) => acc + item?.itemCd ? (getSingleItem(item?.itemCd)?.taxTyCd === "B" ? (item.price * item.quantity) : 0) : 0, 0);
        const TotalTaxAmount = TotalTaxableAmount * 18 / 118;
        const TotalAmount = ItemDt?.stock.reduce((acc, item) => acc + item.price, 0);
        const stockInData: StockInOutData = {
            regTyCd: 'A',
            custTin: null,
            custNm: null,
            custBhfId: null,
            sarTyCd: stockinType,
            ocrnDt: DateUtils.formatToYYYYMMDD(new Date()),
            totItemCnt: itemData.length ?? 1,
            totTaxblAmt: taxRounder(TotalTaxableAmount),
            totTaxAmt: taxRounder(TotalTaxAmount),
            totAmt: taxRounder(Number(TotalAmount)),
            remark: null,
            regrNm: "admin",
            regrId: "admin",
            modrNm: "admin",
            modrId: "admin",
            itemList: itemData.map((item, index) => ({
                itemSeq: index + 1,
                itemCd: item.itemCd,
                itemClsCd: item.itemClsCd,
                itemNm: (item.itemCd ? getSingleItemFromItemDt(item.itemCd)?.itemNm : "") ?? "",
                bcd: item.bcd,
                pkgUnitCd: item.pkgUnitCd,
                pkg: item.pkg ?? (item?.itemCd ? getSingleItemFromItemDt(item?.itemCd)?.quantity : 0) ?? 0,
                qtyUnitCd: item.qtyUnitCd,
                qty: (item?.itemCd ? getSingleItemFromItemDt(item?.itemCd)?.quantity : 0) ?? 0,
                itemExprDt: item.itemExprDt,
                prc: (item?.itemCd ? getSingleItemFromItemDt(item?.itemCd)?.price : 0) ?? 0,
                splyAmt: taxRounder(Number(TotalAmount)),
                totDcAmt: 0,
                taxblAmt: item.taxTyCd === "B" ? ((item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.price ?? 0) : 0) * (item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.quantity ?? 0) : 0)) : 0,
                taxTyCd: item.taxTyCd,
                taxAmt: taxRounder(item.taxTyCd === "B" ? ((item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.price ?? 0) : 0) * (item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.quantity ?? 0) : 0)) * 18 / 118 : 0),
                totAmt: taxRounder((item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.price ?? 0) : 0) * (item?.itemCd ? (getSingleItemFromItemDt(item?.itemCd)?.quantity ?? 0) : 0)),
            }))
        }

        console.log('Inner checking', stockInData);
        
        let result: ResultData = {} as ResultData;
        await prisma.$transaction(async (tx) => {
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
                                itemCd: item.itemCd ?? ""
                            }
                        }
                    }
                })

            }
            result = await this.fetch<ResultData>('/saveStockItems', "POST", stockInData);
        })

        return result;

    }


    // create stock master

    saveStockMaster = async (items: Array<{ itemCd: string, quantity: number }>, type: "IN" | "OUT", mode?: "CREATE" | "OTHERS") => {
        const getcurrentStock = await this.currentStock(items, type, mode);
        const getSyncEbmProducts = new ApiService(this.apiHeaders);
        const prod = await getSyncEbmProducts.fetch<ItemsList[]>('/selectItems', "GET");
        const singleP = (itemCd: string) => prod.find((item) => item.itemCd === itemCd);
        await Promise.all(getcurrentStock.map(async (item) => {
            const itsa: SaveStockMaster = {
                itemCd: item.itemCd ?? "",
                rsdQty: item.currentStock,
                regrNm: "Admin",
                regrId: "Admin",
                modrNm: "Admin",
                modrId: "Admin",
            }
            if (item.itemCd && singleP(item.itemCd)?.itemTyCd !== "3") {
                await this.fetch('/saveStockMaster', "POST", itsa);
            }
        }
        ));
    }

    reverseStock = async (orderId: number) => {
        const appProducts = await prisma.orderItems.findMany({
            where: {
                orderId: parseInt(orderId.toString())
            },
        });
        if (appProducts.length > 0) {
            await prisma.$transaction(async (tx) => {
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
                                    increment: item.quantity ?? 0
                                }
                            }
                        });
                    }

                }
            });
        }
    }

    createStockInOfImport = async (ItemDt: ListImportItem[], stockinType: string): Promise<ResultData> => {
        let result = {} as ResultData;
        for (const [index, item] of ItemDt.entries()) {
            const itemData = await this.getItemsByItemCd([{ itemCd: item.itemCd }]);
            const getSingleItem = (itemCd: string) => itemData.find(item => item.itemCd === itemCd);
            const TotalTaxableAmount = getSingleItem(item?.itemCd)?.taxTyCd === "B" ? item.invcFcurAmt : 0;
            const TotalTaxAmount = TotalTaxableAmount ? (TotalTaxableAmount * 18 / 118) : 0;
            const stockInData: StockInOutData = {
                regTyCd: 'A',
                custTin: null,
                custNm: null,
                custBhfId: null,
                sarTyCd: stockinType,
                ocrnDt: DateUtils.formatToYYYYMMDD(new Date()),
                totItemCnt: 1,
                totTaxblAmt: Number(TotalTaxableAmount?.toFixed(2)) ?? 0,
                totTaxAmt: taxRounder(TotalTaxAmount),
                totAmt: Number(item.invcFcurAmt?.toFixed(2)) ?? 0,
                remark: null,
                regrNm: "admin",
                regrId: "admin",
                modrNm: "admin",
                modrId: "admin",
                itemList: [{
                    itemSeq: item.itemSeq ?? 1,
                    itemCd: item.itemCd,
                    itemClsCd: item.itemClCd ?? item.itemClsCd ?? "",
                    itemNm: item.itemNm ?? "",
                    bcd: getSingleItem(item.itemCd)?.bcd ?? "",
                    pkgUnitCd: item.pkgUnitCd ?? getSingleItem(item.itemCd)?.pkgUnitCd ?? "",
                    pkg: item.pkg ?? 0,
                    qtyUnitCd: item.pkgUnitCd ? (item.qtyUnitCd ?? "") : (getSingleItem(item.itemCd)?.qtyUnitCd ?? ""),
                    qty: item.qty ?? 0,
                    itemExprDt: "",
                    prc: Number(item.invcFcurAmt?.toFixed(2)) ?? 0,
                    splyAmt: Number(item.invcFcurAmt?.toFixed(2)) ?? 0,
                    totDcAmt: 0,
                    taxblAmt: Number(TotalTaxableAmount?.toFixed(2)) ?? 0,
                    taxTyCd: getSingleItem(item.itemCd)?.taxTyCd ?? "",
                    taxAmt: taxRounder(Number(TotalTaxAmount)) ?? 0,
                    totAmt: Number(item.invcFcurAmt?.toFixed(2)) ?? 0,
                }]
            }
            result = await this.fetch<ResultData>('/saveStockItems', "POST", stockInData);
        }
        return result;
    }

    createStockInOfPurchase = async (item: PurchaseSalesTransactionSave, stockinType: string): Promise<ResultData> => {
        let result = {} as ResultData;
        const itemData = await this.getItemsByItemCd(item.itemList?.map((item) => ({ itemCd: item.itemCd ?? '' })) ?? []);
        const getSingleItem = (itemCd: string) => itemData.find(item => item.itemCd === itemCd);
        const TotalTaxableAmount = item.itemList?.reduce((acc, item) => {
            const singleItem = getSingleItem(item.itemCd ?? '');
            return acc + (singleItem?.taxTyCd === "B" ? item.taxblAmt : 0);
        }, 0) ?? 0;
        const TotalTaxAmount = TotalTaxableAmount ? (TotalTaxableAmount * 18 / 118) : 0;
        const totalAmount = item.itemList?.reduce((acc, item) => {
            const singleItem = getSingleItem(item.itemCd ?? '');
            return acc + (singleItem ? item.totAmt : 0);
        }, 0) ?? 0;
        const stockInData: StockInOutData = {
            regTyCd: 'A',
            custTin: null,
            custNm: null,
            custBhfId: null,
            sarTyCd: stockinType,
            ocrnDt: DateUtils.formatToYYYYMMDD(new Date()),
            totItemCnt: 1,
            totTaxblAmt: TotalTaxableAmount ?? 0,
            totTaxAmt: taxRounder(TotalTaxAmount),
            totAmt: totalAmount,
            remark: null,
            regrNm: "admin",
            regrId: "admin",
            modrNm: "admin",
            modrId: "admin",
            itemList: itemData?.map((item, index) => {
                return {
                    itemSeq: getSingleItem(item.itemCd ?? "")?.itemSeq ?? 1,
                    itemCd: item.itemCd,
                    itemClsCd: getSingleItem(item.itemCd ?? "")?.itemClsCd ?? item.itemClsCd ?? "",
                    itemNm: getSingleItem(item.itemCd ?? "")?.itemNm ?? item.itemNm ?? "",
                    bcd: getSingleItem(item.itemCd ?? "")?.bcd ?? "",
                    pkgUnitCd: item.pkgUnitCd ?? getSingleItem(item.itemCd ?? "")?.pkgUnitCd ?? "",
                    pkg: getSingleItem(item.itemCd ?? "")?.qty ?? item.pkg ?? 0,
                    qtyUnitCd: item.pkgUnitCd ? (item.qtyUnitCd ?? "") : (getSingleItem(item.itemCd ?? "")?.qtyUnitCd ?? ""),
                    qty: getSingleItem(item.itemCd ?? "")?.qty ?? item.qty ?? 0,
                    itemExprDt: "",
                    prc: getSingleItem(item.itemCd ?? "")?.prc ?? item.prc ?? 0,
                    splyAmt: getSingleItem(item.itemCd ?? "")?.prc ? (getSingleItem(item.itemCd ?? "")?.prc ?? 0) * (getSingleItem(item.itemCd ?? "")?.qty ?? 0) : item.splyAmt ?? 0,
                    totDcAmt: 0,
                    taxblAmt: TotalTaxableAmount ?? 0,
                    taxTyCd: getSingleItem(item.itemCd ?? "")?.taxTyCd ?? "",
                    taxAmt: taxRounder(TotalTaxAmount),
                    totAmt: totalAmount,
                }
            }) ?? []
        }
        result = await this.fetch<ResultData>('/saveStockItems', "POST", stockInData);
        return result;
    }




}