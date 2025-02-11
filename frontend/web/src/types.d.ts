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
    batchNumber: string;
    farmId: string;
    plantingDate?: string;
    harvestDate?: string;
    location?: {
        latitude: number;
        longitude: number;
        address: string;
    };
    certifications?: string[];
    status: string;
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