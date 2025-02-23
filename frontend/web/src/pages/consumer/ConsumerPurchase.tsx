import React, { useEffect, useState } from 'react';
import { Card, List, Button, Modal, Form, InputNumber, Select, message, Space } from 'antd';
import { getOnSaleProducts, addPurchaseRecord, getRetailers } from '../../services/consumer';

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

const ConsumerPurchase: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [selectedRetailer, setSelectedRetailer] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchRetailers();
    }, []);

    useEffect(() => {
        if (selectedRetailer) {
            fetchProducts();
        } else {
            setProducts([]);
        }
    }, [selectedRetailer]);

    const fetchProducts = async () => {
        if (!selectedRetailer) return;
        try {
            setLoading(true);
            const data = await getOnSaleProducts(selectedRetailer);
            setProducts(data || []);
        } catch (error) {
            message.error('获取商品列表失败');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRetailers = async () => {
        try {
            setLoading(true);
            const response = await getRetailers();
            console.log('Retailers data:', response);

            // 验证数据结构
            const validRetailers = response.filter(retailer => 
                retailer && typeof retailer === 'object' && 
                'id' in retailer && 'name' in retailer
            );

            console.log('Valid retailers:', validRetailers);
            setRetailers(validRetailers);
        } catch (error) {
            console.error('Error fetching retailers:', error);
            message.error('获取零售商列表失败');
            setRetailers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRetailerChange = (value: string) => {
        console.log('Selected retailer:', value);
        setSelectedRetailer(value);
    };

    const handlePurchase = (product: Product) => {
        setSelectedProduct(product);
        setIsModalVisible(true);
        form.setFieldsValue({
            retailerId: selectedRetailer,
            quantity: 1,
            unitPrice: product.currentPrice
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (!selectedProduct) return;

            const purchaseData = {
                productId: selectedProduct.id,
                retailerId: selectedRetailer,
                quantity: values.quantity,
                unitPrice: values.unitPrice,
                paymentType: values.paymentType
            };

            await addPurchaseRecord(purchaseData);
            message.success('购买成功');
            setIsModalVisible(false);
            form.resetFields();
            fetchProducts();
        } catch (error: any) {
            console.error('Purchase failed:', error);
            // 显示具体的错误信息
            message.error(error.message || '购买失败');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                    <h3>选择零售商</h3>
                    <Select
                        placeholder="请选择零售商"
                        style={{ width: 300 }}
                        onChange={handleRetailerChange}
                        value={selectedRetailer || undefined}
                        loading={loading}
                    >
                        {retailers.map(retailer => (
                            <Select.Option 
                                key={retailer.id} 
                                value={retailer.id}
                            >
                                {retailer.name || '未命名零售商'}
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                {selectedRetailer && (
                    <List
                        grid={{ gutter: 16, column: 4 }}
                        dataSource={products}
                        loading={loading}
                        renderItem={product => (
                            <List.Item>
                                <Card
                                    title={product.name}
                                    actions={[
                                        <Button 
                                            type="primary" 
                                            onClick={() => handlePurchase(product)}
                                            disabled={!product.inventory || product.inventory <= 0}
                                        >
                                            购买
                                        </Button>
                                    ]}
                                >
                                    <p>价格: ¥{product.currentPrice}</p>
                                    <p>库存: {product.inventory || 0}</p>
                                    <p>{product.description}</p>
                                </Card>
                            </List.Item>
                        )}
                    />
                )}
            </Space>

            <Modal
                title="确认购买"
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="retailerId"
                        label="零售商"
                    >
                        <Select disabled>
                            {retailers.map(retailer => (
                                <Select.Option key={retailer.id} value={retailer.id}>
                                    {retailer.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="quantity"
                        label="购买数量"
                        rules={[{ required: true, message: '请输入购买数量' }]}
                    >
                        <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item
                        name="unitPrice"
                        label="单价"
                    >
                        <InputNumber disabled />
                    </Form.Item>
                    <Form.Item
                        name="paymentType"
                        label="支付方式"
                        rules={[{ required: true, message: '请选择支付方式' }]}
                    >
                        <Select>
                            <Select.Option value="CASH">现金</Select.Option>
                            <Select.Option value="CARD">银行卡</Select.Option>
                            <Select.Option value="MOBILE">移动支付</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ConsumerPurchase; 