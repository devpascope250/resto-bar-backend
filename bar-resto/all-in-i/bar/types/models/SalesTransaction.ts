export interface SalesTransaction {
    id?: number;  // auto increment
    tin?: string;
    bhfId?: string;
    invcNo: number; // Invoice Number
    orgInvcNo: number; // Original Invoice Number
    custTin?: string; // Customer Tin
    prcOrdCd?: string | null; // Purchase code
    custNm?: string; // Customer Name
    salesTyCd: string; // Sales Type Code
    rcptTyCd: string; // Receipt Type Code
    pmtTyCd?: string; // Payment Type Code
    salesSttsCd: string; // Invoice status code
    cfmDt: string;  // validated Date
    salesDt: string; // Sales Date
    stockRlsDt?: string | null; // Stock Release Date
    cnclReqDt?: string | null; // Cancel Requested Date
    cnclDt?: string | null; // Cancelled Date
    rfdDt?: string | null; // Refunded Date
    rfdRsnCd?: string | null; // Refunded Reason Code
    totItemCnt: number; // Total Item Count
    taxblAmtA: number;   // Taxable Amount A
    taxblAmtB: number;   // Taxable Amount B
    taxblAmtC: number;   // Taxable Amount C
    taxblAmtD: number;   // Taxable Amount D
    taxRtA: number; // Tax Rate A
    taxRtB: number; // Tax Rate B
    taxRtC: number; // Tax Rate C
    taxRtD: number; // Tax Rate D
    taxAmtA: number; // Tax Amount A
    taxAmtB: number; // Tax Amount B
    taxAmtC: number; // Tax Amount C
    taxAmtD: number; // Tax Amount D
    totTaxblAmt: number; // Total Taxable Amount
    totTaxAmt: number; // Total Tax Amount
    totAmt: number; // Total Amount
    prchrAcptcYn: string; // Purchaser Acceptance Y/N
    remark?: string | null; // Remark
    regrNm: string; // Registrant Name
    regrId: string; // Registrant ID
    modrId: string; // Modifier ID
    modrNm: string; // Modifier Name
    receipt: SalesTransactionsReceipt;
    itemList: SalesTransactionItem[];
    response?: SalesTransactionResponse;
}

export interface SalesTransactionsReceipt {
    id?: number; // auto increment
    sales_transactions_id?: number;
    custTIn?: string;
    custMblNo?: string; // Customer Mobile Number
    rptNo: number; // Report Number
    trdeNm?: string | null; // Trade Name
    adrs?: string | null;
    topMsg?: string | null; // Top Message
    btmMsg?: string | null; // Bottom Message
    prchrAcptcYn: string; 
}
export interface SalesTransactionItem {
    id?: number; // auto increment
    sales_transactions_id?: number;
    itemSeq: number; // Item Sequence
    itemClsCd?: string;
    itemCd: string; // Item Code
    itemNm: string; // Item Name
    bcd?: string; // Barcode
    pkgUnitCd: string; // Package Unit Code
    pkg: number;  // package
    qtyUnitCd: string; // Quantity Unit Code
    qty: number; // Quantity
    prc: number; // Unit Price
    splyAmt: number; // Supplier Amount
    dcRt: number; // Discount Rate
    dcAmt: number; // Discount Amount
    isrccCd?: string | null; //Insurance Company code
    isrccNm?: string | null; // Insurance Company Name
    isrcRt?: number | null; // Insurance Rate
    isrcAmt?: number | null; // Insurance Amount
    taxTyCd: string; // Taxation Type Code
    taxblAmt: number; // Taxable Amount
    taxAmt: number; // Tax Amount
    totAmt: number; // Total Amount // * duplicate column
}

export interface SalesTransactionResponse {
    id?: number;  // auto increment
    sales_transactions_id: number;
    rcptNo?: number; // Receipt Number
    intrlData?: string; // Internal Data
    rcptSign?: string; // Receipt Signature
    totRcptNo?: number; // Total Receipt Number
    vsdcRcptPbctDate?: string; // VSDC Receipt Publication Date
    sdcId?: string; // SDC ID
    mrcNo?: string; // MRC Number
}