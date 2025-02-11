import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Farm } from '@/types';

const FarmManagement: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

  // 模拟数据
  useEffect(() => {
    const mockFarms: Farm[] = [
      {
        id: 'F001',
        name: '集美有机农场',
        address: '福建省厦门市集美区',
        location: {
          latitude: 24.4798,
          longitude: 118.0819
        },
        owner: '张三',
        certifications: ['有机认证', 'GAP认证'],
        products: ['有机西红柿', '有机青菜']
      },
      {
        id: 'F002',
        name: '思明生态农场',
        address: '福建省厦门市思明区',
        location: {
          latitude: 24.5798,
          longitude: 118.1819
        },
        owner: '李四',
        certifications: ['绿色食品认证'],
        products: ['生态水果', '无公害蔬菜']
      }
    ];
    setFarms(mockFarms);
  }, []);

  const columns = [
    {
      title: '农场名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner'
    },
    {
      title: '认证信息',
      dataIndex: 'certifications',
      key: 'certifications',
      render: (certifications: string[]) => (
        <>
          {certifications.map(cert => (
            <Tag color="green" key={cert}>
              {cert}
            </Tag>
          ))}
        </>
      )
    },
    {
      title: '产品',
      dataIndex: 'products',
      key: 'products',
      render: (products: string[]) => (
        <>
          {products.map(product => (
            <Tag color="blue" key={product}>
              {product}
            </Tag>
          ))}
        </>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: Farm) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const handleAdd = () => {
    setEditingFarm(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (farm: Farm) => {
    setEditingFarm(farm);
    form.setFieldsValue(farm);
    setModalVisible(true);
  };

  const handleDelete = (farm: Farm) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除农场 "${farm.name}" 吗？`,
      onOk() {
        // 实现删除逻辑
        message.success('删除成功');
      }
    });
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      // 实现保存逻辑
      message.success(editingFarm ? '更新成功' : '添加成功');
      setModalVisible(false);
    });
  };

  return (
    <div>
      <Card
        title="农场管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加农场
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={farms}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingFarm ? '编辑农场' : '添加农场'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="农场名称"
            rules={[{ required: true, message: '请输入农场名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="owner"
            label="负责人"
            rules={[{ required: true, message: '请输入负责人姓名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="certifications"
            label="认证信息"
          >
            <Input placeholder="多个认证用逗号分隔" />
          </Form.Item>
          <Form.Item
            name="products"
            label="产品"
          >
            <Input placeholder="多个产品用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FarmManagement; 