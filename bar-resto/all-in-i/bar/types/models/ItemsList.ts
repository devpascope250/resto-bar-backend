export interface ItemsList {
    id?: number;  // auto increment
    tin?: string;
    itemClsCd?: string;
    itemCd?: string;
    itemTyCd?: string;
    itemNm?: string;
    itemStdNm?: string;
    orgnNatCd?: string;
    pkgUnitCd?: string;
    qtyUnitCd?: string;
    taxTyCd?: string;
    btchNo?: string;
    regBhfId?: string;
    bcd?: string;
    dftPrc?: number;
    grpPrcL1?: number;
    grpPrcL2?: number;
    grpPrcL3?: number;
    grpPrcL4?: number;
    grpPrcL5?: number;
    addInfo?: string;
    sftyQty?: number;
    isrcAplcbYn?: string;
    rraModYn?: string;
    useYn?: string;
    createdAt?: Date
}





export interface ItemsListStockin {
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

