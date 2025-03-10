import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: config.API_BASE_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // 请求拦截器
        this.api.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        this.api.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            (error) => {
                if (axios.isAxiosError(error)) {
                    // if (error.response?.status === 401) {
                    //     // 未授权，清除token并跳转到登录页
                    //     localStorage.clear();
                    //     window.location.href = '/login';
                    // }
                    return Promise.reject(error.response?.data || error.message);
                }
                return Promise.reject(error);
            }
        );
    }

    public async get<T>(url: string): Promise<T> {
        const response = await this.api.get<T>(url);
        return response.data;
    }

    public async post<T>(url: string, data?: any): Promise<T> {
        const response = await this.api.post<T>(url, data);
        return response.data;
    }

    public async put<T>(url: string, data?: any): Promise<T> {
        const response = await this.api.put<T>(url, data);
        return response.data;
    }

    public async delete<T>(url: string): Promise<T> {
        const response = await this.api.delete<T>(url);
        return response.data;
    }
}

export const apiService = new ApiService();
export default apiService;

// 溯源查询 API
export const TRACE_PRODUCT_API = '/api/trace/product';  // 获取产品溯源信息
export const TRACE_HISTORY_API = '/api/trace/history';  // 获取产品溯源历史
export const TRACE_CERTIFICATIONS_API = '/api/trace/certifications';  // 获取产品认证信息
export const TRACE_ENVIRONMENT_API = '/api/trace/environment';  // 获取产品环境数据
export const TRACE_INVENTORY_API = '/api/retail/public/inventory';  // 获取产品库存信息
export const VERIFY_PRODUCT_API = '/api/trace/verify';  // 验证产品真实性 