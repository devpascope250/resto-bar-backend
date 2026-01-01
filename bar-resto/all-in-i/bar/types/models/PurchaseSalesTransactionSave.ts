export interface PurchaseSalesTransactionSave {
    tin: string;
    bhfId: string;
    spplrTin?: string | null;
    invcNo: number;
    orgInvcNo: number;
    spplrBhfId?: string | null;
    spplrNm?: string;
    spplrInvcN?: number | null;
    spplrSdcId?: string | null;
    regTyCd: string;
    pchsTyCd: string;
    rcptTyCd: string;
    pmtTyCd: string;
    pchsSttsCd: string;
    cfmDt?: string | null;
    pchsDt: string;
    wrhsDt?: string | null;
    cnclReqDt?: string | null;
    cnclDt?: string | null;
    rfdDt?: string | null;
    totItemCnt: number;
    taxblAmtA: number;
    taxblAmtB: number;
    taxblAmtC: number;
    taxblAmtD: number;
    taxRtA: number;
    taxRtB: number;
    taxRtC: number;
    taxRtD: number;
    taxAmtA: number;
    taxAmtB: number;
    taxAmtC: number;
    taxAmtD: number;
    totTaxblAmt: number;
    totTaxAmt: number;
    totAmt: number;
    remark?: string | null;
    regrNm: string;
    regrId: string;
    modrNm: string;
    modrId: string;
    itemList: PurchaseSalesTransactionItemSave[];
}

export interface PurchaseSalesTransactionItemSave{
    itemSeq: number;
    itemCd?: string | null;
    itemClsCd: string;
    itemNm: string;
    bcd?:  string | null;
    spplrItemClsCd?:  string | null;
    spplrItemCd?: string | null;
    spplrItemNm?: string | null;
    pkgUnitCd?: string | null;
    pkg: number;
    qtyUnitCd: string;
    qty: number;
    prc: number;
    splyAmt: number;
    dcRt: number;
    dcAmt: number;
    taxblAmt: number;
    taxTyCd: number;
    taxAmt: number; 
    totAmt: number; // duplicate column
    itemExprDt?: string | null; 
}