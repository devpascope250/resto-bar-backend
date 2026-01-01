export interface ListImportItem {
    id?: number; // auto increment
    tin?: string;
    bhfId?: string;
    taskCd?: string;
    dclDe?: string;
    itemSeq?: number;
    dclNo?: string;
    hsCd?: string; // HS Code
    itemNm?: string;
    orgnNatCd?: string;
    itemClsCd?: string;
    itemClCd?: string;
    itemCd: string;
    imptItemSttsCd?: string;
    exptNatCd?: string;
    pkg?: number;
    pkgUnitCd?: string;
    qty?: number;
    qtyUnitCd?: string;
    totWt?: number;
    netWt?: number; // Gross Weight
    spplrNm?: string; // Net Weight
    agntNm?: string;
    invcFcurAmt?: number; // Agent Name
    invcFcurCd?: string; // Invoice Foreign Currency Amount
    invcFcurExcrt?: number; // Invoice Foreign Currency
    createdAt?: Date;
}