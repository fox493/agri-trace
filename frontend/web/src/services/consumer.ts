import { ConsumerPurchase, ProductFeedback } from '../types';
import apiService from './api';

interface Product {
    id: string;
    name: string;
    currentPrice: number;
    description: string;
    inventory?: number;
    retailerId?: string;
    retailerName?: string;
    retailersWithInventory?: RetailerWithInventory[];
}

interface Retailer {
    id: string;
    name: string;
}

interface RetailerWithInventory {
    retailerId: string;
    retailerName: string;
    inventory: number;
    price: number;
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

// 获取所有零售商的库存
export const getAllInventories = async (): Promise<RetailInventory[]> => {
    try {
        const response = await apiService.get<RetailInventory[]>('/retail/public/all-inventory');
        console.log('All inventories response:', response);
        
        let inventories: RetailInventory[] = [];
        if (Array.isArray(response)) {
            inventories = response;
        } else if (response && typeof response === 'object' && 'data' in response) {
            const data = (response as any).data;
            inventories = Array.isArray(data) ? data : [];
        }
        
        return inventories;
    } catch (error) {
        console.error('Failed to fetch all inventories:', error);
        return [];
    }
};

// 获取在售商品列表
export const getOnSaleProducts = async (): Promise<Product[]> => {
    try {
        const response = await apiService.get<Product[]>(`/products/status/ON_SALE`);
        console.log('On sale products response:', response);
        
        let products: Product[] = [];
        if (Array.isArray(response)) {
            products = response;
        } else if (response && typeof response === 'object') {
            const data = (response as any).data;
            products = Array.isArray(data) ? data : [];
            
            if (!Array.isArray(data) && typeof response === 'object' && 'id' in response) {
                products = [response as Product];
            }
        }
        
        console.log('Parsed products:', products);
        
        if (products.length === 0) {
            console.log('No products found');
            return [];
        }

        // 获取所有零售商的库存信息
        const retailInventories = await getAllInventories();
        console.log('All retail inventories:', retailInventories);

        // 获取所有零售商信息
        const retailers = await getRetailers();
        console.log('All retailers:', retailers);
        
        // 创建零售商映射
        const retailerMap = retailers.reduce((map, r) => {
            map[r.id] = r.name;
            return map;
        }, {} as Record<string, string>);
        
        console.log('Retailer map:', retailerMap);

        // 获取每个商品的详细信息
        const productsWithDetails = await Promise.all(
            products.map(async (product) => {
                try {
                    console.log('Processing product:', product.id, product.name);
                    
                    // 筛选出有这个产品库存的零售商
                    const productInventories = retailInventories.filter(inv => inv.productId === product.id);
                    console.log(`Found ${productInventories.length} retailers with inventory for product ${product.id}:`, productInventories);
                    
                    let retailersWithInventory: RetailerWithInventory[] = [];
                    let currentPrice = 0;
                    let inventory = 0;
                    let primaryRetailerId = '';
                    let primaryRetailerName = '';
                    
                    if (productInventories.length > 0) {
                        // 为每个零售商获取价格和库存信息
                        for (const inv of productInventories) {
                            try {
                                let price = 0;
                                
                                // 尝试获取价格
                                try {
                                    const priceResponse = await apiService.get<PriceResponse>(`/retail/price/${product.id}/${inv.retailerId}/current`);
                                    if (priceResponse && typeof priceResponse === 'object' && 'price' in priceResponse) {
                                        price = priceResponse.price;
                                    }
                                } catch (error) {
                                    console.warn(`Failed to fetch price for product ${product.id} from retailer ${inv.retailerId}, using default price:`, error);
                                    price = 9.9; // 默认价格
                                }

                                const retailerName = retailerMap[inv.retailerId];
                                console.log(`Retailer info for ${inv.retailerId}:`, { name: retailerName, quantity: inv.quantity });
                                
                                if (inv.quantity > 0) { // 只添加有库存的零售商
                                    retailersWithInventory.push({
                                        retailerId: inv.retailerId,
                                        retailerName: retailerName || '未知零售商',
                                        inventory: inv.quantity,
                                        price: price
                                    });
                                }
                            } catch (error) {
                                console.error(`Error processing retailer ${inv.retailerId}:`, error);
                            }
                        }
                    }
                    
                    // 按价格排序，选择最低价的零售商作为主要显示
                    if (retailersWithInventory.length > 0) {
                        retailersWithInventory.sort((a, b) => a.price - b.price);
                        const primaryRetailer = retailersWithInventory[0];
                        primaryRetailerId = primaryRetailer.retailerId;
                        primaryRetailerName = primaryRetailer.retailerName;
                        currentPrice = primaryRetailer.price;
                        inventory = primaryRetailer.inventory;
                    } else if (retailers.length > 0) {
                        // 如果没有库存信息，使用默认零售商
                        const defaultRetailer = retailers[0];
                        retailersWithInventory.push({
                            retailerId: defaultRetailer.id,
                            retailerName: defaultRetailer.name,
                            inventory: 0,
                            price: 9.9
                        });
                        primaryRetailerId = defaultRetailer.id;
                        primaryRetailerName = defaultRetailer.name;
                        currentPrice = 9.9;
                        inventory = 0;
                    }
                    
                    return {
                        ...product,
                        currentPrice: currentPrice || 9.9,
                        inventory: inventory,
                        retailerId: primaryRetailerId,
                        retailerName: primaryRetailerName,
                        retailersWithInventory
                    };
                } catch (error) {
                    console.error(`Failed to fetch details for product ${product.id}:`, error);
                    return {
                        ...product,
                        currentPrice: 9.9,
                        inventory: 0,
                        retailerId: '',
                        retailerName: '未知零售商',
                        retailersWithInventory: []
                    };
                }
            })
        );
        
        console.log('Final products with details:', productsWithDetails);
        return productsWithDetails;
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
            // 额外过滤，确保只有有效的零售商数据
            return response.filter(retailer => 
                retailer && typeof retailer === 'object' &&
                retailer.id && retailer.name
            );
        } else if (response && typeof response === 'object') {
            // 如果响应是一个对象，检查是否有data属性
            const data = (response as any).data;
            if (Array.isArray(data)) {
                return data.filter(retailer => 
                    retailer && typeof retailer === 'object' &&
                    retailer.id && retailer.name
                );
            }
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
        
        const inventories = await getAllInventories();
        console.log('All inventories:', inventories);

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