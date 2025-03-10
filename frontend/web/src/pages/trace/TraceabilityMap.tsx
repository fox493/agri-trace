import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Tabs, Steps, Timeline, Spin, Typography, Empty, Divider, message } from 'antd';
import { SearchOutlined, BarcodeOutlined, SafetyCertificateOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { getProductTrace, getProductByTraceCode, verifyProduct, getProductInventory } from '../../services/trace';
import { Product, TraceResponse, TraceCodeResponse, VerificationResult } from '../../types';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;

interface TraceableProduct extends Product {
  traceInfo?: {
    production: any[];
    processing: any[];
    logistics: any[];
    quality: any[];
    retail: any[];
    environment?: any[];
    inventory?: any[];
  };
}

const TraceabilityMap: React.FC = () => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [currentProduct, setCurrentProduct] = useState<TraceableProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'warning' | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  
  const location = useLocation();
  const navigate = useNavigate();

  // 页面加载时处理URL参数
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const productId = params.get('productId');
    
    if (productId) {
      setSearchInput(productId);
      searchProduct(productId);
    }
  }, [location]);

  // 通过ID或溯源码搜索产品
  const handleSearch = () => {
    if (!searchInput.trim()) {
      message.warning('请输入产品ID或溯源码');
      return;
    }

    // 更新URL
    navigate(`/trace?productId=${searchInput}`);
    
    // 执行搜索
    searchProduct(searchInput);
  };
  
  // 执行产品搜索
  const searchProduct = async (value: string) => {
    setLoading(true);
    try {
      console.log('Searching for product:', value);
      let product;
      let inventoryData: any[] = [];

      // 判断输入是产品ID还是溯源码
      if (value.length === 36 || value.startsWith('P')) {
        // 按产品ID查询
        const result: any = await getProductTrace(value);
        product = result?.product;
        
        // 获取库存信息
        try {
          const invResponse: any = await getProductInventory(value);
          inventoryData = Array.isArray(invResponse) ? invResponse : [];
          console.log('Inventory data:', inventoryData);
        } catch (invError) {
          console.error('Failed to fetch inventory data:', invError);
          // 继续处理，不中断流程
        }
        
        if (product) {
          setCurrentProduct({
            ...product,
            traceInfo: {
              production: result?.productionInfo || [],
              processing: result?.processingInfo || [],
              logistics: result?.logisticsInfo || [],
              quality: result?.qualityInfo || [],
              retail: result?.retailInfo || [],
              environment: result?.environmentInfo || [],
              inventory: inventoryData
            }
          });
        }
      } else {
        // 按溯源码查询
        const result: any = await getProductByTraceCode(value);
        if (result?.product) {
          const traceResult: any = await getProductTrace(result.product.id);
          product = traceResult?.product;
          
          // 获取库存信息
          try {
            const invResponse: any = await getProductInventory(result.product.id);
            inventoryData = Array.isArray(invResponse) ? invResponse : [];
            console.log('Inventory data:', inventoryData);
          } catch (invError) {
            console.error('Failed to fetch inventory data:', invError);
            // 继续处理，不中断流程
          }
          
          if (product) {
            setCurrentProduct({
              ...product,
              traceInfo: {
                production: traceResult?.productionInfo || [],
                processing: traceResult?.processingInfo || [],
                logistics: traceResult?.logisticsInfo || [],
                quality: traceResult?.qualityInfo || [],
                retail: traceResult?.retailInfo || [],
                environment: traceResult?.environmentInfo || [],
                inventory: inventoryData
              }
            });
          }
        }
      }

      if (!product) {
        message.error('未找到相关产品');
        setCurrentProduct(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证产品真实性
  const handleVerify = async () => {
    if (!currentProduct) return;

    setLoading(true);
    try {
      const result: any = await verifyProduct(currentProduct.id);
      if (result.verified) {
        setVerificationStatus('success');
        setVerificationMessage('产品验证通过，是正品！');
      } else {
        setVerificationStatus('error');
        setVerificationMessage(result.message || '产品验证失败，请谨慎购买！');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('warning');
      setVerificationMessage('验证系统异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 渲染产品基本信息
  const renderProductInfo = () => {
    if (!currentProduct) return <Empty description="请先搜索产品" />;

    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <Title level={4}>产品基本信息</Title>
          <Paragraph>
            <Text strong>产品名称：</Text> {currentProduct.name}<br />
            <Text strong>产品ID：</Text> {currentProduct.id}<br />
            <Text strong>种植面积：</Text> {currentProduct.area} 亩<br />
            <Text strong>种植日期：</Text> {currentProduct.plantingDate}<br />
            {currentProduct.harvestDate && <><Text strong>收获日期：</Text> {currentProduct.harvestDate}<br /></>}
            <Text strong>当前状态：</Text> {renderStatus(currentProduct.status)}<br />
            <Text strong>产地：</Text> {currentProduct.location}<br />
          </Paragraph>
        </div>

        <Button
          type="primary"
          icon={<SafetyCertificateOutlined />}
          onClick={handleVerify}
          loading={loading}
        >
          验证产品真实性
        </Button>

        {verificationStatus && (
          <div style={{ marginTop: 16, padding: 16, background: getVerificationBackground() }}>
            <Text strong>{verificationMessage}</Text>
          </div>
        )}
      </div>
    );
  };

  // 根据验证状态获取背景色
  const getVerificationBackground = () => {
    switch (verificationStatus) {
      case 'success': return '#f6ffed';
      case 'error': return '#fff2f0';
      case 'warning': return '#fffbe6';
      default: return 'transparent';
    }
  };

  // 渲染状态显示
  const renderStatus = (status: string) => {
    switch (status) {
      case 'PLANTING': return '种植中';
      case 'HARVESTED': return '已收获';
      case 'ON_SALE': return '在售';
      case 'SOLD_OUT': return '已售罄';
      case 'OFF_SHELF': return '下架';
      default: return status;
    }
  };

  // 渲染溯源链步骤
  const renderTraceSteps = () => {
    if (!currentProduct || !currentProduct.traceInfo) {
      return <Empty description="没有溯源信息" />;
    }

    const { production, processing, logistics, quality, retail, environment, inventory } = currentProduct.traceInfo;
    const hasProduction = production && production.length > 0;
    const hasProcessing = processing && processing.length > 0;
    const hasLogistics = logistics && logistics.length > 0;
    const hasQuality = quality && quality.length > 0;
    const hasRetail = retail && retail.length > 0;
    const hasEnvironment = environment && environment.length > 0;
    const hasInventory = inventory && inventory.length > 0;

    const steps = [
      { title: '生产', content: hasProduction, description: '农作物种植' },
      { title: '环境监测', content: hasEnvironment, description: '环境数据' },
      { title: '加工', content: hasProcessing, description: '产品加工' },
      { title: '质检', content: hasQuality, description: '质量检测' },
      { title: '物流', content: hasLogistics, description: '运输配送' },
      { title: '零售', content: hasRetail || hasInventory, description: '销售环节' },
    ];

    // 计算当前步骤
    let current = 0;
    if (hasRetail || hasInventory) current = 5;
    else if (hasLogistics) current = 4;
    else if (hasQuality) current = 3;
    else if (hasProcessing) current = 2;
    else if (hasEnvironment) current = 1;
    else if (hasProduction) current = 0;

    return (
      <div>
        <Steps current={current} style={{ marginBottom: 30 }}>
          {steps.map((step, index) => (
            <Step 
              key={index} 
              title={step.title} 
              description={step.description}
              status={step.content ? (index <= current ? 'finish' : 'wait') : 'wait'}
            />
          ))}
        </Steps>

        <Timeline mode="left">
          {hasProduction && production.map((record: any, index: number) => (
            <Timeline.Item key={`prod-${index}`} color="green">
              <Text strong>{record.date || record.createdAt}</Text> - 生产记录：{record.description || record.type}
            </Timeline.Item>
          ))}
          
          {hasEnvironment && environment.map((record: any, index: number) => (
            <Timeline.Item key={`env-${index}`} color="cyan">
              <Text strong>{record.recordTime || record.createdAt}</Text> - 环境记录：
              温度: {record.temperature}°C, 湿度: {record.humidity}%
            </Timeline.Item>
          ))}
          
          {hasProcessing && processing.map((record: any, index: number) => (
            <Timeline.Item key={`proc-${index}`} color="blue">
              <Text strong>{record.date || record.createdAt}</Text> - 加工记录：{record.description || record.type}
            </Timeline.Item>
          ))}
          
          {hasQuality && quality.map((record: any, index: number) => (
            <Timeline.Item key={`qual-${index}`} color="orange">
              <Text strong>{record.recordTime || record.createdAt}</Text> - 质检记录：
              {record.testType} - {record.isQualified ? '合格' : '不合格'}
            </Timeline.Item>
          ))}
          
          {hasLogistics && logistics.map((record: any, index: number) => (
            <Timeline.Item key={`logi-${index}`} color="purple">
              <Text strong>{record.recordTime || record.createdAt}</Text> - 物流记录：
              {record.status} - {record.location}
            </Timeline.Item>
          ))}
          
          {hasRetail && retail.map((record: any, index: number) => (
            <Timeline.Item key={`retail-${index}`} color="red">
              <Text strong>{record.recordTime || record.createdAt}</Text> - 零售记录：
              {record.description || record.type || '销售记录'}
            </Timeline.Item>
          ))}
          
          {hasInventory && inventory.map((record: any, index: number) => (
            <Timeline.Item key={`inv-${index}`} color="gold">
              <Text strong>{record.recordTime || record.createdAt || '当前'}</Text> - 库存记录：
              库存数量: {record.quantity || '未知'} {record.minQuantity ? `(最低库存: ${record.minQuantity})` : ''}
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    );
  };

  return (
    <Card title="农产品溯源查询" className="trace-card">
      <div className="search-container" style={{ marginBottom: 24 }}>
        <Input
          placeholder="输入产品ID或溯源码"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          prefix={<SearchOutlined />}
          suffix={
            <BarcodeOutlined 
              title="扫描溯源码"
              style={{ cursor: 'pointer' }}
              onClick={() => message.info('扫码功能开发中')}
            />
          }
          onPressEnter={handleSearch}
          style={{ width: 300 }}
        />
        <Button 
          type="primary" 
          icon={<SearchOutlined />} 
          onClick={handleSearch} 
          loading={loading}
          style={{ marginLeft: 8 }}
        >
          查询
        </Button>
      </div>

      <Spin spinning={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="产品信息" key="info">
            {renderProductInfo()}
          </TabPane>
          <TabPane tab="溯源链" key="trace">
            {renderTraceSteps()}
          </TabPane>
        </Tabs>
      </Spin>
    </Card>
  );
};

export default TraceabilityMap; 