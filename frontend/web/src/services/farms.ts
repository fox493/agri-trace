import axios from 'axios';
import config from '../config';

export interface Farm {
    id: string;
    name: string;
    owner: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    size: number;
    products: string[];
    certifications: string[];
}

// 获取所有农场
export const getAllFarms = async (): Promise<Farm[]> => {
    const response = await axios.get<Farm[]>('/farms');
    return response.data;
};

// 获取单个农场信息
export const getFarm = async (id: string): Promise<Farm> => {
    const response = await axios.get<Farm>(`/farms/${id}`);
    return response.data;
};

// 创建新农场
export const createFarm = async (farmData: Omit<Farm, 'id'>): Promise<Farm> => {
    const response = await axios.post<Farm>('/farms', farmData);
    return response.data;
};

// 更新农场信息
export const updateFarm = async (id: string, farmData: Partial<Farm>): Promise<Farm> => {
    const response = await axios.put<Farm>(`/farms/${id}`, farmData);
    return response.data;
}; 