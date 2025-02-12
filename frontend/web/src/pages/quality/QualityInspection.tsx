import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Tabs, message, Spin, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { qualityService } from '../../services/quality';
import { Product, QualityRecord } from '../../types';
import AddQualityRecordModal from './AddQualityRecordModal';
import { v4 as uuidv4 } from 'uuid';

type StageType = 'PLANTING' | 'GROWING' | 'HARVESTING';

const QualityInspection: React.FC = () => {
    const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
    const [inspectionHistory, setInspectionHistory] = useState<QualityRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    // 获取待检测产品和检测历史
    const fetchData = async () => {
        try {
            setLoading(true);
            const [products, history] = await Promise.all([
                qualityService.getPendingProducts(),
                qualityService.getInspectionHistory()
            ]);
            console.log('Fetched pending products:', products);
            console.log('Fetched inspection history:', history);
            setPendingProducts(Array.isArray(products) ? products : []);
            setInspectionHistory(Array.isArray(history) ? history : []);
        } catch (error) {
            console.error('Error details:', error);
            message.error('获取数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddInspection = (product: Product) => {
        setSelectedProduct(product);
        setIsModalVisible(true);
    };

    const handleSubmitInspection = async (record: Omit<QualityRecord, 'id' | 'inspectorId' | 'recordTime'>) => {
        try {
            const recordWithId = {
                ...record,
                id: uuidv4()
            };
            await qualityService.addQualityRecord(recordWithId);
            message.success('质量检测记录添加成功');
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Error adding quality record:', error);
            message.error('添加质量检测记录失败');
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
            title: '种植地点',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: Product) => (
                <Button type="primary" onClick={() => handleAddInspection(record)}>
                    添加检测记录
                </Button>
            ),
        },
    ];

    const historyColumns = [
        {
            title: '检测时间',
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
            title: '检测阶段',
            dataIndex: 'stage',
            key: 'stage',
            render: (stage: StageType) => {
                const stageMap: Record<StageType, string> = {
                    'PLANTING': '播种',
                    'GROWING': '生长',
                    'HARVESTING': '收获'
                };
                return stageMap[stage] || stage;
            }
        },
        {
            title: '检测类型',
            dataIndex: 'testType',
            key: 'testType',
        },
        {
            title: '检测结果',
            dataIndex: 'result',
            key: 'result',
        },
        {
            title: '是否合格',
            dataIndex: 'isQualified',
            key: 'isQualified',
            render: (isQualified: boolean) => (
                <Tag color={isQualified ? 'success' : 'error'}>
                    {isQualified ? '合格' : '不合格'}
                </Tag>
            ),
        },
    ];

    const tabItems = [
        {
            key: '1',
            label: '待检测产品',
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
            label: '检测历史',
            children: (
                <Table
                    columns={historyColumns}
                    dataSource={inspectionHistory}
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
                <AddQualityRecordModal
                    visible={isModalVisible}
                    product={selectedProduct}
                    onCancel={() => {
                        setIsModalVisible(false);
                        setSelectedProduct(null);
                    }}
                    onSubmit={handleSubmitInspection}
                />
            )}
        </div>
    );
};

export default QualityInspection; 