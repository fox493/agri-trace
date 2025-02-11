import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Button, Space, Tag, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';

const { Search } = Input;

const ProductList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  // 模拟数据
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: '有机西红柿',
        batchNumber: 'B001',
        farmId: 'F001',
        status: 'PLANTED',
        plantingDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      {
        id: '2',
        name: '绿色大白菜',
        batchNumber: 'B002',
        farmId: 'F002',
        status: 'HARVESTED',
        plantingDate: '2024-01-15',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15'
      }
    ];
    setProducts(mockProducts);
  }, []);

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <a onClick={() => navigate(`/products/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber'
    },
    {
      title: '农场ID',
      dataIndex: 'farmId',
      key: 'farmId'
    },
    {
      title: '种植日期',
      dataIndex: 'plantingDate',
      key: 'plantingDate'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          PLANTED: { color: 'green', text: '已种植' },
          GROWING: { color: 'blue', text: '生长中' },
          HARVESTED: { color: 'gold', text: '已收获' },
          PROCESSING: { color: 'orange', text: '加工中' },
          SHIPPED: { color: 'purple', text: '运输中' },
          SOLD: { color: 'red', text: '已售出' }
        };
        const { color, text } = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space size="middle">
          <a onClick={() => navigate(`/products/${record.id}`)}>详情</a>
          <a onClick={() => handleUpdateStatus(record)}>更新状态</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </Space>
      )
    }
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
    // 实现搜索逻辑
  };

  const handleAddProduct = () => {
    // 实现添加产品逻辑
    message.success('功能开发中');
  };

  const handleUpdateStatus = (product: Product) => {
    // 实现更新状态逻辑
    message.success('功能开发中');
  };

  const handleDelete = (product: Product) => {
    // 实现删除逻辑
    message.success('功能开发中');
  };

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索产品名称或批次号"
          onSearch={handleSearch}
          style={{ width: 300 }}
          enterButton={<SearchOutlined />}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddProduct}
        >
          添加产品
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
      />
    </Card>
  );
};

export default ProductList; 