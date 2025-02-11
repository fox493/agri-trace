import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const AppSider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: '/products',
      icon: <ShopOutlined />,
      label: '产品管理'
    },
    {
      key: '/trace',
      icon: <EnvironmentOutlined />,
      label: '溯源地图'
    },
    {
      key: '/farms',
      icon: <HomeOutlined />,
      label: '农场管理'
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '数据统计'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ];

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={value => setCollapsed(value)}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
      <Menu
        theme="dark"
        selectedKeys={[location.pathname]}
        mode="inline"
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};

export default AppSider; 