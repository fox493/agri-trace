import React, { useState, useEffect } from 'react';
import { Table, Typography, Rate, Button, Modal, Form, Input, message, Space, Card, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ConsumerPurchase, ProductFeedback as IProductFeedback } from '../../types';
import { getPurchaseHistory, addProductFeedback, getFeedbackHistory } from '../../services/consumer';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProductFeedback: React.FC = () => {
    const [purchases, setPurchases] = useState<ConsumerPurchase[]>([]);
    const [feedbacks, setFeedbacks] = useState<IProductFeedback[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ConsumerPurchase | null>(null);
    const [form] = Form.useForm();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [purchasesResponse, feedbacksResponse] = await Promise.all([
                getPurchaseHistory(),
                getFeedbackHistory()
            ]);
            console.log('Purchases:', purchasesResponse);
            console.log('Feedbacks:', feedbacksResponse);
            setPurchases(purchasesResponse as ConsumerPurchase[]);
            setFeedbacks(feedbacksResponse as IProductFeedback[]);
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

    const handleAddFeedback = (record: ConsumerPurchase) => {
        setSelectedProduct(record);
        setModalVisible(true);
        form.resetFields();
    };

    const handleSubmitFeedback = async () => {
        try {
            const values = await form.validateFields();
            if (!selectedProduct) return;

            const feedbackData = {
                productId: selectedProduct.productId,
                purchaseId: selectedProduct.id,
                rating: values.rating,
                comment: values.comment,
            };

            await addProductFeedback(feedbackData);
            message.success('反馈提交成功');
            setModalVisible(false);
            form.resetFields();
            fetchData(); // 刷新数据
        } catch (error) {
            console.error('Error submitting feedback:', error);
            message.error('反馈提交失败');
        }
    };

    // 检查商品是否已有反馈
    const hasFeedback = (purchaseId: string) => {
        return feedbacks.some(feedback => feedback.id === `FEEDBACK_${purchaseId}`);
    };

    const columns: ColumnsType<ConsumerPurchase> = [
        {
            title: '商品ID',
            dataIndex: 'productId',
            key: 'productId',
            width: 300,
        },
        {
            title: '购买数量',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
        },
        {
            title: '单价',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            width: 100,
            render: (price: number) => `¥${price.toFixed(2)}`,
        },
        {
            title: '总金额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 100,
            render: (amount: number) => `¥${amount.toFixed(2)}`,
        },
        {
            title: '购买时间',
            dataIndex: 'purchaseTime',
            key: 'purchaseTime',
            width: 200,
            render: (time: string) => new Date(time).toLocaleString(),
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type="primary"
                    disabled={hasFeedback(record.id)}
                    onClick={() => handleAddFeedback(record)}
                >
                    {hasFeedback(record.id) ? '已反馈' : '添加反馈'}
                </Button>
            ),
        },
    ];

    const feedbackColumns: ColumnsType<IProductFeedback> = [
        {
            title: '商品ID',
            dataIndex: 'productId',
            key: 'productId',
            width: 300,
        },
        {
            title: '评分',
            dataIndex: 'rating',
            key: 'rating',
            width: 200,
            render: (rating: number) => <Rate disabled defaultValue={rating} />,
        },
        {
            title: '评价内容',
            dataIndex: 'comment',
            key: 'comment',
            ellipsis: true,
        },
        {
            title: '反馈时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 200,
            render: (time: string) => new Date(time).toLocaleString(),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Card>
                    <Title level={2}>商品反馈</Title>
                    <Text type="secondary">
                        您可以对已购买的商品进行评价和反馈，帮助我们提供更好的服务。
                    </Text>
                </Card>

                <Card title="待反馈商品" extra={
                    <Button type="link" onClick={fetchData}>
                        刷新
                    </Button>
                }>
                    <Table
                        columns={columns}
                        dataSource={purchases.filter(purchase => !hasFeedback(purchase.id))}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            defaultPageSize: 5,
                            showSizeChanger: true,
                            showTotal: (total) => `共 ${total} 条记录`,
                        }}
                    />
                </Card>

                <Card title="反馈历史">
                    <Table
                        columns={feedbackColumns}
                        dataSource={feedbacks}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            defaultPageSize: 5,
                            showSizeChanger: true,
                            showTotal: (total) => `共 ${total} 条记录`,
                        }}
                    />
                </Card>
            </Space>

            <Modal
                title="添加商品反馈"
                open={modalVisible}
                onOk={handleSubmitFeedback}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="rating"
                        label="评分"
                        rules={[{ required: true, message: '请选择评分' }]}
                    >
                        <Rate />
                    </Form.Item>

                    <Form.Item
                        name="comment"
                        label="评价内容"
                        rules={[
                            { required: true, message: '请输入评价内容' },
                            { min: 10, message: '评价内容至少10个字符' },
                            { max: 500, message: '评价内容最多500个字符' }
                        ]}
                    >
                        <TextArea 
                            rows={4} 
                            placeholder="请输入您的评价内容，至少10个字符" 
                            maxLength={500} 
                            showCount 
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProductFeedback; 