export interface PurchaseSalesTransaction {
    id?: number; // auto increment
    tin?: string; // TIN
    bhfId?: string;
    spplrTin?: string; // Supplier TIN
    spplrNm?: string; // Supplier Name
    spplrBhfId?: string; // Supplier Branch Id
    spplrInvcNo?: number; // Supplier Invoice Number
    prcOrdCd?: string | null // purchase Code
    rcptTyCd?: string // Receipt type
    pmtTyCd?: string  // payment Type code
    cfmDt?: string // validated date
    salesDt?: string // Sale Date
    stockRlsDt?: string  // Stock Release date
    totItemCnt?: number // Total Item Count
    taxblAmtA?: number  // Taxable Amount A
    taxblAmtB?: number  // Taxable Amount B
    taxblAmtC?: number  // Taxable Amount c
    taxblAmtD?: number  // Taxable Amount D
    taxRtA?: number   // Tax Rate A
    taxRtB?: number   // Tax Rate B
    taxRtC?: number   // Tax Rate C
    taxRtD?: number   // Tax Rate D
    taxAmtA?: number   // Tax Amount A
    taxAmtB?: number   // Tax Amount B
    taxAmtC?: number   // Tax Amount C
    taxAmtD?: number   // Tax Amount C
    totTaxblAmt?: number // Total Taxable Amount
    totTaxAmt?: number // Total Tax Amount
    totAmt?: number   // Total Amount
    remark?: string   // Remark
    createdAt?: Date;
    itemList?: PurchaseSalesTransactionItem[];
}

export interface PurchaseSalesTransactionItem{
    id?: number; // auto increment
    purchaseSalesTransactionId?: number; // Purchase Sales Transaction Id
    itemSeq?: number  // Item Sequence Number
    itemClsCd?: string  // Item Classification code
    itemCd?: string  // Item code
    itemNm?:  string   // Item Name
    bcd?:     string   // Barcode
    pkgUnitCd?: string // Package unity Code
    pkg?: number;   // package
    qtyUnitCd?: string // Quantity Unity Code
    qty?:   number // Quantity
    prc?: number // unit Price
    splyAmt?: number // supply Ammount
    dcRt?: number  // Discount Rate
    dcAmt?: number // Discount Amount
    taxTyCd?: number  // Tax Type Code
    taxblAmt?: number  // Taxable Amount
    taxAmt?: number  // Tax Amount
    totAmt?:  number  //total amount   // duplicate column
    createdAt?: Date;
}