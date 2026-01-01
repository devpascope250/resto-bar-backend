export interface StockInOutData {
    sarNo?: number;
    orgSarNo?: number;
    regTyCd: string;
    custTin?: string | null;
    custNm?: string | null;
    custBhfId?: string | null;
    sarTyCd: string;
    ocrnDt: string;
    totItemCnt: number;
    totTaxblAmt: number;
    totTaxAmt: number;
    totAmt: number;
    remark?: string | null;
    regrNm: string;
    regrId: string;
    modrNm: string;
    modrId: string;
    itemList: StockInOutSaveItem[];
}

export interface StockInOutSaveItem {
    itemSeq: number;
    itemCd?: string | null;
    itemClsCd: string;
    itemNm: string;
    bcd?: string | null;
    pkgUnitCd: string;
    pkg: number;
    qtyUnitCd: string;
    qty: number;
    itemExprDt?: string;
    prc: number;
    splyAmt: number;
    totDcAmt: number;
    taxblAmt: number;
    taxTyCd: string;
    taxAmt: number;
    totAmt: number;
}