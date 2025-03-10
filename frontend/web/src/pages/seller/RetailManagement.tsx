import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Tabs, message, Space, Popconfirm, InputNumber } from 'antd';
import { ReloadOutlined, ShopOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import { RetailInventory, SalesRecord, PriceRecord, Product } from '../../types';
import { productService } from '../../services/product';
import * as retailService from '../../services/retail';
import AddInventoryModal from './AddInventoryModal';
import AddSalesRecordModal from './AddSalesRecordModal';
import SetPriceModal from './SetPriceModal';

const RetailManagement: React.FC = () => {
    // 状态管理
    const [inventoryList, setInventoryList] = useState<RetailInventory[]>([]);
    const [salesList, setSalesList] = useState<SalesRecord[]>([]);
    const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedInventory, setSelectedInventory] = useState<RetailInventory | null>(null);
    const [isInventoryModalVisible, setIsInventoryModalVisible] = useState<boolean>(false);
    const [isSalesModalVisible, setIsSalesModalVisible] = useState<boolean>(false);
    const [isPriceModalVisible, setIsPriceModalVisible] = useState<boolean>(false);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
    const [editingMinQuantity, setEditingMinQuantity] = useState<string | null>(null);

    // 获取数据
    const fetchData = async () => {
        try {
            setLoading(true);
            // 获取所有相关状态的产品
            const [inventory, sales, harvestedProducts, onSaleProducts, soldOutProducts, offShelfProducts] = await Promise.all([
                retailService.getInventoryList(),
                retailService.getSalesList(),
                productService.getProductsByStatus('HARVESTED'),
                productService.getProductsByStatus('ON_SALE'),
                productService.getProductsByStatus('SOLD_OUT'),
                productService.getProductsByStatus('OFF_SHELF')
            ]);
            const inventoryData = Array.isArray(inventory) ? inventory : [];
            const salesData = Array.isArray(sales) ? sales : [];
            
            // 合并所有状态的产品
            const allProducts = [
                ...(Array.isArray(harvestedProducts) ? harvestedProducts : []),
                ...(Array.isArray(onSaleProducts) ? onSaleProducts : []),
                ...(Array.isArray(soldOutProducts) ? soldOutProducts : []),
                ...(Array.isArray(offShelfProducts) ? offShelfProducts : [])
            ];

            // 使用 Map 去重，以产品 ID 为 key
            const productMap = new Map<string, Product>();
            allProducts.forEach(product => {
                productMap.set(product.id, product);
            });
            
            // 更新库存中产品名称
            const inventoryWithProductName = inventoryData.map(item => {
                const product = productMap.get(item.productId);
                return {
                    ...item,
                    productName: product ? product.name : '未知产品'
                };
            });

            setInventoryList(inventoryWithProductName);
            setSalesList(salesData);
            setAvailableProducts(Array.from(productMap.values()));
            
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('获取数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 库存管理
    const handleAddInventory = async (data: Partial<RetailInventory>) => {
        try {
            await retailService.addInventory(data);
            message.success('库存添加成功');
            fetchData();
            setIsInventoryModalVisible(false);
        } catch (error) {
            console.error('Error adding inventory:', error);
            message.error('添加库存失败');
        }
    };

    // 更新库存数量
    const handleUpdateQuantity = async (record: RetailInventory, newQuantity: number) => {
        try {
            await retailService.updateInventory(record.id, newQuantity);
            message.success('库存数量更新成功');
            fetchData();
            setEditingQuantity(null);
        } catch (error) {
            console.error('Error updating inventory:', error);
            message.error('更新库存数量失败');
        }
    };

    // 更新最小库存
    const handleUpdateMinQuantity = async (record: RetailInventory, newMinQuantity: number) => {
        try {
            await retailService.updateInventorySettings(record.id, newMinQuantity);
            message.success('最小库存更新成功');
            fetchData();
            setEditingMinQuantity(null);
        } catch (error) {
            console.error('Error updating min quantity:', error);
            message.error('更新最小库存失败');
        }
    };

    // 销售记录管理
    const handleAddSales = async (data: Partial<SalesRecord>) => {
        try {
            await retailService.addSalesRecord(data);
            message.success('销售记录添加成功');
            fetchData();
            setIsSalesModalVisible(false);
        } catch (error) {
            console.error('Error adding sales record:', error);
            message.error('添加销售记录失败');
        }
    };

    // 价格管理
    const handleSetPrice = async (data: Partial<PriceRecord>) => {
        try {
            await retailService.setProductPrice(data);
            message.success('价格设置成功');
            fetchData();
            setIsPriceModalVisible(false);
        } catch (error) {
            console.error('Error setting price:', error);
            message.error('设置价格失败');
        }
    };

    // 产品状态管理
    const handleProductStatus = async (productId: string, action: 'onsale' | 'offshelf' | 'soldout') => {
        try {
            const actionMap = {
                onsale: retailService.putProductOnSale,
                offshelf: retailService.takeProductOffShelf,
                soldout: retailService.markProductAsSoldOut
            };
            await actionMap[action](productId);
            message.success('状态更新成功');
            fetchData();
        } catch (error) {
            console.error('Error updating product status:', error);
            message.error('更新状态失败');
        }
    };

    // 表格列定义
    const getInventoryStatusTag = (record: RetailInventory) => {
        const product = availableProducts.find(p => p.id === record.productId);
        if (!product) return { color: 'default', text: '未知' };
        
        const statusMap: Record<string, { color: string; text: string }> = {
            'PLANTING': { color: 'green', text: '种植中' },
            'HARVESTED': { color: 'cyan', text: '已收获' },
            'ON_SALE': { color: 'blue', text: '在售' },
            'SOLD_OUT': { color: 'red', text: '售罄' },
            'OFF_SHELF': { color: 'gray', text: '下架' }
        };
        
        return statusMap[product.status] || { color: 'default', text: '未知' };
    };

    // 渲染库存Tab
    const renderInventoryTab = () => {
        const columns = [
            {
                title: '产品名称',
                dataIndex: 'productName',
                key: 'productName',
                render: (_: any, record: RetailInventory) => {
                    const product = availableProducts.find(p => p.id === record.productId);
                    return product ? product.name : record.productId;
                }
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (_: any, record: RetailInventory) => {
                    const status = getInventoryStatusTag(record);
                    return <Tag color={status.color}>{status.text}</Tag>;
                }
            },
            {
                title: '库存数量',
                dataIndex: 'quantity',
                key: 'quantity',
                render: (quantity: number, record: RetailInventory) => (
                    <span>
                        {editingQuantity === record.id ? (
                            <InputNumber
                                min={0}
                                defaultValue={quantity}
                                onPressEnter={(e) => handleUpdateQuantity(record, Number((e.target as HTMLInputElement).value))}
                                onBlur={(e) => handleUpdateQuantity(record, Number(e.target.value))}
                                autoFocus
                            />
                        ) : (
                            <span onClick={() => setEditingQuantity(record.id)} style={{ cursor: 'pointer' }}>
                                {quantity} <Button type="link" size="small">编辑</Button>
                            </span>
                        )}
                    </span>
                )
            },
            {
                title: '最小库存',
                dataIndex: 'minQuantity',
                key: 'minQuantity',
                render: (minQuantity: number, record: RetailInventory) => (
                    <span>
                        {editingMinQuantity === record.id ? (
                            <InputNumber
                                min={0}
                                defaultValue={minQuantity}
                                onPressEnter={(e) => handleUpdateMinQuantity(record, Number((e.target as HTMLInputElement).value))}
                                onBlur={(e) => handleUpdateMinQuantity(record, Number(e.target.value))}
                                autoFocus
                            />
                        ) : (
                            <span onClick={() => setEditingMinQuantity(record.id)} style={{ cursor: 'pointer' }}>
                                {minQuantity} <Button type="link" size="small">编辑</Button>
                            </span>
                        )}
                    </span>
                )
            },
            {
                title: '更新时间',
                dataIndex: 'updatedAt',
                key: 'updatedAt',
                render: (date: string) => new Date(date).toLocaleString()
            },
            {
                title: '操作',
                key: 'action',
                render: (_: any, record: RetailInventory) => {
                    const product = availableProducts.find(p => p.id === record.productId);
                    if (!product) return null;
                    
                    return (
                        <Space size="small">
                            {product.status === 'HARVESTED' && (
                                <Button type="primary" size="small" onClick={() => handleProductStatus(record.productId, 'onsale')}>
                                    上架
                                </Button>
                            )}
                            {product.status === 'ON_SALE' && (
                                <>
                                    <Button size="small" danger onClick={() => handleProductStatus(record.productId, 'soldout')}>
                                        标记售罄
                                    </Button>
                                    <Button size="small" onClick={() => handleProductStatus(record.productId, 'offshelf')}>
                                        下架
                                    </Button>
                                </>
                            )}
                            {product.status === 'SOLD_OUT' && record.quantity > 0 && (
                                <Button type="primary" size="small" onClick={() => handleProductStatus(record.productId, 'onsale')}>
                                    重新上架
                                </Button>
                            )}
                            {product.status === 'OFF_SHELF' && (
                                <Button type="primary" size="small" onClick={() => handleProductStatus(record.productId, 'onsale')}>
                                    重新上架
                                </Button>
                            )}
                            <Button type="primary" size="small" onClick={() => {
                                setSelectedInventory(record);
                                setIsPriceModalVisible(true);
                            }}>
                                设置价格
                            </Button>
                            {/* <Button size="small" onClick={() => {
                                setSelectedInventory(record);
                                setIsSalesModalVisible(true);
                            }}>
                                添加销售
                            </Button> */}
                        </Space>
                    );
                }
            }
        ];

        return (
            <div>
                <div style={{ marginBottom: 16 }}>
                    <Button
                        type="primary"
                        onClick={() => setIsInventoryModalVisible(true)}
                        style={{ marginRight: 8 }}
                    >
                        添加库存
                    </Button>
                    <Button
                        onClick={fetchData}
                        icon={<ReloadOutlined />}
                    >
                        刷新
                    </Button>
                </div>
                <Table
                    dataSource={inventoryList}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>
        );
    };

    // 渲染销售记录Tab
    const renderSalesTab = () => {
        const columns = [
            {
                title: '产品名称',
                dataIndex: 'productId',
                key: 'productId',
                render: (productId: string) => {
                    const product = availableProducts.find(p => p.id === productId);
                    return product ? product.name : productId;
                }
            },
            {
                title: '数量',
                dataIndex: 'quantity',
                key: 'quantity'
            },
            {
                title: '单价',
                dataIndex: 'unitPrice',
                key: 'unitPrice',
                render: (price: number) => `¥${price.toFixed(2)}`
            },
            {
                title: '总金额',
                dataIndex: 'totalAmount',
                key: 'totalAmount',
                render: (amount: number) => `¥${amount.toFixed(2)}`
            },
            {
                title: '支付方式',
                dataIndex: 'paymentType',
                key: 'paymentType',
                render: (type: string) => {
                    const paymentTypes: Record<string, string> = {
                        'CASH': '现金',
                        'CARD': '银行卡',
                        'MOBILE': '移动支付',
                        'OTHER': '其他'
                    };
                    return paymentTypes[type] || type;
                }
            },
            {
                title: '销售时间',
                dataIndex: 'saleTime',
                key: 'saleTime',
                render: (date: string) => new Date(date).toLocaleString()
            }
        ];

        return (
            <div>
                <div style={{ marginBottom: 16 }}>
                    <Button
                        type="primary"
                        onClick={() => setIsSalesModalVisible(true)}
                        style={{ marginRight: 8 }}
                        disabled={inventoryList.length === 0}
                    >
                        添加销售记录
                    </Button>
                    <Button
                        onClick={fetchData}
                        icon={<ReloadOutlined />}
                    >
                        刷新
                    </Button>
                </div>
                <Table
                    dataSource={salesList}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>
        );
    };

    // 渲染Tabs
    const items = [
        {
            key: '1',
            label: (
                <span>
                    <ShopOutlined />
                    库存管理
                </span>
            ),
            children: renderInventoryTab()
        },
        {
            key: '2',
            label: (
                <span>
                    <ShoppingOutlined />
                    销售记录
                </span>
            ),
            children: renderSalesTab()
        }
    ];

    return (
        <Card title="零售管理" bordered={false}>
            <Tabs defaultActiveKey="1" items={items} />
            
            {/* 添加库存弹窗 */}
            <AddInventoryModal
                visible={isInventoryModalVisible}
                onCancel={() => setIsInventoryModalVisible(false)}
                onSubmit={handleAddInventory}
                availableProducts={availableProducts.filter(p => 
                    p.status === 'HARVESTED' || p.status === 'ON_SALE' || p.status === 'OFF_SHELF'
                )}
            />
            
            {/* 添加销售记录弹窗 */}
            <AddSalesRecordModal
                visible={isSalesModalVisible}
                onCancel={() => setIsSalesModalVisible(false)}
                onSubmit={handleAddSales}
                availableProducts={inventoryList.map(inv => {
                    const product = availableProducts.find(p => p.id === inv.productId);
                    return product || { 
                        id: inv.productId, 
                        name: '未知产品',
                        status: 'ON_SALE'
                    } as Product;
                })}
            />
            
            {/* 设置价格弹窗 */}
            <SetPriceModal
                visible={isPriceModalVisible}
                onCancel={() => setIsPriceModalVisible(false)}
                onSubmit={handleSetPrice}
                availableProducts={selectedInventory ? 
                    [availableProducts.find(p => p.id === selectedInventory.productId)].filter(Boolean) as Product[] : 
                    availableProducts
                }
            />
        </Card>
    );
};

export default RetailManagement; 