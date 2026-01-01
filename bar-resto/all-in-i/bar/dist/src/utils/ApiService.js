"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
class ApiService {
    constructor(headers) {
        this.EBM_BASE_URL = process.env.EBM_BASE_URL || "http://localhost:4000";
        this.headers = headers;
    }
    async fetch(endpoint, method = "GET", body) {
        const response = await fetch(`${this.EBM_BASE_URL}${endpoint}`, {
            method,
            headers: Object.assign({ "Content-Type": "application/json" }, (this.headers)),
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                throw {
                    resultCd: "401",
                    resultMsg: "Unauthorized, Please check your credentials"
                };
            }
            if (response.status === 404) {
                throw {
                    resultCd: "404",
                    resultMsg: `Not Found, Please check your endpoint ${this.EBM_BASE_URL}/${endpoint}`
                };
            }
            // Just throw the error data object directly
            throw errorData;
        }
        return response.json();
    }
}
exports.ApiService = ApiService;
