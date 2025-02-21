import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { Product, LogisticsRecord } from '../../types';

const { Option } = Select;

interface Props {
    visible: boolean;
    product: Product;
    onCancel: () => void;
    onSubmit: (record: Omit<LogisticsRecord, 'id' | 'operatorId' | 'recordTime'>) => Promise<void>;
}

const AddLogisticsRecordModal: React.FC<Props> = ({
    visible,
    product,
    onCancel,
    onSubmit
}) => {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const recordData = {
                productId: product.id,
                ...values
            };
            await onSubmit(recordData);
            form.resetFields();
        } catch (error) {
            message.error('表单验证失败');
        }
    };

    return (
        <Modal
            title="添加物流记录"
            visible={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    status: 'IN_TRANSIT'
                }}
            >
                <Form.Item
                    name="location"
                    label="当前位置"
                    rules={[{ required: true, message: '请输入当前位置' }]}
                >
                    <Input placeholder="请输入当前位置" />
                </Form.Item>

                <Form.Item
                    name="status"
                    label="物流状态"
                    rules={[{ required: true, message: '请选择物流状态' }]}
                >
                    <Select>
                        <Option value="IN_TRANSIT">运输中</Option>
                        <Option value="DELIVERED">已送达</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="description"
                    label="描述信息"
                    rules={[{ required: true, message: '请输入描述信息' }]}
                >
                    <Input.TextArea rows={4} placeholder="请输入物流描述信息" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddLogisticsRecordModal; 