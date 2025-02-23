import { ConsumerPurchase, ProductFeedback } from '../types';
import apiService from './api';

interface Product {
    id: string;
    name: string;
    currentPrice: number;
    description: string;
    inventory?: number;
}

interface Retailer {
    id: string;
    name: string;
}

interface ApiResponse<T> {
    data: T;
}

interface PriceResponse {
    id: string;
    productId: string;
    retailerId: string;
    price: number;
    startTime: string;
    endTime: string;
    status: string;
}

interface RetailInventory {
    id: string;
    productId: string;
    retailerId: string;
    quantity: number;
    minQuantity: number;
    updatedAt: string;
}

// 获取在售商品列表
export const getOnSaleProducts = async (retailerId: string): Promise<Product[]> => {
    try {
        const response = await apiService.get<Product[]>(`/products/status/ON_SALE`);
        console.log('On sale products response:', response);
        
        let products: Product[] = [];
        if (Array.isArray(response)) {
            products = response;
        } else if (response && typeof response === 'object') {
            const data = (response as any).data;
            products = Array.isArray(data) ? data : [];
        }

        // 获取每个商品的当前价格和库存
        const productsWithPriceAndInventory = await Promise.all(
            products.map(async (product) => {
                try {
                    const [priceResponse, inventoryResponse] = await Promise.all([
                        apiService.get<PriceResponse>(`/retail/price/${product.id}/current`),
                        apiService.get<RetailInventory[]>(`/retail/inventory?retailerId=${retailerId}`)
                    ]);
                    
                    console.log(`Price response for product ${product.id}:`, priceResponse);
                    console.log(`Inventory response for product ${product.id}:`, inventoryResponse);
                    
                    // 获取价格
                    const currentPrice = priceResponse && typeof priceResponse === 'object' ? priceResponse.price : 0;
                    
                    // 获取库存
                    let inventory = 0;
                    if (Array.isArray(inventoryResponse)) {
                        const productInventory = inventoryResponse.find(inv => inv.productId === product.id);
                        if (productInventory) {
                            inventory = productInventory.quantity;
                        }
                    }
                    
                    return {
                        ...product,
                        currentPrice,
                        inventory
                    };
                } catch (error) {
                    console.error(`Failed to fetch price or inventory for product ${product.id}:`, error);
                    return {
                        ...product,
                        currentPrice: 0,
                        inventory: 0
                    };
                }
            })
        );
        
        console.log('Products with prices and inventory:', productsWithPriceAndInventory);
        return productsWithPriceAndInventory;
    } catch (error) {
        console.error('Failed to fetch on-sale products:', error);
        throw error;
    }
};

// 获取零售商列表
export const getRetailers = async (): Promise<Retailer[]> => {
    try {
        const response = await apiService.get<Retailer[]>('/consumer/retailers');
        console.log('API response:', response);
        
        // 确保返回数组
        if (Array.isArray(response)) {
            return response;
        } else if (response && typeof response === 'object') {
            // 如果响应是一个对象，检查是否有data属性
            const data = (response as any).data;
            return Array.isArray(data) ? data : [];
        }
        
        return [];
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
};

// 检查商品库存
const checkInventory = async (productId: string, retailerId: string): Promise<RetailInventory | null> => {
    try {
        console.log('Checking inventory for:', { productId, retailerId });
        
        const response = await apiService.get<RetailInventory[]>(`/retail/inventory?retailerId=${retailerId}`);
        console.log('Raw inventory response:', response);
        
        let inventories: RetailInventory[] = [];
        if (Array.isArray(response)) {
            inventories = response;
        } else if (response && typeof response === 'object') {
            const data = (response as any).data;
            inventories = Array.isArray(data) ? data : [];
        }

        console.log('Processed inventories:', inventories);
        console.log('Looking for inventory with productId:', productId, 'and retailerId:', retailerId);

        // 查找匹配的库存记录
        const inventory = inventories.find(inv => 
            inv.productId === productId && inv.retailerId === retailerId
        );

        console.log('Found inventory:', inventory);
        return inventory || null;
    } catch (error) {
        console.error('Failed to check inventory:', error);
        return null;
    }
};

// 添加购买记录
export const addPurchaseRecord = async (purchaseData: Partial<ConsumerPurchase>) => {
    try {
        // 先检查库存
        const inventory = await checkInventory(purchaseData.productId!, purchaseData.retailerId!);
        console.log('Checking inventory before purchase:', inventory);
        
        if (!inventory) {
            throw new Error('该商品暂无库存');
        }
        
        if (inventory.quantity < (purchaseData.quantity || 0)) {
            throw new Error(`库存不足，当前库存: ${inventory.quantity}, 需要数量: ${purchaseData.quantity}`);
        }

        console.log('Purchase data to be submitted:', purchaseData);
        const response = await apiService.post('/consumer/purchase', purchaseData);
        return response;
    } catch (error) {
        console.error('Purchase error:', error);
        throw error;
    }
};

// 查询购买历史
export const getPurchaseHistory = async () => {
    try {
        const response = await apiService.get('/consumer/purchases');
        return response;
    } catch (error) {
        throw error;
    }
};

// 添加商品反馈
export const addProductFeedback = async (feedbackData: Partial<ProductFeedback>) => {
    try {
        const response = await apiService.post('/consumer/feedback', feedbackData);
        return response;
    } catch (error) {
        throw error;
    }
};

// 查询反馈历史
export const getFeedbackHistory = async () => {
    try {
        const response = await apiService.get('/consumer/feedback');
        return response;
    } catch (error) {
        throw error;
    }
};

// 获取商品当前价格
export const getCurrentPrice = async (productId: string) => {
    try {
        const response = await apiService.get(`/retail/price/${productId}/current`);
        return response;
    } catch (error) {
        throw error;
    }
}; 