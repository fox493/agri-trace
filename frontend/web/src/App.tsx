import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import AppHeader from './components/layout/Header';
import AppSider from './components/layout/Sider';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import TraceabilityMap from './pages/trace/TraceabilityMap';
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
      <Layout>
        <AppHeader />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
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
        </Route>
      </Routes>
    </Router>
  );
};

export default App; 