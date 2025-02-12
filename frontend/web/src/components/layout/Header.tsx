import React from 'react';
import { Layout, Avatar, Space, Typography, Dropdown, MenuProps } from 'antd';
import { UserOutlined, BellOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 24px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'fixed',
      zIndex: 1,
      width: 'calc(100% - 200px)', // 减去侧边栏宽度
      right: 0,
      boxShadow: '0 1px 4px rgba(0,21,41,.08)'
    }}>
      <div>
        <Text strong style={{ fontSize: '18px' }}>农产品溯源系统</Text>
      </div>
      <Space size={24}>
        <BellOutlined style={{ fontSize: '18px' }} />
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text>{user.username || '用户'}</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader; 