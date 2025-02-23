declare module '*.css';
declare module '*.less';
declare module '*.png';
declare module '*.svg' {
    export function ReactComponent(props: React.SVGProps<SVGSVGElement>): React.ReactElement;
    const url: string;
    export default url;
}

export interface Product {
    id: string;
    name: string;
    area: number;
    plantingDate: string;
    harvestDate?: string;
    status: 'PLANTING' | 'HARVESTED' | 'ON_SALE' | 'SOLD_OUT' | 'OFF_SHELF';
    farmerId: string;
    location: string;
    createdAt: string;
    updatedAt: string;
}

export interface Farm {
    id: string;
    name: string;
    address: string;
    location: {
        latitude: number;
        longitude: number;
    };
    owner: string;
    certifications: string[];
    products: string[];
}

export interface TraceabilityRecord {
    id: string;
    productId: string;
    timestamp: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    action: string;
    operator: string;
    data: Record<string, any>;
}

export interface ProductionRecord {
    id: string;
    productId: string;
    type: 'PLANTING' | 'FERTILIZING' | 'HARVESTING';
    date: string;
    description: string;
    operatorId: string;
    createdAt: string;
}

export interface EnvironmentRecord {
    id: string;
    productId: string;
    temperature: number;
    humidity: number;
    recordTime: string;
    operatorId: string;
}

export type StageType = 'PLANTING' | 'GROWING' | 'HARVESTING';

export interface QualityRecord {
    id: string;
    productId: string;
    stage: StageType;
    testType: string;
    result: string;
    isQualified: boolean;
    inspectorId: string;
    recordTime: string;
}

export interface User {
    id?: string;
    _id?: string;
    username: string;
    role: 'admin' | 'farmer' | 'inspector' | 'logistics' | 'retailer' | 'consumer';
    name: string;
    email?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LogisticsRecord {
    id: string;
    productId: string;
    location: string;
    status: 'IN_TRANSIT' | 'DELIVERED';
    description: string;
    operatorId: string;
    recordTime: string;
}

export interface RetailInventory {
    id: string;
    productId: string;
    retailerId: string;
    quantity: number;
    minQuantity: number;
    updatedAt: string;
}

export interface SalesRecord {
    id: string;
    productId: string;
    retailerId: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    saleTime: string;
    paymentType: string;
}

export interface PriceRecord {
    id: string;
    productId: string;
    retailerId: string;
    price: number;
    startTime: string;
    endTime?: string;
    status: 'ACTIVE' | 'INACTIVE';
    uniqueId?: string;
}

export interface ConsumerPurchase {
    id: string;
    salesId: string;
    productId: string;
    consumerId: string;
    retailerId: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    purchaseTime: string;
    paymentType: string;
    purchaseCode: string;
}

export interface ProductFeedback {
    id: string;
    productId: string;
    consumerId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface Consumer {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
} 