export class ApiService {
  private readonly EBM_BASE_URL = process.env.EBM_BASE_URL ||  "http://localhost:4000";
  private headers: any;

  constructor(headers: any) {
    this.headers = headers;
  }

async fetch<T>(endpoint: string, method: string = "GET", body?: any): Promise<T> {
  const response = await fetch(`${this.EBM_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(this.headers)
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    if(response.status === 401) {
      throw { 
        resultCd: "401", 
        resultMsg: "Unauthorized, Please check your credentials" 
      };
    }
    if(response.status === 404){
      throw { 
        resultCd: "404", 
        resultMsg: `Not Found, Please check your endpoint ${this.EBM_BASE_URL}/${endpoint}`
      };
    }
    
    // Just throw the error data object directly
    
    throw errorData;
  }
  
  return response.json() as Promise<T>;
}
}