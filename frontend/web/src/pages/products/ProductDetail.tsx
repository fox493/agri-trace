import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Card,
    Row,
    Col,
    Descriptions,
    Button,
    Tag,
    Tabs,
    Timeline,
    Table,
    message,
    Spin
} from 'antd';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { productService } from '../../services/product';
import AddProductionRecordModal from './AddProductionRecordModal';
import { Product, EnvironmentRecord, QualityRecord, ProductionRecord } from '../../types';

const { TabPane } = Tabs;

interface ChartDataPoint {
    time: string;
    temperature: number;
    humidity: number;
}

const ProductDetail: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
    const [environmentRecords, setEnvironmentRecords] = useState<EnvironmentRecord[]>([]);
    const [qualityRecords, setQualityRecords] = useState<QualityRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    const fetchProductData = useCallback(async () => {
        if (!productId) return;
        
        try {
            setLoading(true);
            const [productData, envRecords, qualityData, productionData] = await Promise.all([
                productService.getProduct(productId),
                productService.getEnvironmentRecords(productId),
                productService.getQualityRecords(productId),
                productService.getProductionRecords(productId)
            ]);

            setProduct(productData);
            setEnvironmentRecords(envRecords);
            setQualityRecords(qualityData);
            setProductionRecords(productionData);
        } catch (error) {
            message.error('获取产品信息失败');
            console.error('Error fetching product data:', error);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchProductData();
    }, [fetchProductData]);

    const handleAddProductionRecord = async (record: ProductionRecord) => {
        if (!productId) return;
        
        try {
            await productService.addProductionRecord(productId, record);
            message.success('生产记录添加成功');
            setIsModalVisible(false);
            fetchProductData();
        } catch (error) {
            message.error('添加生产记录失败');
        }
    };

    if (loading) {
        return <Spin size="large" />;
    }

    if (!product) {
        return <div>产品不存在</div>;
    }

    const environmentChartData: ChartDataPoint[] = environmentRecords.map(record => ({
        time: new Date(record.recordTime).toLocaleString(),
        temperature: record.temperature,
        humidity: record.humidity
    }));

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Descriptions title="农产品基本信息" bordered>
                            <Descriptions.Item label="产品名称">{product.name}</Descriptions.Item>
                            <Descriptions.Item label="种植面积">{product.area} 亩</Descriptions.Item>
                            <Descriptions.Item label="种植日期">{product.plantingDate}</Descriptions.Item>
                            <Descriptions.Item label="收获日期">{product.harvestDate || '-'}</Descriptions.Item>
                            <Descriptions.Item label="状态">
                                <Tag color={product.status === 'PLANTING' ? 'processing' : 'success'}>
                                    {product.status === 'PLANTING' ? '种植中' : '已收获'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="种植地点">{product.location}</Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>

                <Tabs defaultActiveKey="1" style={{ marginTop: 16 }}>
                    <TabPane tab="生产记录" key="1">
                        <Button
                            type="primary"
                            onClick={() => setIsModalVisible(true)}
                            style={{ marginBottom: 16 }}
                        >
                            添加生产记录
                        </Button>
                        <Timeline>
                            {productionRecords.map(record => (
                                <Timeline.Item key={record.id}>
                                    <p><strong>{record.type}</strong> - {record.date}</p>
                                    <p>{record.description}</p>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </TabPane>

                    <TabPane tab="环境数据" key="2">
                        <Card title="环境监测数据">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={environmentChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="temperature"
                                        stroke="#ff7300"
                                        name="温度(°C)"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="humidity"
                                        stroke="#387908"
                                        name="湿度(%)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    </TabPane>

                    <TabPane tab="质量检测" key="3">
                        <Table
                            dataSource={qualityRecords}
                            columns={[
                                {
                                    title: '检测时间',
                                    dataIndex: 'recordTime',
                                    key: 'recordTime',
                                    render: (text: string) => new Date(text).toLocaleString()
                                },
                                {
                                    title: '检测类型',
                                    dataIndex: 'testType',
                                    key: 'testType'
                                },
                                {
                                    title: '检测结果',
                                    dataIndex: 'result',
                                    key: 'result'
                                },
                                {
                                    title: '是否合格',
                                    dataIndex: 'isQualified',
                                    key: 'isQualified',
                                    render: (isQualified: boolean) => (
                                        <Tag color={isQualified ? 'success' : 'error'}>
                                            {isQualified ? '合格' : '不合格'}
                                        </Tag>
                                    )
                                }
                            ]}
                            rowKey="id"
                        />
                    </TabPane>
                </Tabs>
            </Card>

            <AddProductionRecordModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSubmit={handleAddProductionRecord}
            />
        </div>
    );
};

export default ProductDetail; 