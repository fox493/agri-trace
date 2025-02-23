import React, { useState, useEffect } from 'react';
import { Table, Typography, Tag, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ConsumerPurchase } from '../../types';
import { getPurchaseHistory } from '../../services/consumer';

const { Title } = Typography;

const PurchaseHistory: React.FC = () => {
    const [purchases, setPurchases] = useState<ConsumerPurchase[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPurchaseHistory = async () => {
        try {
            setLoading(true);
            const response = await getPurchaseHistory();
            setPurchases(response as ConsumerPurchase[]);
        } catch (error) {
            message.error('获取购买历史失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchaseHistory();
    }, []);

    const columns: ColumnsType<ConsumerPurchase> = [
        {
            title: '商品ID',
            dataIndex: 'productId',
            key: 'productId',
        },
        {
            title: '零售商',
            dataIndex: 'retailerId',
            key: 'retailerId',
        },
        {
            title: '数量',
            dataIndex: 'quantity',
            key: 'quantity',
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: '单价',
            dataIndex: 'unitPrice',
            key: 'unitPrice',
            render: (price: number) => `￥${price.toFixed(2)}`,
            sorter: (a, b) => a.unitPrice - b.unitPrice,
        },
        {
            title: '总金额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount: number) => `￥${amount.toFixed(2)}`,
            sorter: (a, b) => a.totalAmount - b.totalAmount,
        },
        {
            title: '购买时间',
            dataIndex: 'purchaseTime',
            key: 'purchaseTime',
            render: (time: string) => new Date(time).toLocaleString(),
            sorter: (a, b) => new Date(a.purchaseTime).getTime() - new Date(b.purchaseTime).getTime(),
        },
        {
            title: '支付方式',
            dataIndex: 'paymentType',
            key: 'paymentType',
            render: (type: string) => {
                const paymentTypeMap: Record<string, { text: string; color: string }> = {
                    'CASH': { text: '现金', color: 'green' },
                    'CARD': { text: '银行卡', color: 'blue' },
                    'WECHAT': { text: '微信支付', color: 'cyan' },
                    'ALIPAY': { text: '支付宝', color: 'purple' },
                };
                return <Tag color={paymentTypeMap[type]?.color}>{paymentTypeMap[type]?.text || type}</Tag>;
            },
            filters: [
                { text: '现金', value: 'CASH' },
                { text: '银行卡', value: 'CARD' },
                { text: '微信支付', value: 'WECHAT' },
                { text: '支付宝', value: 'ALIPAY' },
            ],
            onFilter: (value, record) => record.paymentType === value,
        },
        {
            title: '购买凭证码',
            dataIndex: 'purchaseCode',
            key: 'purchaseCode',
            render: (code: string) => (
                <Tag color="gold">{code}</Tag>
            ),
        },
    ];

    return (
        <div>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={2}>购买历史</Title>
                <Table
                    columns={columns}
                    dataSource={purchases}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条记录`,
                    }}
                />
            </Space>
        </div>
    );
};

export default PurchaseHistory; 