import { Request, Response } from "express";
import { RegenerateGetCurrent } from "../services/regenerateGetCurrent";

export const salesController = {
    //get all sales
    createNewSale: async (req: Request, res: Response) => {
         console.log('Check Corret  Reached');
        const headers = {
            'EbmToken': `Bearer ${req.context?.ebm_token}`,
            'MRC-code': req.context?.mrc_code || ''

        }
        const body = req.body;
        const userId = req?.user?.id;
        if(!userId){
            return res.status(401).json({ message: 'You`re not authorized to access this resource, please login first' });
        }
        const regenerate = new RegenerateGetCurrent();
        let currentIncrement = 0;
        const maxRetries = 5; // Set a maximum to prevent infinite loops

        const fetchWithRetry = async (): Promise<any> => {
            while (currentIncrement <= maxRetries) {
                try {
                    const response = await regenerate.createNewReceipt(headers, body, userId, currentIncrement);
                    console.log(`success with increment ${currentIncrement}`, response);
                    return response;
                } catch (err: any) {
                    console.log(`attempt ${currentIncrement} failed`, err);

                    if (err?.resultCd === 924 && currentIncrement < maxRetries) {
                        // Increase increment by 1 for next retry
                        currentIncrement++;
                        console.log(`Retrying with increment ${currentIncrement}`);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                        continue; // Try again with new increment
                    }
                    throw err; // Either not error 924 or reached max retries
                }
            }
            throw new Error(`Max retries (${maxRetries}) exceeded`);
        }

        try {
            const response = await fetchWithRetry();
            res.json(response);
        } catch (err: any) {
            console.log("failed after all retries", err);
            res.status(500).json(err);
        }
       
      
    },
    getInvoices: async (req: Request, res: Response) => {
        const body = req.body;
        const headers = {
            'EbmToken': `Bearer ${req.context?.ebm_token}`,
            'MRC-code': req.context?.mrc_code || ''
        }
        const regenerate = new RegenerateGetCurrent();
        let currentIncrement = 0;
        const maxRetries = 5; // Set a maximum to prevent infinite loops

        const fetchWithRetry = async (): Promise<any> => {
            while (currentIncrement <= maxRetries) {
                try {
                    const response = await regenerate.getReceipts(headers, body, currentIncrement);
                    console.log(`success with increment ${currentIncrement}`, response);
                    return response;
                } catch (err: any) {
                    console.log(`attempt ${currentIncrement} failed`, err);

                    if (err?.resultCd === 924 && currentIncrement < maxRetries) {
                        // Increase increment by 1 for next retry
                        currentIncrement++;
                        console.log(`Retrying with increment ${currentIncrement}`);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                        continue; // Try again with new increment
                    }
                    throw err; // Either not error 924 or reached max retries
                }
            }
            throw new Error(`Max retries (${maxRetries}) exceeded`);
        }

        try {
            const response = await fetchWithRetry();
            res.json(response);
        } catch (err: any) {
            console.log("failed after all retries", err);
            res.status(500).json(err);
        }
    }

}