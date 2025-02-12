import { apiService } from './api';
import { User } from '../types';

interface LoginResponse {
    success: boolean;
    token?: string;
    user?: User;
    error?: string;
}

interface RegisterResponse {
    success: boolean;
    token?: string;
    user?: User;
    error?: string;
}

interface RegisterData {
    username: string;
    password: string;
    role: User['role'];
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await apiService.post<LoginResponse>('/auth/login', { username, password });
        if (response.token && response.user) {
            localStorage.setItem('token', response.token);
            const userData = {
                ...response.user,
                id: response.user._id || response.user.id
            };
            localStorage.setItem('user', JSON.stringify(userData));
            return { success: true, token: response.token, user: userData };
        }
        return { success: false, error: '登录失败' };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: '登录失败' };
    }
};

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
    try {
        const response = await apiService.post<RegisterResponse>('/auth/register', data);
        if (response.token && response.user) {
            localStorage.setItem('token', response.token);
            const userData = {
                ...response.user,
                id: response.user._id || response.user.id
            };
            localStorage.setItem('user', JSON.stringify(userData));
            return { success: true, token: response.token, user: userData };
        }
        return { success: false, error: '注册失败' };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: '注册失败' };
    }
};

export const logout = (): void => {
    localStorage.clear();
    window.location.href = '/login';
};

export const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('token');
}; 