import React from 'react';
import { Modal, Form, Input, DatePicker, InputNumber } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../types';

interface CreateProductModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: Partial<Product>) => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({ visible, onCancel, onSubmit }) => {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const productData = {
                id: uuidv4(),
                ...values,
                plantingDate: values.plantingDate.format('YYYY-MM-DD')
            };
            onSubmit(productData);
            form.resetFields();
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    return (
        <Modal
            title="添加农产品"
            open={visible}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            onOk={handleSubmit}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    area: 1
                }}
            >
                <Form.Item
                    name="name"
                    label="产品名称"
                    rules={[{ required: true, message: '请输入产品名称' }]}
                >
                    <Input placeholder="请输入产品名称" />
                </Form.Item>

                <Form.Item
                    name="area"
                    label="种植面积(亩)"
                    rules={[{ required: true, message: '请输入种植面积' }]}
                >
                    <InputNumber
                        min={0.1}
                        step={0.1}
                        style={{ width: '100%' }}
                        placeholder="请输入种植面积"
                    />
                </Form.Item>

                <Form.Item
                    name="plantingDate"
                    label="种植日期"
                    rules={[{ required: true, message: '请选择种植日期' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="location"
                    label="种植地点"
                    rules={[{ required: true, message: '请输入种植地点' }]}
                >
                    <Input placeholder="请输入种植地点" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateProductModal; 