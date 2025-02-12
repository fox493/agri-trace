import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  AppstoreOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const AppSider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 从localStorage获取用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const isFarmer = user.role === 'farmer';

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    // 农户特有的菜单项
    ...(isFarmer ? [
      {
        key: '/products',
        icon: <AppstoreOutlined />,
        label: '农产品管理'
      },
      {
        key: '/farms',
        icon: <HomeOutlined />,
        label: '农场管理'
      }
    ] : []),
    {
      key: '/trace',
      icon: <EnvironmentOutlined />,
      label: '溯源查询'
    },
    {
      key: '/quality',
      icon: <FileTextOutlined />,
      label: '质量检测'
    },
    // 管理员特有的菜单项
    ...(isAdmin ? [
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
    ] : [])
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
      <div className="logo" style={{ 
        height: 32, 
        margin: 16, 
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        {!collapsed && '农产品溯源系统'}
      </div>
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