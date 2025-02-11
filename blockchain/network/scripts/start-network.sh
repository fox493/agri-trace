#!/bin/bash

# 进入网络目录
cd "$(dirname "$0")/.."

# 生成必要的证书和创世区块
./scripts/generate.sh

# 启动网络
docker-compose -f docker/docker-compose.yaml up -d

# 等待网络启动
echo "等待网络启动..."
sleep 5

# 创建通道
docker exec cli peer channel create -o orderer.agritrace.com:7050 -c agritrace -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/agritrace.com/orderers/orderer.agritrace.com/msp/tlscacerts/tlsca.agritrace.com-cert.pem

# Producers组织加入通道
docker exec cli peer channel join -b agritrace.block

# Logistics组织加入通道
docker exec -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/users/Admin@logistics.agritrace.com/msp \
    -e CORE_PEER_ADDRESS=peer0.logistics.agritrace.com:9051 \
    -e CORE_PEER_LOCALMSPID=LogisticsMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/peers/peer0.logistics.agritrace.com/tls/ca.crt \
    cli peer channel join -b agritrace.block

# Retailers组织加入通道
docker exec -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/users/Admin@retailers.agritrace.com/msp \
    -e CORE_PEER_ADDRESS=peer0.retailers.agritrace.com:11051 \
    -e CORE_PEER_LOCALMSPID=RetailersMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/peers/peer0.retailers.agritrace.com/tls/ca.crt \
    cli peer channel join -b agritrace.block

# 更新锚节点
docker exec cli peer channel update -o orderer.agritrace.com:7050 -c agritrace -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/ProducersMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/agritrace.com/orderers/orderer.agritrace.com/msp/tlscacerts/tlsca.agritrace.com-cert.pem

docker exec -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/users/Admin@logistics.agritrace.com/msp \
    -e CORE_PEER_ADDRESS=peer0.logistics.agritrace.com:9051 \
    -e CORE_PEER_LOCALMSPID=LogisticsMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/peers/peer0.logistics.agritrace.com/tls/ca.crt \
    cli peer channel update -o orderer.agritrace.com:7050 -c agritrace -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/LogisticsMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/agritrace.com/orderers/orderer.agritrace.com/msp/tlscacerts/tlsca.agritrace.com-cert.pem

docker exec -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/users/Admin@retailers.agritrace.com/msp \
    -e CORE_PEER_ADDRESS=peer0.retailers.agritrace.com:11051 \
    -e CORE_PEER_LOCALMSPID=RetailersMSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/peers/peer0.retailers.agritrace.com/tls/ca.crt \
    cli peer channel update -o orderer.agritrace.com:7050 -c agritrace -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/RetailersMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/agritrace.com/orderers/orderer.agritrace.com/msp/tlscacerts/tlsca.agritrace.com-cert.pem

echo "网络启动完成！" 