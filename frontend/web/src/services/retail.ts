import { RetailInventory, SalesRecord, PriceRecord } from '../types';
import { request } from './request';

// 库存管理
export async function addInventory(data: Partial<RetailInventory>) {
    return request('/api/retail/inventory', {
        method: 'POST',
        data,
    });
}

export async function updateInventory(id: string, quantity: number) {
    return request(`/api/retail/inventory/${id}`, {
        method: 'PUT',
        data: { quantity },
    });
}

export async function getInventoryList() {
    return request('/api/retail/inventory', {
        method: 'GET',
    });
}

// 销售记录
export async function addSalesRecord(data: Partial<SalesRecord>) {
    return request('/api/retail/sales', {
        method: 'POST',
        data,
    });
}

export async function getSalesList() {
    return request('/api/retail/sales', {
        method: 'GET',
    });
}

// 价格管理
export async function setProductPrice(data: Partial<PriceRecord>) {
    return request('/api/retail/price', {
        method: 'POST',
        data,
    });
}

export async function getPriceHistory(productId: string) {
    return request(`/api/retail/price/${productId}/history`, {
        method: 'GET',
    });
}

export async function getCurrentPrice(productId: string) {
    return request(`/api/retail/price/${productId}/current`, {
        method: 'GET',
    });
}

// 产品状态管理
export async function putProductOnSale(productId: string) {
    return request(`/api/retail/product/${productId}/onsale`, {
        method: 'POST',
    });
}

export async function takeProductOffShelf(productId: string) {
    return request(`/api/retail/product/${productId}/offshelf`, {
        method: 'POST',
    });
}

export async function markProductAsSoldOut(productId: string) {
    return request(`/api/retail/product/${productId}/soldout`, {
        method: 'POST',
    });
} 