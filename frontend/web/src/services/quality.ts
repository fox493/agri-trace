import { apiService } from './api';
import { Product, QualityRecord } from '../types';

export const qualityService = {
    // 添加质量检测记录
    addQualityRecord: async (record: Omit<QualityRecord, 'inspectorId' | 'recordTime'> & { id: string }): Promise<void> => {
        try {
            await apiService.post('/quality', record);
        } catch (error) {
            console.error('Error adding quality record:', error);
            throw error;
        }
    },

    // 获取待检测的农产品列表
    getPendingProducts: async (): Promise<Product[]> => {
        try {
            const response = await apiService.get<Product[]>('/quality/pending');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching pending products:', error);
            return [];
        }
    },

    // 获取质检员的检测历史
    getInspectionHistory: async (): Promise<QualityRecord[]> => {
        try {
            const response = await apiService.get<QualityRecord[]>('/quality/inspector/history');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching inspection history:', error);
            return [];
        }
    },

    // 获取指定产品的质量检测记录
    getProductQualityRecords: async (productId: string): Promise<QualityRecord[]> => {
        try {
            const response = await apiService.get<QualityRecord[]>(`/quality/product/${productId}`);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching quality records:', error);
            return [];
        }
    }
}; 