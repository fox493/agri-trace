import { apiService } from './api';
import { LogisticsRecord } from '../types';

export const logisticsService = {
    // 添加物流记录
    addLogisticsRecord: async (recordData: Omit<LogisticsRecord, 'operatorId' | 'recordTime'>): Promise<LogisticsRecord> => {
        return apiService.post<LogisticsRecord>('/logistics', recordData);
    },

    // 更新物流记录
    updateLogisticsRecord: async (recordId: string, data: Pick<LogisticsRecord, 'status' | 'location' | 'description'>): Promise<LogisticsRecord> => {
        return apiService.put<LogisticsRecord>(`/logistics/${recordId}`, data);
    },

    // 获取单个物流记录
    getLogisticsRecord: async (recordId: string): Promise<LogisticsRecord> => {
        return apiService.get<LogisticsRecord>(`/logistics/${recordId}`);
    },

    // 获取产品的所有物流记录
    getProductLogisticsRecords: async (productId: string): Promise<LogisticsRecord[]> => {
        try {
            const response = await apiService.get<LogisticsRecord[]>(`/logistics/product/${productId}`);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching product logistics records:', error);
            return [];
        }
    },

    // 获取当前操作员的物流记录
    getOperatorLogisticsRecords: async (): Promise<LogisticsRecord[]> => {
        try {
            const response = await apiService.get<LogisticsRecord[]>('/logistics');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching operator logistics records:', error);
            return [];
        }
    }
}; 