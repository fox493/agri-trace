# 基于区块链的农产品溯源系统

本系统是一个基于Hyperledger Fabric的农产品溯源平台，实现从农场到餐桌的全流程信息追溯。

## 系统架构

- 区块链层：基于Hyperledger Fabric实现
- 后端服务：Node.js + Express
- 前端应用：React + Ant Design
- 物联网层：基于MQTT协议的传感器数据采集

## 主要功能

1. 生产环节
   - 种植环境数据采集（温度、湿度、光照等）
   - 农药、肥料使用记录
   - 生产过程图片存证

2. 加工环节
   - 加工工艺记录
   - 质量检测数据
   - 包装信息记录

3. 物流环节
   - 运输环境监控
   - 物流轨迹追踪
   - 仓储条件记录

4. 销售环节
   - 商品信息查询
   - 溯源信息展示
   - 防伪验证

## 技术栈

- 区块链：Hyperledger Fabric 2.x
- 后端：Node.js 18.x, Express 4.x
- 前端：React 18.x, Ant Design 5.x
- 数据库：MongoDB
- 分布式存储：IPFS
- 物联网协议：MQTT

## 开发环境搭建

1. 安装依赖
   ```bash
   # 安装Hyperledger Fabric依赖
   curl -sSL https://bit.ly/2ysbOFE | bash -s

   # 安装Node.js依赖
   npm install
   ```

2. 启动开发环境
   ```bash
   # 启动Fabric网络
   cd blockchain/network
   ./startFabric.sh

   # 启动后端服务
   cd backend
   npm run dev

   # 启动前端应用
   cd frontend/web
   npm start
   ```

## 项目结构

```
agri-trace/
├── blockchain/              # 区块链网络配置
│   ├── network/            # Fabric网络配置
│   └── chaincode/         # 智能合约
├── backend/                # 后端服务
│   ├── api/               # RESTful API
│   └── services/          # 业务逻辑
├── frontend/               # 前端应用
│   ├── web/              # Web应用
│   └── mobile/           # 移动应用
└── iot/                    # 物联网接入层
    └── sensors/           # 传感器数据采集
``` 