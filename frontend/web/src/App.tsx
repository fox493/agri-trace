import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import AppHeader from './components/layout/Header';
import AppSider from './components/layout/Sider';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import TraceabilityMap from './pages/trace/TraceabilityMap';
import QualityInspection from './pages/quality/QualityInspection';
import LogisticsManagement from './pages/logistics/LogisticsManagement';
import RetailManagement from './pages/seller/RetailManagement';
import ConsumerPurchase from './pages/consumer/ConsumerPurchase';
import PurchaseHistory from './pages/consumer/PurchaseHistory';
import ProductFeedback from './pages/consumer/ProductFeedback';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { isAuthenticated } from './services/auth';
import './App.css';

const { Content } = Layout;

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

const AuthLayout: React.FC = () => {
  return <Outlet />;
};

const MainLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSider />
      <Layout style={{ marginLeft: 200 }}>
        <AppHeader />
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: '#fff',
          marginTop: 88
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 认证路由 */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* 受保护的主路由 */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:productId" element={<ProductDetail />} />
          <Route path="/trace" element={<TraceabilityMap />} />
          <Route path="/quality" element={<QualityInspection />} />
          <Route path="/logistics" element={<LogisticsManagement />} />
          <Route path="/retail" element={<RetailManagement />} />
          <Route path="/consumer/purchase" element={<ConsumerPurchase />} />
          <Route path="/consumer/history" element={<PurchaseHistory />} />
          <Route path="/consumer/feedback" element={<ProductFeedback />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App; 