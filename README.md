# AgriTrace - 农产品区块链溯源系统

AgriTrace 是一个基于区块链技术的农产品溯源系统，旨在提供从农场到餐桌的全链路透明追踪。该系统利用 Hyperledger Fabric 区块链网络记录和验证农产品的生产、加工、运输和销售全过程数据，确保食品安全和可追溯性。

## 项目结构

```
agri-trace/
├── backend/               # 后端服务
│   ├── api/               # API 定义和路由
│   ├── services/          # 业务逻辑服务
│   ├── src/               # 主要源代码
│   ├── wallet/            # 区块链钱包
│   └── scripts/           # 工具脚本
├── blockchain/            # 区块链网络配置
│   ├── network/           # Fabric 网络配置
│   └── chaincode/         # 智能合约代码
│       └── agritrace/     # AgriTrace 智能合约
├── explorer/              # 区块链浏览器
│   └── docker-compose.yaml  # 区块链浏览器配置
├── frontend/              # 前端应用
│   └── web/               # Web 应用
│       ├── src/           # 源代码
│       ├── public/        # 静态资源
│       └── build/         # 构建输出
└── iot/                   # IoT 设备相关代码
    └── sensors/           # 传感器数据采集
```

## 技术栈

- **区块链**：Hyperledger Fabric
- **智能合约**：Go
- **后端**：Node.js, Express
- **数据库**：MongoDB
- **前端**：React, TypeScript, Ant Design
- **区块链浏览器**：Hyperledger Explorer
- **DevOps**：Docker, Docker Compose

## 功能特性

- 农产品生命周期全过程记录与追踪
- 基于区块链的数据防篡改与溯源
- 多方参与的可信供应链网络
- 二维码扫描验证产品真伪
- 实时监控农产品质量数据
- 区块链浏览器查看交易记录

## 安装与运行

### 前提条件

- Docker 和 Docker Compose
- Node.js (v14+)
- Go (v1.18+)
- pnpm 包管理器

### 启动区块链网络

1. 进入区块链网络目录
   ```bash
   cd blockchain/network
   ```

2. 启动 Fabric 网络
   ```bash
   ./network.sh up
   ```

3. 创建通道并加入
   ```bash
   ./network.sh createChannel
   ```

4. 部署智能合约
   ```bash
   ./network.sh deployCC -ccn agritrace -ccp ../chaincode/agritrace
   ```

### 启动后端服务

1. 进入后端目录并安装依赖
   ```bash
   cd backend
   pnpm install
   ```

2. 配置环境变量（复制 .env.example 为 .env 并修改）

3. 注册管理员身份
   ```bash
   pnpm enrollAdmin
   ```

4. 启动后端服务
   ```bash
   pnpm dev
   ```

### 启动前端应用

1. 进入前端目录并安装依赖
   ```bash
   cd frontend/web
   pnpm install
   ```

2. 启动开发服务器
   ```bash
   pnpm start
   ```

3. 构建生产版本
   ```bash
   pnpm build
   ```

### 启动区块链浏览器

1. 进入区块链浏览器目录
   ```bash
   cd explorer
   ```

2. 启动浏览器服务
   ```bash
   docker-compose up -d
   ```

3. 访问浏览器界面：http://localhost:8090

## 项目角色

- **生产者**：农场主、种植者，记录农产品的种植和收获信息
- **加工商**：加工和包装农产品，记录加工步骤和质量检测数据
- **物流商**：负责农产品运输，记录运输条件和路径
- **零售商**：销售农产品，记录销售信息
- **消费者**：购买和验证农产品溯源信息
- **监管机构**：监督和审核整个供应链

## API 文档

API 文档可通过以下方式访问：
- 运行后端服务后访问：http://localhost:3000/api-docs

## 开发指南

### 智能合约开发

1. 修改 `blockchain/chaincode/agritrace/agritrace.go` 文件
2. 运行测试确保合约正常工作
   ```bash
   cd blockchain/chaincode/agritrace
   go test
   ```
3. 重新部署智能合约
   ```bash
   cd blockchain/network
   ./network.sh deployCC -ccn agritrace -ccp ../chaincode/agritrace
   ```

### 前端开发

前端使用 React 框架，遵循组件化开发原则。主要使用 Ant Design 组件库构建 UI。

### 后端开发

后端使用 Express 框架，基于 MVC 架构设计。通过 Fabric SDK 与区块链网络交互。

## AWS 部署指南

本节介绍如何将 AgriTrace 项目部署到 AWS 云服务器上。

### 前提条件

- AWS 账号
- 已安装 AWS CLI 工具并配置好凭证
- SSH 密钥对用于连接 EC2 实例

### 基础设施设置

1. 创建 VPC 和子网
   ```bash
   # 创建 VPC
   aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=agritrace-vpc}]'
   
   # 创建子网
   aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=agritrace-subnet-1}]'
   ```

2. 配置安全组
   ```bash
   # 创建安全组
   aws ec2 create-security-group --group-name AgriTraceSecurityGroup --description "AgriTrace Security Group" --vpc-id <vpc-id>
   
   # 设置入站规则
   aws ec2 authorize-security-group-ingress --group-id <security-group-id> --protocol tcp --port 22 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-id <security-group-id> --protocol tcp --port 80 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-id <security-group-id> --protocol tcp --port 443 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-id <security-group-id> --protocol tcp --port 3000 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-id <security-group-id> --protocol tcp --port 8090 --cidr 0.0.0.0/0
   ```

### 实例配置

