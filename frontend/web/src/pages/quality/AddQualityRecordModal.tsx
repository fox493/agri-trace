import React from 'react';
import { Modal, Form, Input, Select, Radio, message } from 'antd';
import { Product, QualityRecord } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const { Option } = Select;

interface Props {
    visible: boolean;
    product: Product;
    onCancel: () => void;
    onSubmit: (record: Omit<QualityRecord, 'id' | 'inspectorId' | 'recordTime'>) => Promise<void>;
}

const AddQualityRecordModal: React.FC<Props> = ({
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
                id: uuidv4(), // 生成唯一ID
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
            title="添加质量检测记录"
            visible={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    isQualified: true
                }}
            >
                <Form.Item
                    name="stage"
                    label="检测阶段"
                    rules={[{ required: true, message: '请选择检测阶段' }]}
                >
                    <Select>
                        <Option value="PLANTING">播种</Option>
                        <Option value="GROWING">生长</Option>
                        <Option value="HARVESTING">收获</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="testType"
                    label="检测类型"
                    rules={[{ required: true, message: '请输入检测类型' }]}
                >
                    <Input placeholder="请输入检测类型，如：土壤检测、农药残留检测等" />
                </Form.Item>

                <Form.Item
                    name="result"
                    label="检测结果"
                    rules={[{ required: true, message: '请输入检测结果' }]}
                >
                    <Input.TextArea rows={4} placeholder="请详细描述检测结果" />
                </Form.Item>

                <Form.Item
                    name="isQualified"
                    label="是否合格"
                    rules={[{ required: true, message: '请选择是否合格' }]}
                >
                    <Radio.Group>
                        <Radio value={true}>合格</Radio>
                        <Radio value={false}>不合格</Radio>
                    </Radio.Group>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddQualityRecordModal; 