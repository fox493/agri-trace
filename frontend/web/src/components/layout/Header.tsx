import React from 'react';
import { Layout, Avatar, Space, Typography } from 'antd';
import { UserOutlined, BellOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
  return (
    <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Text strong style={{ fontSize: '18px' }}>农产品溯源系统</Text>
      </div>
      <Space size={24}>
        <BellOutlined style={{ fontSize: '18px' }} />
        <Avatar icon={<UserOutlined />} />
        <Text>管理员</Text>
      </Space>
    </Header>
  );
};

export default AppHeader; 