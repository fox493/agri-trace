import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PriceRecord, Product } from '../../types';

interface SetPriceModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (data: Partial<PriceRecord>) => Promise<void>;
    availableProducts: Product[];
}

const SetPriceModal: React.FC<SetPriceModalProps> = ({
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
            // 设置开始时间为当前时间
            const startTime = new Date().toISOString();
            await onSubmit({ ...values, startTime, status: 'ACTIVE' });
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
            title="设置产品价格"
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
                    name="price"
                    label="价格"
                    rules={[{ required: true, message: '请输入价格' }]}
                >
                    <InputNumber
                        min={0}
                        step={0.01}
                        precision={2}
                        style={{ width: '100%' }}
                        placeholder="请输入价格"
                        prefix="¥"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SetPriceModal; 