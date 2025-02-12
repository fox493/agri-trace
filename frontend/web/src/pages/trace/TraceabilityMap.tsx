import React, { useState } from 'react';
import { Card, Select, Table, Tag } from 'antd';
import { Product } from '../../types';

const { Option } = Select;

interface ExtendedProduct extends Product {
    batchNumber?: string;
    traceInfo?: {
        latitude: number;
        longitude: number;
        address: string;
    };
}

const TraceabilityMap: React.FC = () => {
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    
    // 模拟数据
    const products: ExtendedProduct[] = [
        {
            id: 'P001',
            name: '有机蔬菜',
            area: 100,
            plantingDate: '2024-01-01',
            harvestDate: '2024-02-01',
            farmerId: 'F001',
            status: 'HARVESTED',
            location: '福建省厦门市集美区',
            createdAt: '2024-01-01',
            updatedAt: '2024-02-01',
            batchNumber: 'B001',
            traceInfo: {
                latitude: 24.4798,
                longitude: 118.0819,
                address: '福建省厦门市集美区'
            }
        }
    ];

    const columns = [
        {
            title: '批次号',
            dataIndex: 'batchNumber',
            key: 'batchNumber',
        },
        {
            title: '产品名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'HARVESTED' ? 'success' : 'processing'}>
                    {status === 'HARVESTED' ? '已收获' : '种植中'}
                </Tag>
            ),
        },
        {
            title: '种植地点',
            dataIndex: ['traceInfo', 'address'],
            key: 'location',
        },
    ];

    const handleProductSelect = (value: string) => {
        setSelectedProduct(value);
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card title="产品溯源">
                <div style={{ marginBottom: 16 }}>
                    <Select
                        placeholder="选择产品"
                        style={{ width: 200 }}
                        onChange={handleProductSelect}
                        value={selectedProduct}
                    >
                        {products.map(product => (
                            <Option key={product.id} value={product.id}>
                                {product.name} {product.batchNumber ? `(${product.batchNumber})` : ''}
                            </Option>
                        ))}
                    </Select>
                </div>

                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                />
            </Card>
        </div>
    );
};

export default TraceabilityMap; 