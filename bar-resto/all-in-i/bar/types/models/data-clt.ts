export interface ResultData {
    resultCd: string;
    resultMsg: string;
    resultDt: string;
    data: any;
}


export interface InvoiceResponse {
    rcptNo: number;
    intrlData: string;
    rcptSign: string;
    totRcptNo: number;
    vsdcRcptPbctDate: string;
    sdcId: string;
    mrcNo: string;
}