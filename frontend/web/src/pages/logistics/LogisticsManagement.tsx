import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Tabs, message, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { logisticsService } from '../../services/logistics';
import { productService } from '../../services/product';
import { Product, LogisticsRecord } from '../../types';
import AddLogisticsRecordModal from './AddLogisticsRecordModal';
import { v4 as uuidv4 } from 'uuid';

const { TabPane } = Tabs;

const LogisticsManagement: React.FC = () => {
    const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
    const [logisticsHistory, setLogisticsHistory] = useState<LogisticsRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    // 获取待处理产品和物流历史
    const fetchData = async () => {
        try {
            setLoading(true);
            // 获取已收获的产品作为待处理物流的产品
            const products = await productService.getProductsByStatus('HARVESTED');
            console.log('Fetched pending products:', products);
            setPendingProducts(Array.isArray(products) ? products : []);

            // 获取物流历史记录
            const history = await logisticsService.getOperatorLogisticsRecords();
            console.log('Fetched logistics history:', history);
            setLogisticsHistory(history);
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

    const handleAddLogistics = (product: Product) => {
        setSelectedProduct(product);
        setIsModalVisible(true);
    };

    const handleSubmitLogistics = async (record: Omit<LogisticsRecord, 'id' | 'operatorId' | 'recordTime'>) => {
        try {
            const recordWithId = {
                ...record,
                id: uuidv4()
            };
            await logisticsService.addLogisticsRecord(recordWithId);
            message.success('物流记录添加成功');
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Error adding logistics record:', error);
            message.error('添加物流记录失败');
        }
    };

    const pendingColumns = [
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
            title: '收获日期',
            dataIndex: 'harvestDate',
            key: 'harvestDate',
        },
        {
            title: '种植地点',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: Product) => (
                <Button type="primary" onClick={() => handleAddLogistics(record)}>
                    添加物流记录
                </Button>
            ),
        },
    ];

    const historyColumns = [
        {
            title: '记录时间',
            dataIndex: 'recordTime',
            key: 'recordTime',
            render: (text: string) => new Date(text).toLocaleString()
        },
        {
            title: '产品ID',
            dataIndex: 'productId',
            key: 'productId',
        },
        {
            title: '当前位置',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: LogisticsRecord['status']) => (
                <Tag color={status === 'IN_TRANSIT' ? 'processing' : 'success'}>
                    {status === 'IN_TRANSIT' ? '运输中' : '已送达'}
                </Tag>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
        },
    ];

    const tabItems = [
        {
            key: '1',
            label: '待处理物流',
            children: (
                <Table
                    columns={pendingColumns}
                    dataSource={pendingProducts}
                    rowKey="id"
                    loading={loading}
                />
            )
        },
        {
            key: '2',
            label: '物流历史',
            children: (
                <Table
                    columns={historyColumns}
                    dataSource={logisticsHistory}
                    rowKey="id"
                    loading={loading}
                />
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

            {selectedProduct && (
                <AddLogisticsRecordModal
                    visible={isModalVisible}
                    product={selectedProduct}
                    onCancel={() => {
                        setIsModalVisible(false);
                        setSelectedProduct(null);
                    }}
                    onSubmit={handleSubmitLogistics}
                />
            )}
        </div>
    );
};

export default LogisticsManagement; 