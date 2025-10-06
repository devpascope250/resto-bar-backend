/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
  statusCode?: number
  [key: string]: any
}

// 导出一个名为ApiError的类，继承自Error
export class ApiError extends Error {
  status: number
  data: ApiErrorResponse
  isApiError: boolean = true

  constructor(message: string, status: number, data: ApiErrorResponse) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  get fullMessage(): string {
    if (this.data?.errors) {
      return Object.entries(this.data.errors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('\n')
    }
    return this.data?.message || this.message
  }
}

export const getApiClient = () => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '/api'

  const getHeaders = (customHeaders?: HeadersInit): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    }

    // if (user?.token) {
    //   headers['Authorization'] = `Bearer ${user.token}`
    //   headers['X-Platform'] = 'WEB'
    // }

    return headers
  }

  const handleNetworkError = (error: unknown): never => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError('Network error - please check your connection', 0, {
        message: 'Network error occurred'
      })
    }
    throw error
  }

  const handleResponse = async <T>(response: Response): Promise<T> => {
    let data: ApiErrorResponse
    try {
      data = await response.json()
    } catch (error) {
      if (!response.ok) {
        throw new ApiError(
          `Request failed with status ${response.status}`,
          response.status,
          { message: await response.text() }
        )
      }
      return {} as T // Return empty object for non-JSON responses
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status,
        data
      )
    }

    return data as T
  }

  const request = async <T>(
    method: string,
    url: string,
    options?: RequestInit,
    body?: any
  ): Promise<T> => {
    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method,
        headers: getHeaders(options?.headers),
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      })
      return await handleResponse<T>(response)
    } catch (error) {
      return handleNetworkError(error)
    }
  }

  const get = async <T>(url: string, options?: RequestInit): Promise<T> => {
    return request<T>('GET', url, options)
  }

const post = async <T, V = any>(
  url: string,
  body?: V,
  options?: RequestInit
): Promise<T> => {
  // Create new headers object to avoid mutations
  const headers = new Headers(getHeaders(options?.headers));
  
  // Explicitly remove Content-Type for FormData
  if (body instanceof FormData) {
    headers.delete('Content-Type'); // Let browser set it automatically
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    });
    return await handleResponse<T>(response);
  } catch (error) {
    return handleNetworkError(error);
  }
};
const put = async <T, V = any>(
  url: string,
  body?: V,
  options?: RequestInit
): Promise<T> => {
  // Create new headers object to avoid mutations
  const headers = new Headers(getHeaders(options?.headers));

  // Explicitly remove Content-Type for FormData
  if (body instanceof FormData) {
    headers.delete('Content-Type'); // Let browser set it automatically
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'PUT',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    });
    return await handleResponse<T>(response);
  } catch (error) {
    return handleNetworkError(error);
  }
};
  const patch = async <T, V = any>(
    url: string,
    body?: V,
    options?: RequestInit
  ): Promise<T> => {
    return request<T>('PATCH', url, options, body)
  }

  const del = async <T>(url: string, options?: RequestInit): Promise<T> => {
    return request<T>('DELETE', url, options)
  }

  return {
    get,
    post,
    put,
    patch,
    delete: del,
  }
}

export type ApiClient = ReturnType<typeof getApiClient>