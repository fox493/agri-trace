import React, { useState, useEffect, useCallback } from 'react';
import { 
    Table, 
    Button, 
    Space, 
    Tag, 
    message, 
    Card,
    Row,
    Col
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/product';
import CreateProductModal from './CreateProductModal';
import { Product } from '../../types';

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const navigate = useNavigate();

    // 从localStorage获取用户信息
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await productService.getFarmerProducts(user.id);
            setProducts(data);
        } catch (error) {
            message.error('获取农产品列表失败');
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleCreateProduct = async (values: Partial<Product>) => {
        try {
            await productService.createProduct({
                ...values,
                farmerId: user.id
            });
            message.success('创建农产品成功');
            setIsModalVisible(false);
            fetchProducts();
        } catch (error) {
            message.error('创建农产品失败');
            console.error('Error creating product:', error);
        }
    };

    const handleViewDetails = (productId: string) => {
        navigate(`/products/${productId}`);
    };

    const columns = [
        {
            title: '产品名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '种植面积(亩)',
            dataIndex: 'area',
            key: 'area',
        },
        {
            title: '种植日期',
            dataIndex: 'plantingDate',
            key: 'plantingDate',
        },
        {
            title: '收获日期',
            dataIndex: 'harvestDate',
            key: 'harvestDate',
            render: (text: string) => text || '-'
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'PLANTING' ? 'processing' : 'success'}>
                    {status === 'PLANTING' ? '种植中' : '已收获'}
                </Tag>
            )
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: Product) => (
                <Space size="middle">
                    <Button type="link" onClick={() => handleViewDetails(record.id)}>
                        查看详情
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <h2>我的农产品</h2>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                        >
                            添加农产品
                        </Button>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    loading={loading}
                />

                <CreateProductModal
                    visible={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    onSubmit={handleCreateProduct}
                />
            </Card>
        </div>
    );
};

export default ProductList; 