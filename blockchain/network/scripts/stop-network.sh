#!/bin/bash

# 进入网络目录
cd "$(dirname "$0")/.."

# 关闭网络
docker-compose -f docker/docker-compose.yaml down --volumes --remove-orphans

# 清理容器
docker rm -f $(docker ps -a | grep "agritrace" | awk '{print $1}') 2>/dev/null || true

# 清理数据卷
docker volume rm $(docker volume ls | grep "agritrace" | awk '{print $2}') 2>/dev/null || true

# 清理网络
docker network rm $(docker network ls | grep "agritrace" | awk '{print $1}') 2>/dev/null || true

# 删除生成的文件
rm -rf crypto-config
rm -rf config/*.block
rm -rf config/*.tx

echo "网络已关闭并清理完成！" 