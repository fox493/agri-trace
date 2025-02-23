import React, { useState } from 'react';
import { Layout, Menu, MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  BarChartOutlined,
  SettingOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  CarOutlined,
  ShopOutlined
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
  const isInspector = user.role === 'inspector';
  const isLogistics = user.role === 'logistics';
  const isRetailer = user.role === 'retailer';
  const isConsumer = user.role === 'consumer';

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    // 农户特有的菜单项
    ...(isFarmer ? [
      {
        key: '/products',
        icon: <AppstoreOutlined />,
        label: '产品管理',
        onClick: () => navigate('/products')
      },
      {
        key: '/environment',
        icon: <EnvironmentOutlined />,
        label: '环境监测',
        onClick: () => navigate('/environment')
      }
    ] : []),
    {
      key: '/trace',
      icon: <EnvironmentOutlined />,
      label: '溯源查询'
    },
    // 质检员特有的菜单项
    ...(isInspector ? [
      {
        key: '/quality',
        icon: <FileTextOutlined />,
        label: '质量检测',
        onClick: () => navigate('/quality')
      }
    ] : []),
    // 物流人员特有的菜单项
    ...(isLogistics ? [
      {
        key: '/logistics',
        icon: <CarOutlined />,
        label: '物流管理',
        onClick: () => navigate('/logistics')
      }
    ] : []),
    // 零售商特有的菜单项
    ...(isRetailer ? [
      {
        key: '/retail',
        icon: <ShopOutlined />,
        label: '零售管理',
        onClick: () => navigate('/retail')
      }
    ] : []),
    // 消费者特有的菜单项
    ...(isConsumer ? [
      {
        key: '/consumer/purchase',
        icon: <ShopOutlined />,
        label: '商品购买',
        onClick: () => navigate('/consumer/purchase')
      },
      {
        key: '/consumer/history',
        icon: <FileTextOutlined />,
        label: '购买历史',
        onClick: () => navigate('/consumer/history')
      },
      {
        key: '/consumer/feedback',
        icon: <BarChartOutlined />,
        label: '商品反馈',
        onClick: () => navigate('/consumer/feedback')
      }
    ] : []),
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
  ].filter(Boolean) as MenuProps['items'];

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={value => setCollapsed(value)}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 2
      }}
      width={200}
    >
      <div className="logo" style={{ 
        height: 64,  // 与顶部导航栏高度一致
        margin: 0,
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '18px'
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