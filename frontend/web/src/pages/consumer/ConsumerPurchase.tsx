import React, { useEffect, useState } from 'react';
import { Card, List, Button, Modal, Form, InputNumber, Select, message, Space, Badge, Tag, Tooltip, Typography } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, QrcodeOutlined } from '@ant-design/icons';
import { getOnSaleProducts, addPurchaseRecord } from '../../services/consumer';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface RetailerWithInventory {
    retailerId: string;
    retailerName: string;
    inventory: number;
    price: number;
}

interface Product {
    id: string;
    name: string;
    currentPrice: number;
    description: string;
    inventory?: number;
    retailerId?: string;
    retailerName?: string;
    retailersWithInventory?: RetailerWithInventory[];
    plantingDate?: string;
    location?: string;
}

const ConsumerPurchase: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedRetailer, setSelectedRetailer] = useState<string>('');
    const [form] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            console.log('Fetching products...');
            // @ts-ignore - 忽略参数不匹配的错误
            const data = await getOnSaleProducts();
            console.log('Products fetched:', data);
            
            if (!data || data.length === 0) {
                console.log('No products returned from API');
                message.info('当前没有在售商品');
                setProducts([]);
            } else {
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            message.error('获取商品列表失败');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = (product: Product) => {
        setSelectedProduct(product);
        // 默认选择主要零售商
        setSelectedRetailer(product.retailerId || '');
        setIsModalVisible(true);
        
        // 计算初始总价
        const initialQuantity = 1;
        const initialPrice = product.currentPrice || 0;
        const initialTotalPrice = initialPrice * initialQuantity;
        
        // 预设表单值
        form.setFieldsValue({
            retailerId: product.retailerId,
            quantity: initialQuantity,
            unitPrice: initialPrice,
            totalPrice: initialTotalPrice
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (!selectedProduct) return;

            // 查找选择的零售商信息
            const retailer = selectedProduct.retailersWithInventory?.find(r => r.retailerId === values.retailerId);
            if (!retailer) {
                message.error('零售商信息不存在');
                return;
            }

            // 检查库存是否足够
            if (values.quantity > retailer.inventory) {
                message.error(`库存不足: 当前库存 ${retailer.inventory}, 需要数量 ${values.quantity}`);
                return;
            }

            // 计算总价
            const totalAmount = retailer.price * values.quantity;

            const purchaseData = {
                productId: selectedProduct.id,
                retailerId: values.retailerId,
                quantity: values.quantity,
                unitPrice: retailer.price, // 使用选择零售商的价格
                paymentType: values.paymentType
            };

            await addPurchaseRecord(purchaseData);
            message.success(`购买成功！总价: ¥${totalAmount.toFixed(2)}`);
            setIsModalVisible(false);
            form.resetFields();
            fetchProducts(); // 刷新商品列表
        } catch (error: any) {
            console.error('Purchase failed:', error);
            message.error(error.message || '购买失败');
        }
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleRetailerChange = (value: string) => {
        setSelectedRetailer(value);
        
        // 更新价格和总价
        if (selectedProduct && selectedProduct.retailersWithInventory) {
            const retailer = selectedProduct.retailersWithInventory.find(r => r.retailerId === value);
            if (retailer) {
                const quantity = form.getFieldValue('quantity') || 1;
                const unitPrice = retailer.price;
                const totalPrice = unitPrice * quantity;
                
                form.setFieldsValue({ 
                    unitPrice: unitPrice,
                    totalPrice: totalPrice
                });
            }
        }
    };

    // 当数量变化时重新计算总价
    const handleQuantityChange = (value: number | null) => {
        if (!value || !selectedProduct || !selectedRetailer) return;
        
        const retailer = selectedProduct.retailersWithInventory?.find(r => r.retailerId === selectedRetailer);
        if (retailer) {
            const unitPrice = retailer.price;
            const totalPrice = unitPrice * value;
            form.setFieldsValue({ totalPrice: totalPrice });
        }
    };

    // 跳转到溯源查询页面
    const handleTraceProduct = (productId: string) => {
        navigate(`/trace?productId=${productId}`);
    };

    return (
        <div style={{ padding: '24px' }}>
            <div className="product-list">
                <h2>农产品商城</h2>
                <List
                    grid={{ gutter: 16, column: 4 }}
                    dataSource={products}
                    loading={loading}
                    locale={{ emptyText: '暂无在售商品' }}
                    renderItem={product => (
                        <List.Item>
                            <Card
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Tooltip title={`产品ID: ${product.id}`}>
                                            <span>{product.name || '未命名产品'}</span>
                                        </Tooltip>
                                        <Tooltip title="查看溯源信息">
                                            <QrcodeOutlined 
                                                style={{ fontSize: '18px', cursor: 'pointer' }}
                                                onClick={() => handleTraceProduct(product.id)}
                                            />
                                        </Tooltip>
                                    </div>
                                }
                                hoverable
                                actions={[
                                    <Button 
                                        type="primary" 
                                        icon={<ShoppingCartOutlined />}
                                        onClick={() => handlePurchase(product)}
                                        disabled={!product.inventory || product.inventory <= 0}
                                    >
                                        {!product.inventory || product.inventory <= 0 ? '无库存' : '购买'}
                                    </Button>
                                ]}
                                style={{ position: 'relative' }}
                            >
                                {/* 价格标签 */}
                                <div style={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 12,
                                    backgroundColor: '#52c41a',
                                    color: 'white',
                                    padding: '2px 10px',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    zIndex: 1
                                }}>
                                    ¥{(product.currentPrice || 0).toFixed(2)}
                                </div>
                                
                                <div style={{ marginBottom: '10px', marginTop: '10px' }}>
                                    <Tag color="blue">库存: {product.inventory || 0}</Tag>
                                    <Tag color="purple">零售商: {product.retailerName || '未知'}</Tag>
                                </div>
                                <div style={{ height: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {product.description || product.location || '暂无描述'}
                                </div>
                                <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                                    {product.plantingDate && <div>种植日期: {product.plantingDate}</div>}
                                    {product.location && <div>产地: {product.location}</div>}
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>

            <Modal
                title="确认购买"
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okButtonProps={{ disabled: !selectedProduct?.retailersWithInventory?.length }}
            >
                {selectedProduct && (
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="retailerId"
                            label="选择零售商"
                            rules={[{ required: true, message: '请选择零售商' }]}
                        >
                            <Select onChange={handleRetailerChange}>
                                {selectedProduct.retailersWithInventory && selectedProduct.retailersWithInventory.length > 0 ? (
                                    selectedProduct.retailersWithInventory.map(retailer => (
                                        <Select.Option 
                                            key={retailer.retailerId} 
                                            value={retailer.retailerId}
                                            disabled={retailer.inventory <= 0}
                                        >
                                            {retailer.retailerName} - ¥{retailer.price.toFixed(2)} (库存: {retailer.inventory})
                                        </Select.Option>
                                    ))
                                ) : (
                                    // 如果没有零售商信息，添加一个默认选项
                                    <Select.Option value="default" disabled>
                                        暂无零售商信息
                                    </Select.Option>
                                )}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="quantity"
                            label="购买数量"
                            rules={[{ required: true, message: '请输入购买数量' }]}
                        >
                            <InputNumber 
                                min={1} 
                                style={{ width: '100%' }} 
                                onChange={handleQuantityChange}
                                disabled={!selectedProduct?.retailersWithInventory?.length} 
                            />
                        </Form.Item>
                        <Form.Item
                            name="unitPrice"
                            label="单价"
                        >
                            <InputNumber 
                                disabled 
                                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                style={{ width: '100%' }} 
                            />
                        </Form.Item>
                        <Form.Item
                            name="totalPrice"
                            label="总价"
                        >
                            <InputNumber 
                                disabled 
                                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                style={{ width: '100%' }} 
                            />
                        </Form.Item>
                        <Form.Item
                            name="paymentType"
                            label="支付方式"
                            rules={[{ required: true, message: '请选择支付方式' }]}
                        >
                            <Select disabled={!selectedProduct?.retailersWithInventory?.length}>
                                <Select.Option value="CASH">现金</Select.Option>
                                <Select.Option value="CARD">银行卡</Select.Option>
                                <Select.Option value="MOBILE">移动支付</Select.Option>
                            </Select>
                        </Form.Item>
                        
                        <div style={{ margin: '16px 0', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <Text strong>商品信息:</Text>
                            <div>名称: {selectedProduct.name}</div>
                            <div>ID: {selectedProduct.id}</div>
                            {selectedProduct.retailerName && <div>默认零售商: {selectedProduct.retailerName}</div>}
                            {selectedProduct.plantingDate && <div>种植日期: {selectedProduct.plantingDate}</div>}
                            {selectedProduct.location && <div>产地: {selectedProduct.location}</div>}
                            
                            {!selectedProduct.retailersWithInventory?.length && (
                                <div style={{ marginTop: '10px', color: '#ff4d4f' }}>
                                    <Text type="danger">此商品目前无零售商信息，无法购买</Text>
                                </div>
                            )}
                        </div>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default ConsumerPurchase; 