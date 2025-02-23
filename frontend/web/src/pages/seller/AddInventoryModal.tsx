import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { RetailInventory, Product } from '../../types';

interface AddInventoryModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (data: Partial<RetailInventory>) => Promise<void>;
    availableProducts: Product[];
}

const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
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
            await onSubmit(values);
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
            title="添加库存"
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
                    label="库存数量"
                    rules={[{ required: true, message: '请输入库存数量' }]}
                >
                    <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="请输入库存数量"
                    />
                </Form.Item>

                <Form.Item
                    name="minQuantity"
                    label="最小库存"
                    rules={[{ required: true, message: '请输入最小库存' }]}
                >
                    <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="请输入最小库存"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddInventoryModal; 