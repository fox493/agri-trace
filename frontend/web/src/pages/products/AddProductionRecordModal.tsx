import React from 'react';
import { Modal, Form, Input, DatePicker, Select } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { ProductionRecord } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

const recordTypes = [
    { value: 'PLANTING', label: '播种' },
    { value: 'FERTILIZING', label: '施肥' },
    { value: 'HARVESTING', label: '收获' }
] as const;

interface AddProductionRecordModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (record: ProductionRecord) => void;
}

const AddProductionRecordModal: React.FC<AddProductionRecordModalProps> = ({ visible, onCancel, onSubmit }) => {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const recordData: ProductionRecord = {
                id: uuidv4(),
                ...values,
                date: values.date.format('YYYY-MM-DD')
            };
            onSubmit(recordData);
            form.resetFields();
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    return (
        <Modal
            title="添加生产记录"
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
            >
                <Form.Item
                    name="type"
                    label="记录类型"
                    rules={[{ required: true, message: '请选择记录类型' }]}
                >
                    <Select placeholder="请选择记录类型">
                        {recordTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                                {type.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="date"
                    label="操作日期"
                    rules={[{ required: true, message: '请选择操作日期' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="操作描述"
                    rules={[{ required: true, message: '请输入操作描述' }]}
                >
                    <TextArea
                        rows={4}
                        placeholder="请详细描述本次操作的具体内容"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddProductionRecordModal; 