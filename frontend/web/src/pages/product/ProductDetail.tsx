import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Timeline, Tag, Row, Col, Image, Divider } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import type { Product, TraceabilityRecord } from '../../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [traceRecords, setTraceRecords] = useState<TraceabilityRecord[]>([]);

  // 模拟数据
  useEffect(() => {
    // 模拟产品数据
    const mockProduct: Product = {
      id: '1',
      name: '有机西红柿',
      batchNumber: 'B001',
      farmId: 'F001',
      status: 'HARVESTED',
      plantingDate: '2024-01-01',
      harvestDate: '2024-03-01',
      location: {
        latitude: 24.4798,
        longitude: 118.0819,
        address: '福建省厦门市集美区'
      },
      certifications: ['有机认证', 'GAP认证'],
      createdAt: '2024-01-01',
      updatedAt: '2024-03-01'
    };

    // 模拟追溯记录
    const mockTraceRecords: TraceabilityRecord[] = [
      {
        id: 'T001',
        productId: '1',
        timestamp: '2024-01-01 08:00:00',
        location: {
          latitude: 24.4798,
          longitude: 118.0819,
          address: '福建省厦门市集美区'
        },
        action: 'PLANTING',
        operator: '张农民',
        data: {
          soil: '有机土壤',
          temperature: '25℃',
          humidity: '65%'
        }
      },
      {
        id: 'T002',
        productId: '1',
        timestamp: '2024-02-01 09:00:00',
        location: {
          latitude: 24.4798,
          longitude: 118.0819,
          address: '福建省厦门市集美区'
        },
        action: 'FERTILIZING',
        operator: '李农民',
        data: {
          fertilizer: '有机肥',
          amount: '2kg/㎡'
        }
      },
      {
        id: 'T003',
        productId: '1',
        timestamp: '2024-03-01 10:00:00',
        location: {
          latitude: 24.4798,
          longitude: 118.0819,
          address: '福建省厦门市集美区'
        },
        action: 'HARVESTING',
        operator: '王农民',
        data: {
          yield: '500kg',
          quality: '优质'
        }
      }
    ];

    setProduct(mockProduct);
    setTraceRecords(mockTraceRecords);
  }, [id]);

  if (!product) {
    return <div>Loading...</div>;
  }

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = {
    lat: product.location?.latitude || 24.4798,
    lng: product.location?.longitude || 118.0819
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="产品基本信息">
            <Descriptions bordered>
              <Descriptions.Item label="产品名称">{product.name}</Descriptions.Item>
              <Descriptions.Item label="批次号">{product.batchNumber}</Descriptions.Item>
              <Descriptions.Item label="农场ID">{product.farmId}</Descriptions.Item>
              <Descriptions.Item label="种植日期">{product.plantingDate}</Descriptions.Item>
              <Descriptions.Item label="收获日期">{product.harvestDate}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="green">{product.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={3}>
                {product.location?.address}
              </Descriptions.Item>
              <Descriptions.Item label="认证信息" span={3}>
                {product.certifications?.map(cert => (
                  <Tag color="blue" key={cert}>{cert}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="产品图片">
            <Image
              src="https://via.placeholder.com/300x200"
              alt={product.name}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="追溯时间线">
            <Timeline mode="left">
              {traceRecords.map(record => (
                <Timeline.Item
                  key={record.id}
                  dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
                  label={record.timestamp}
                >
                  <h4>{record.action}</h4>
                  <p>操作人: {record.operator}</p>
                  <p>地点: {record.location.address}</p>
                  {Object.entries(record.data).map(([key, value]) => (
                    <p key={key}>{key}: {value}</p>
                  ))}
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="种植位置">
            <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={15}
              >
                <Marker position={center} />
              </GoogleMap>
            </LoadScript>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductDetail; 