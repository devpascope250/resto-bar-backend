export interface SaveStockMaster {
    id?: number;  // auto increment
    tin?: string;
    bhfId?: string;
    itemCd: string;
    rsdQty: number;
    regrNm: string;
    regrId: string;
    modrNm: string;
    modrId: string;
}