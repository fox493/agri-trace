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
    const [editingQuantity, setEditingQuantity] = useState<number | null>(null);

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

            setInventoryList(inventoryData);
            setSalesList(salesData);
            setAvailableProducts(Array.from(productMap.values()));

            // 获取每个产品的价格历史
            const priceHistoryPromises = inventoryData.map(item => 
                retailService.getPriceHistory(item.productId)
            );
            const priceHistoryResults = await Promise.all(priceHistoryPromises);
            
            // 处理价格历史记录
            const allPriceHistory = priceHistoryResults.reduce<PriceRecord[]>((acc, curr) => {
                const records = Array.isArray(curr) ? curr : [];
                return [...acc, ...records];
            }, []);

            // 按产品ID分组，只保留每个产品最新的价格记录
            const latestPriceMap = new Map<string, PriceRecord>();
            allPriceHistory.forEach(record => {
                const existingRecord = latestPriceMap.get(record.productId);
                if (!existingRecord || new Date(record.startTime) > new Date(existingRecord.startTime)) {
                    latestPriceMap.set(record.productId, {
                        ...record,
                        uniqueId: `${record.id}_${record.productId}_${record.startTime}`
                    });
                }
            });

            // 将Map转换回数组
            const latestPriceHistory = Array.from(latestPriceMap.values());
            
            // 按时间倒序排序
            const sortedPriceHistory = latestPriceHistory.sort((a, b) => 
                new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );

            setPriceHistory(sortedPriceHistory);
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

    const handleUpdateInventory = async (id: string, quantity: number) => {
        try {
            await retailService.updateInventory(id, quantity);
            message.success('库存更新成功');
            setEditingQuantity(null);
            fetchData();
        } catch (error) {
            console.error('Error updating inventory:', error);
            message.error('更新库存失败');
        }
    };

    // 销售管理
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
    const inventoryColumns = [
        {
            title: '产品ID',
            dataIndex: 'productId',
            key: 'productId',
        },
        {
            title: '产品名称',
            key: 'productName',
            render: (record: RetailInventory) => {
                const product = availableProducts.find(p => p.id === record.productId);
                return product?.name || '-';
            }
        },
        {
            title: '产品状态',
            key: 'status',
            render: (record: RetailInventory) => {
                const product = availableProducts.find(p => p.id === record.productId);
                const statusMap: Record<string, { text: string; color: string }> = {
                    'HARVESTED': { text: '已收获', color: 'default' },
                    'ON_SALE': { text: '已上架', color: 'success' },
                    'SOLD_OUT': { text: '已售罄', color: 'warning' },
                    'OFF_SHELF': { text: '已下架', color: 'error' }
                };
                const status = statusMap[product?.status || ''] || { text: '-', color: 'default' };
                return <Tag color={status.color}>{status.text}</Tag>;
            }
        },
        {
            title: '当前库存',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity: number, record: RetailInventory) => {
                if (selectedInventory?.id === record.id && editingQuantity !== null) {
                    return (
                        <InputNumber
                            min={0}
                            value={editingQuantity}
                            onChange={value => setEditingQuantity(value || 0)}
                            onPressEnter={() => {
                                if (editingQuantity !== null) {
                                    handleUpdateInventory(record.id, editingQuantity);
                                }
                            }}
                        />
                    );
                }
                return quantity;
            }
        },
        {
            title: '最小库存',
            dataIndex: 'minQuantity',
            key: 'minQuantity',
        },
        {
            title: '更新时间',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (text: string) => new Date(text).toLocaleString()
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: RetailInventory) => {
                const product = availableProducts.find(p => p.id === record.productId);
                const isOnSale = product?.status === 'ON_SALE';
                const isSoldOut = product?.status === 'SOLD_OUT';

                return (
                    <Space>
                        <Button onClick={() => {
                            setSelectedInventory(record);
                            setEditingQuantity(record.quantity);
                        }}>
                            更新库存
                        </Button>
                        {!isOnSale && !isSoldOut && (
                            <Button type="primary" onClick={() => handleProductStatus(record.productId, 'onsale')}>
                                上架
                            </Button>
                        )}
                        {isOnSale && (
                            <Button danger onClick={() => handleProductStatus(record.productId, 'offshelf')}>
                                下架
                            </Button>
                        )}
                        {isOnSale && (
                            <Button danger onClick={() => handleProductStatus(record.productId, 'soldout')}>
                                标记售罄
                            </Button>
                        )}
                    </Space>
                );
            },
        },
    ];

    const salesColumns = [
        {
            title: '产品ID',
            dataIndex: 'productId',
            key: 'productId',
        },
        {
            title: '产品名称',
            key: 'productName',
            render: (record: SalesRecord) => {
                const product = availableProducts.find(p => p.id === record.productId);
                return product?.name || '-';
            }
        },
        {
            title: '销售数量',
            dataIndex: 'quantity',
            key: 'quantity',
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
                const typeMap: Record<string, string> = {
                    'CASH': '现金',
                    'WECHAT': '微信',
                    'ALIPAY': '支付宝',
                    'CARD': '银行卡'
                };
                return typeMap[type] || type;
            }
        },
        {
            title: '销售时间',
            dataIndex: 'saleTime',
            key: 'saleTime',
            render: (text: string) => new Date(text).toLocaleString()
        },
    ];

    const tabItems = [
        {
            key: '1',
            label: (
                <span>
                    <ShopOutlined />
                    库存管理
                </span>
            ),
            children: (
                <>
                    <Space style={{ marginBottom: 16 }}>
                        <Button type="primary" onClick={() => setIsInventoryModalVisible(true)}>
                            添加库存
                        </Button>
                    </Space>
                    <Table
                        columns={inventoryColumns}
                        dataSource={inventoryList}
                        rowKey="id"
                        loading={loading}
                    />
                </>
            )
        },
        {
            key: '2',
            label: (
                <span>
                    <ShoppingOutlined />
                    销售记录
                </span>
            ),
            children: (
                <>
                    <Table
                        columns={salesColumns}
                        dataSource={salesList}
                        rowKey="id"
                        loading={loading}
                    />
                </>
            )
        },
        {
            key: '3',
            label: (
                <span>
                    <DollarOutlined />
                    价格管理
                </span>
            ),
            children: (
                <>
                    <Space style={{ marginBottom: 16 }}>
                        <Button type="primary" onClick={() => setIsPriceModalVisible(true)}>
                            设置价格
                        </Button>
                    </Space>
                    <Table
                        columns={[
                            {
                                title: '产品ID',
                                dataIndex: 'productId',
                                key: 'productId',
                            },
                            {
                                title: '产品名称',
                                key: 'productName',
                                render: (record: PriceRecord) => {
                                    const product = availableProducts.find(p => p.id === record.productId);
                                    return product?.name || '-';
                                }
                            },
                            {
                                title: '价格',
                                dataIndex: 'price',
                                key: 'price',
                                render: (price: number) => `¥${price.toFixed(2)}`
                            },
                            {
                                title: '开始时间',
                                dataIndex: 'startTime',
                                key: 'startTime',
                                render: (text: string) => new Date(text).toLocaleString()
                            },
                            {
                                title: '结束时间',
                                dataIndex: 'endTime',
                                key: 'endTime',
                                render: (text: string) => text ? new Date(text).toLocaleString() : '-'
                            },
                            {
                                title: '状态',
                                dataIndex: 'status',
                                key: 'status',
                                render: (status: PriceRecord['status']) => (
                                    <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>
                                        {status === 'ACTIVE' ? '生效中' : '已失效'}
                                    </Tag>
                                )
                            },
                        ]}
                        dataSource={priceHistory}
                        rowKey="uniqueId"
                        loading={loading}
                    />
                </>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Space style={{ marginBottom: 16 }}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchData}
                        loading={loading}
                    >
                        刷新
                    </Button>
                </Space>
                <Tabs defaultActiveKey="1" items={tabItems} />
            </Card>

            <AddInventoryModal
                visible={isInventoryModalVisible}
                onCancel={() => setIsInventoryModalVisible(false)}
                onSubmit={handleAddInventory}
                availableProducts={availableProducts}
            />

            <AddSalesRecordModal
                visible={isSalesModalVisible}
                onCancel={() => setIsSalesModalVisible(false)}
                onSubmit={handleAddSales}
                availableProducts={availableProducts}
            />

            <SetPriceModal
                visible={isPriceModalVisible}
                onCancel={() => setIsPriceModalVisible(false)}
                onSubmit={handleSetPrice}
                availableProducts={availableProducts}
            />
        </div>
    );
};

export default RetailManagement; 