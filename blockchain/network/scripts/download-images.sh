#!/bin/bash

# 设置Fabric版本
FABRIC_VERSION=2.4.1

# 下载Fabric Docker镜像
docker pull hyperledger/fabric-peer:$FABRIC_VERSION
docker pull hyperledger/fabric-orderer:$FABRIC_VERSION
docker pull hyperledger/fabric-ccenv:$FABRIC_VERSION
docker pull hyperledger/fabric-tools:$FABRIC_VERSION
docker pull hyperledger/fabric-baseos:$FABRIC_VERSION

# 下载Fabric CA镜像
docker pull hyperledger/fabric-ca:1.5.2

# 设置镜像标签
docker tag hyperledger/fabric-peer:$FABRIC_VERSION hyperledger/fabric-peer:latest
docker tag hyperledger/fabric-orderer:$FABRIC_VERSION hyperledger/fabric-orderer:latest
docker tag hyperledger/fabric-tools:$FABRIC_VERSION hyperledger/fabric-tools:latest
docker tag hyperledger/fabric-ca:1.5.2 hyperledger/fabric-ca:latest 