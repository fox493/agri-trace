import axios from 'axios';
import { message } from 'antd';

const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // 未授权，清除token并跳转到登录页
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    message.error('没有权限访问该资源');
                    break;
                case 404:
                    message.error('请求的资源不存在');
                    break;
                case 500:
                    message.error('服务器错误，请稍后重试');
                    break;
                default:
                    message.error(error.response.data?.message || '请求失败');
            }
        } else if (error.request) {
            message.error('网络错误，请检查网络连接');
        } else {
            message.error('请求配置错误');
        }
        return Promise.reject(error);
    }
);

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    params?: any;
    headers?: Record<string, string>;
}

export async function request(url: string, options: RequestOptions = {}) {
    try {
        const response = await instance({
            url,
            method: options.method || 'GET',
            data: options.data,
            params: options.params,
            headers: options.headers,
        });
        return response;
    } catch (error) {
        throw error;
    }
} 