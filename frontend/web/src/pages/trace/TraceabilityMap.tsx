import React, { useState, useEffect } from 'react';
import { Card, Select, Timeline, Row, Col } from 'antd';
import { LoadScript, GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import type { Product, TraceabilityRecord } from '../../types';

const { Option } = Select;

const TraceabilityMap: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [traceRecords, setTraceRecords] = useState<TraceabilityRecord[]>([]);

  // 模拟数据
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: '有机西红柿',
        batchNumber: 'B001',
        farmId: 'F001',
        status: 'HARVESTED',
        location: {
          latitude: 24.4798,
          longitude: 118.0819,
          address: '福建省厦门市集美区'
        },
        createdAt: '2024-01-01',
        updatedAt: '2024-03-01'
      }
    ];

    const mockTraceRecords: TraceabilityRecord[] = [
      {
        id: 'T001',
        productId: '1',
        timestamp: '2024-01-01',
        location: {
          latitude: 24.4798,
          longitude: 118.0819,
          address: '福建省厦门市集美区'
        },
        action: 'PLANTING',
        operator: '张农民',
        data: {}
      },
      {
        id: 'T002',
        productId: '1',
        timestamp: '2024-02-01',
        location: {
          latitude: 24.5798,
          longitude: 118.1819,
          address: '福建省厦门市集美区物流中心'
        },
        action: 'SHIPPING',
        operator: '物流公司',
        data: {}
      },
      {
        id: 'T003',
        productId: '1',
        timestamp: '2024-03-01',
        location: {
          latitude: 24.6798,
          longitude: 118.2819,
          address: '福建省厦门市思明区超市'
        },
        action: 'RETAIL',
        operator: '超市',
        data: {}
      }
    ];

    setProducts(mockProducts);
    setTraceRecords(mockTraceRecords);
  }, []);

  const mapContainerStyle = {
    width: '100%',
    height: '600px'
  };

  const center = {
    lat: 24.4798,
    lng: 118.0819
  };

  const pathCoordinates = traceRecords.map(record => ({
    lat: record.location.latitude,
    lng: record.location.longitude
  }));

  return (
    <Row gutter={[16, 16]}>
      <Col span={18}>
        <Card title="溯源地图">
          <Select
            style={{ width: 200, marginBottom: 16 }}
            placeholder="选择产品"
            onChange={value => setSelectedProduct(value)}
          >
            {products.map(product => (
              <Option key={product.id} value={product.id}>
                {product.name} ({product.batchNumber})
              </Option>
            ))}
          </Select>
          <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={12}
            >
              {traceRecords.map((record, index) => (
                <Marker
                  key={record.id}
                  position={{
                    lat: record.location.latitude,
                    lng: record.location.longitude
                  }}
                  label={(index + 1).toString()}
                />
              ))}
              <Polyline
                path={pathCoordinates}
                options={{
                  strokeColor: '#FF0000',
                  strokeOpacity: 1.0,
                  strokeWeight: 2
                }}
              />
            </GoogleMap>
          </LoadScript>
        </Card>
      </Col>
      <Col span={6}>
        <Card title="追溯记录">
          <Timeline>
            {traceRecords.map((record, index) => (
              <Timeline.Item key={record.id}>
                <h4>{record.action}</h4>
                <p>{record.timestamp}</p>
                <p>{record.location.address}</p>
                <p>操作人: {record.operator}</p>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </Col>
    </Row>
  );
};

export default TraceabilityMap; 