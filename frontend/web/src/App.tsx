import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import AppHeader from './components/layout/Header';
import AppSider from './components/layout/Sider';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/product/ProductList';
import ProductDetail from './pages/product/ProductDetail';
import TraceabilityMap from './pages/trace/TraceabilityMap';
import FarmManagement from './pages/farm/FarmManagement';
import './App.css';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <AppSider />
        <Layout>
          <AppHeader />
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/trace" element={<TraceabilityMap />} />
              <Route path="/farms" element={<FarmManagement />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App; 