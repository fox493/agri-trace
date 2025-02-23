import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { SalesRecord, Product } from '../../types';

interface AddSalesRecordModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (data: Partial<SalesRecord>) => Promise<void>;
    availableProducts: Product[];
}

const AddSalesRecordModal: React.FC<AddSalesRecordModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    availableProducts
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            // 计算总金额
            const totalAmount = values.quantity * values.unitPrice;
            await onSubmit({ ...values, totalAmount });
            form.resetFields();
        } catch (error) {
            console.error('Error submitting form:', error);
            message.error('表单提交失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="添加销售记录"
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    name="productId"
                    label="选择产品"
                    rules={[{ required: true, message: '请选择产品' }]}
                >
                    <Select placeholder="请选择产品">
                        {availableProducts.map(product => (
                            <Select.Option key={product.id} value={product.id}>
                                {product.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="quantity"
                    label="销售数量"
                    rules={[{ required: true, message: '请输入销售数量' }]}
                >
                    <InputNumber
                        min={1}
                        style={{ width: '100%' }}
                        placeholder="请输入销售数量"
                    />
                </Form.Item>

                <Form.Item
                    name="unitPrice"
                    label="单价"
                    rules={[{ required: true, message: '请输入单价' }]}
                >
                    <InputNumber
                        min={0}
                        step={0.01}
                        precision={2}
                        style={{ width: '100%' }}
                        placeholder="请输入单价"
                        prefix="¥"
                    />
                </Form.Item>

                <Form.Item
                    name="paymentType"
                    label="支付方式"
                    rules={[{ required: true, message: '请选择支付方式' }]}
                >
                    <Select placeholder="请选择支付方式">
                        <Select.Option value="CASH">现金</Select.Option>
                        <Select.Option value="WECHAT">微信</Select.Option>
                        <Select.Option value="ALIPAY">支付宝</Select.Option>
                        <Select.Option value="CARD">银行卡</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddSalesRecordModal; 