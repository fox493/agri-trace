import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { ShopOutlined, HomeOutlined, EnvironmentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const Dashboard: React.FC = () => {
  // 模拟数据
  const statisticsData = {
    totalProducts: 1234,
    totalFarms: 56,
    activeTraces: 789,
    completedTraces: 456
  };

  // 产品类别分布图表配置
  const productCategoryOption = {
    title: {
      text: '产品类别分布'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '产品类别',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 335, name: '蔬菜' },
          { value: 234, name: '水果' },
          { value: 158, name: '谷物' },
          { value: 135, name: '畜禽' },
          { value: 120, name: '水产' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // 月度追溯数据趋势图表配置
  const tracesTrendOption = {
    title: {
      text: '月度追溯数据趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '追溯次数',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230]
      }
    ]
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总产品数"
              value={statisticsData.totalProducts}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="合作农场"
              value={statisticsData.totalFarms}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃追溯"
              value={statisticsData.activeTraces}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成追溯"
              value={statisticsData.completedTraces}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card>
            <ReactECharts option={productCategoryOption} style={{ height: '400px' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={tracesTrendOption} style={{ height: '400px' }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 