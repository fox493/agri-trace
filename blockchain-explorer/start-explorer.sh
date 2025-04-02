#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===> 正在启动区块链浏览器...${NC}"

# 检查是否已有实例在运行
if [ "$(docker ps -q -f name=explorer.agritrace.com)" ]; then
    echo -e "${YELLOW}===> 检测到已有浏览器实例在运行，正在停止...${NC}"
    docker-compose -f ./blockchain-explorer/docker-compose.yaml down
fi

# 启动区块链浏览器
docker-compose -f ./blockchain-explorer/docker-compose.yaml up -d

# 检查是否启动成功
if [ "$(docker ps -q -f name=explorer.agritrace.com)" ]; then
    echo -e "${GREEN}===> 区块链浏览器启动成功!${NC}"
    echo -e "${GREEN}===> 可通过 http://localhost:8080 访问${NC}"
    echo -e "${GREEN}===> 用户名: exploreradmin${NC}"
    echo -e "${GREEN}===> 密码: exploreradminpw${NC}"
else
    echo -e "${RED}===> 区块链浏览器启动失败!${NC}"
    echo -e "${YELLOW}===> 查看日志: docker logs explorer.agritrace.com${NC}"
fi 