import { apiService } from './api';
import { Product, ProductionRecord, EnvironmentRecord, QualityRecord } from '../types';

export const productService = {
    // 创建新的农产品
    createProduct: async (productData: Partial<Product>): Promise<Product> => {
        return apiService.post<Product>('/products', productData);
    },

    // 获取农户的所有农产品
    getFarmerProducts: async (farmerId: string): Promise<Product[]> => {
        return apiService.get<Product[]>(`/products/farmer/${farmerId}`);
    },

    // 获取单个农产品详情
    getProduct: async (productId: string): Promise<Product> => {
        return apiService.get<Product>(`/products/${productId}`);
    },

    // 更新农产品状态
    updateProductStatus: async (productId: string, status: Product['status']): Promise<Product> => {
        return apiService.put<Product>(`/products/${productId}/status`, { status });
    },

    // 添加生产记录
    addProductionRecord: async (productId: string, recordData: Omit<ProductionRecord, 'id' | 'productId'>): Promise<ProductionRecord> => {
        return apiService.post<ProductionRecord>(`/products/${productId}/production-records`, recordData);
    },

    // 获取生产记录
    getProductionRecords: async (productId: string): Promise<ProductionRecord[]> => {
        return apiService.get<ProductionRecord[]>(`/products/${productId}/production-records`);
    },

    // 获取环境记录
    getEnvironmentRecords: async (productId: string): Promise<EnvironmentRecord[]> => {
        return apiService.get<EnvironmentRecord[]>(`/environment/product/${productId}`);
    },

    // 获取质量检测记录
    getQualityRecords: async (productId: string): Promise<QualityRecord[]> => {
        return apiService.get<QualityRecord[]>(`/quality/product/${productId}`);
    },

    // 获取指定状态的产品
    getProductsByStatus: async (status: Product['status']): Promise<Product[]> => {
        try {
            const response = await apiService.get<Product[]>(`/products/status/${status}`);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching products by status:', error);
            return [];
        }
    }
}; 