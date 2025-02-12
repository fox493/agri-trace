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
    status: 'PLANTING' | 'HARVESTED';
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

export interface QualityRecord {
    id: string;
    productId: string;
    testType: string;
    result: string;
    isQualified: boolean;
    recordTime: string;
    inspectorId: string;
}

export interface User {
    id?: string;
    _id?: string;
    username: string;
    role: 'admin' | 'farmer' | 'inspector';
    name: string;
    email?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
} 