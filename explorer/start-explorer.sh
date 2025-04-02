#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===> 正在启动区块链浏览器...${NC}"

# 检查是否已有实例在运行
if docker ps | grep -q "explorer"; then
    echo -e "${YELLOW}===> 检测到已有浏览器实例在运行，正在停止...${NC}"
    docker-compose down
fi

# 设置环境变量
export LOG_LEVEL_APP=debug
export LOG_LEVEL_DB=debug
export LOG_LEVEL_CONSOLE=debug
export LOG_CONSOLE_STDOUT=true
export DISCOVERY_AS_LOCALHOST=false

# 启动区块链浏览器
docker-compose up -d

# 等待服务启动
echo -e "${YELLOW}===> 等待服务启动...${NC}"
sleep 5

# 检查是否启动成功
if docker ps | grep -q "explorer"; then
    echo -e "${GREEN}===> 区块链浏览器启动成功!${NC}"
    echo -e "${GREEN}===> 可通过 http://localhost:8090 访问${NC}"
    echo -e "${GREEN}===> 用户名: exploreradmin${NC}"
    echo -e "${GREEN}===> 密码: exploreradminpw${NC}"
    
    # 显示日志
    echo -e "${YELLOW}===> 显示日志信息:${NC}"
    docker logs explorer
else
    echo -e "${RED}===> 区块链浏览器启动失败!${NC}"
    echo -e "${YELLOW}===> 查看日志: docker logs explorer${NC}"
fi 