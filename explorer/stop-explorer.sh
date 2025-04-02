#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===> 正在停止区块链浏览器...${NC}"

# 检查是否有实例在运行
if docker ps | grep -q "explorer"; then
    echo -e "${YELLOW}===> 检测到浏览器实例正在运行，正在停止...${NC}"
    docker-compose down
    
    # 等待服务停止
    sleep 3
    
    # 验证是否已停止
    if docker ps | grep -q "explorer"; then
        echo -e "${RED}===> 区块链浏览器停止失败!${NC}"
        echo -e "${YELLOW}===> 尝试强制停止: docker stop explorer explorerdb${NC}"
        docker stop explorer explorerdb
    else
        echo -e "${GREEN}===> 区块链浏览器已成功停止${NC}"
    fi
else
    echo -e "${YELLOW}===> 未检测到运行中的区块链浏览器实例${NC}"
fi

# 清理可能残留的容器
if docker ps -a | grep -q "explorer"; then
    echo -e "${YELLOW}===> 清理停止的容器...${NC}"
    docker rm -f explorer explorerdb 2>/dev/null || true
    echo -e "${GREEN}===> 清理完成${NC}"
fi 