1. 启动 EC2 实例
   ```bash
   aws ec2 run-instances \
     --image-id ami-0c55b159cbfafe1f0 \
     --instance-type t2.xlarge \
     --key-name <your-key-pair-name> \
     --security-group-ids <security-group-id> \
     --subnet-id <subnet-id> \
     --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":100,"DeleteOnTermination":true}}]' \
     --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=agritrace-server}]'
   ```

2. 分配弹性 IP (可选，但推荐)
   ```bash
   # 分配弹性 IP
   aws ec2 allocate-address
   
   # 关联弹性 IP 到实例
   aws ec2 associate-address --instance-id <instance-id> --allocation-id <allocation-id>
   ```

### 环境设置

1. 连接到 EC2 实例
   ```bash
   ssh -i <your-key-pair.pem> ubuntu@<instance-ip>
   ```

2. 安装必要的依赖
   ```bash
   # 更新包列表
   sudo apt update
   sudo apt upgrade -y
   
   # 安装 Docker
   sudo apt install -y docker.io
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   
   # 安装 Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # 安装 Node.js
   curl -fsSL https://fnm.vercel.app/install | bash
   source ~/.bashrc
   fnm install 16
   fnm use 16
   
   # 安装 Go
   wget https://go.dev/dl/go1.18.10.linux-amd64.tar.gz
   sudo tar -C /usr/local -xzf go1.18.10.linux-amd64.tar.gz
   echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
   source ~/.bashrc
   
   # 安装 pnpm
   npm install -g pnpm
   
   # 安装 MongoDB (如果不使用 MongoDB Atlas)
   sudo apt install -y mongodb
   sudo systemctl enable mongodb
   sudo systemctl start mongodb
   ```

3. 克隆项目代码
   ```bash
   git clone https://github.com/your-username/agri-trace.git
   cd agri-trace
   ```

### 部署区块链网络

1. 进入区块链网络目录并启动网络
   ```bash
   cd blockchain/network
   
   # 增加脚本执行权限
   chmod +x *.sh
   
   # 下载镜像
   ./download-images.sh

   # 启动 Fabric 网络
   ./start-network.sh
   
   # 部署链码
   ./deploy-chaincode.sh
   ```

### 部署后端服务

1. 进入后端目录并安装依赖
   ```bash
   cd ../../backend
   pnpm install
   
   # 配置环境变量
   cp .env.example .env
   nano .env  # 修改配置，特别是数据库连接和区块链配置
   
   # 注册管理员身份
   pnpm enrollAdmin
   ```

2. 使用 PM2 来持久化运行服务
   ```bash
   # 安装 PM2
   npm install -g pm2
   
   # 启动后端服务
   pm2 start npm --name "agritrace-backend" -- run start
   
   # 设置 PM2 开机自启
   pm2 startup
   pm2 save
   ```

### 部署前端应用

1. 进入前端目录并安装依赖
   ```bash
   cd ../frontend/web
   pnpm install
   
   # 修改 API 配置指向正确的后端地址
   nano src/config/config.js  # 或者相应的配置文件
   
   # 构建生产版本
   pnpm build
   ```

2. 使用 Nginx 部署前端
   ```bash
   # 安装 Nginx
   sudo apt install -y nginx
   
   # 配置 Nginx
   sudo nano /etc/nginx/sites-available/agritrace
   ```

3. 添加 Nginx 配置
   ```nginx
   server {
       listen 80;
       server_name your-domain.com; # 替换为您的域名或服务器 IP
       
       location / {
           root /home/ubuntu/agri-trace/frontend/web/build;
           index index.html;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. 启用 Nginx 配置并重启
   ```bash
   sudo ln -s /etc/nginx/sites-available/agritrace /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 部署区块链浏览器

1. 进入区块链浏览器目录
   ```bash
   cd ../../explorer
   ```

2. 启动浏览器服务
   ```bash
   docker-compose up -d
   ```

### 配置 HTTPS (推荐)

1. 安装 Certbot
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. 获取并配置 SSL 证书
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

### 定期维护

1. 设置自动备份
   ```bash
   # 创建备份脚本
   nano ~/backup.sh
   ```

2. 添加备份脚本内容
   ```bash
   #!/bin/bash
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/home/ubuntu/backups"
   
   # 创建备份目录
   mkdir -p $BACKUP_DIR
   
   # 备份 MongoDB 数据
   mongodump --out $BACKUP_DIR/mongodb_$TIMESTAMP
   
   # 备份区块链数据
   tar -czf $BACKUP_DIR/blockchain_$TIMESTAMP.tar.gz /home/ubuntu/agri-trace/blockchain/network/organizations
   
   # 同步到 S3 (可选)
   # aws s3 sync $BACKUP_DIR s3://your-bucket-name/backups
   ```

3. 设置执行权限并添加到 crontab
   ```bash
   chmod +x ~/backup.sh
   
   # 添加到 crontab，每天凌晨 3 点运行
   (crontab -l 2>/dev/null; echo "0 3 * * * /home/ubuntu/backup.sh") | crontab -
   ```

4. 监控服务
   ```bash
   # 安装监控工具
   sudo apt install -y htop
   
   # 可以考虑使用 AWS CloudWatch 进行更高级的监控
   ```

### 故障排除

1. 检查服务状态
   ```bash
   # 检查后端服务
   pm2 status
   
   # 检查 Docker 容器
   docker ps
   
   # 检查 Nginx
   sudo systemctl status nginx
   ```

2. 查看日志
   ```bash
   # 后端日志
   pm2 logs agritrace-backend
   
   # Nginx 日志
   sudo tail -f /var/log/nginx/error.log
   
   # Docker 日志
   docker logs <container-id>
   ```

通过以上步骤，您的 AgriTrace 项目现在应该成功部署在 AWS 服务器上，并可以通过配置的域名或 IP 地址访问。
