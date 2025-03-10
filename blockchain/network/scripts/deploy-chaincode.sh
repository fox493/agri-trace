#!/bin/bash

# 设置环境变量
export CHAINCODE_NAME="agritrace"
export CHAINCODE_VERSION="1"  # 增加版本号
export CHAINCODE_SEQUENCE="1"   # 增加序列号
export CHANNEL_NAME="agritrace"

# 从文件读取版本号，如果文件不存在则创建
VERSION_FILE="chaincode_version.txt"
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat $VERSION_FILE)
    NEW_VERSION=$(echo $CURRENT_VERSION + 0.1 | bc)
else
    NEW_VERSION="1.0"
fi
echo $NEW_VERSION > $VERSION_FILE

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 打印信息的函数
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查命令执行状态
check_status() {
    if [ $? -eq 0 ]; then
        success "$1"
    else
        error "$2"
        exit 1
    fi
}

# 打包链码
log "Packaging chaincode..."
docker exec cli peer lifecycle chaincode package /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME}/${CHAINCODE_NAME}.tar.gz \
    --path /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME} \
    --lang golang \
    --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
check_status "Chaincode packaged successfully" "Failed to package chaincode"

# 在Producers组织的peer上安装链码
log "Installing chaincode on Producers peer..."
docker exec cli peer lifecycle chaincode install /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME}/${CHAINCODE_NAME}.tar.gz
check_status "Chaincode installed on Producers peer" "Failed to install chaincode on Producers peer"

# 在Logistics组织的peer上安装链码
log "Installing chaincode on Logistics peer..."
docker exec -e CORE_PEER_LOCALMSPID=LogisticsMSP \
    -e CORE_PEER_ADDRESS=peer0.logistics.agritrace.com:9051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/peers/peer0.logistics.agritrace.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/users/Admin@logistics.agritrace.com/msp \
    cli peer lifecycle chaincode install /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME}/${CHAINCODE_NAME}.tar.gz
check_status "Chaincode installed on Logistics peer" "Failed to install chaincode on Logistics peer"

# 在Retailers组织的peer上安装链码
log "Installing chaincode on Retailers peer..."
docker exec -e CORE_PEER_LOCALMSPID=RetailersMSP \
    -e CORE_PEER_ADDRESS=peer0.retailers.agritrace.com:11051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/peers/peer0.retailers.agritrace.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/users/Admin@retailers.agritrace.com/msp \
    cli peer lifecycle chaincode install /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME}/${CHAINCODE_NAME}.tar.gz
check_status "Chaincode installed on Retailers peer" "Failed to install chaincode on Retailers peer"

# 获取链码包ID
log "Getting chaincode package ID..."
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME}_${CHAINCODE_VERSION} | sed -n 's/^Package ID: \(.*\), Label:.*$/\1/p')
if [ -z "$PACKAGE_ID" ]; then
    error "Failed to get package ID"
    exit 1
fi
success "Got package ID: $PACKAGE_ID"

# 为Producers组织批准链码
log "Approving chaincode for Producers organization..."
docker exec cli peer lifecycle chaincode approveformyorg \
    -o orderer.agritrace.com:7050 \
    --ordererTLSHostnameOverride orderer.agritrace.com \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/agritrace.com/orderers/orderer.agritrace.com/msp/tlscacerts/tlsca.agritrace.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${CHAINCODE_SEQUENCE} \
    --endorsement-plugin escc \
    --validation-plugin vscc \
    --signature-policy "OR('ProducersMSP.peer','LogisticsMSP.peer','RetailersMSP.peer')"
check_status "Chaincode approved for Producers organization" "Failed to approve chaincode for Producers organization"

# 为Logistics组织批准链码
log "Approving chaincode for Logistics organization..."
docker exec -e CORE_PEER_LOCALMSPID=LogisticsMSP \
    -e CORE_PEER_ADDRESS=peer0.logistics.agritrace.com:9051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/peers/peer0.logistics.agritrace.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/users/Admin@logistics.agritrace.com/msp \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.agritrace.com:7050 \
    --ordererTLSHostnameOverride orderer.agritrace.com \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/agritrace.com/orderers/orderer.agritrace.com/msp/tlscacerts/tlsca.agritrace.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${CHAINCODE_SEQUENCE} \
    --endorsement-plugin escc \
    --validation-plugin vscc \
    --signature-policy "OR('ProducersMSP.peer','LogisticsMSP.peer','RetailersMSP.peer')"
check_status "Chaincode approved for Logistics organization" "Failed to approve chaincode for Logistics organization"

# 为Retailers组织批准链码
log "Approving chaincode for Retailers organization..."
docker exec -e CORE_PEER_LOCALMSPID=RetailersMSP \
    -e CORE_PEER_ADDRESS=peer0.retailers.agritrace.com:11051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/peers/peer0.retailers.agritrace.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/users/Admin@retailers.agritrace.com/msp \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.agritrace.com:7050 \
    --ordererTLSHostnameOverride orderer.agritrace.com \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/agritrace.com/orderers/orderer.agritrace.com/msp/tlscacerts/tlsca.agritrace.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${CHAINCODE_SEQUENCE} \
    --endorsement-plugin escc \
    --validation-plugin vscc \
    --signature-policy "OR('ProducersMSP.peer','LogisticsMSP.peer','RetailersMSP.peer')"
check_status "Chaincode approved for Retailers organization" "Failed to approve chaincode for Retailers organization"

# 检查提交就绪状态
log "Checking commit readiness..."
docker exec cli peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --sequence ${CHAINCODE_SEQUENCE} \
    --endorsement-plugin escc \
    --validation-plugin vscc \
    --signature-policy "OR('ProducersMSP.peer','LogisticsMSP.peer','RetailersMSP.peer')" \
    --output json
check_status "Commit readiness check completed" "Failed to check commit readiness"

# 提交链码定义
log "Committing chaincode definition..."
docker exec cli peer lifecycle chaincode commit \
    -o orderer.agritrace.com:7050 \
    --ordererTLSHostnameOverride orderer.agritrace.com \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/agritrace.com/orderers/orderer.agritrace.com/msp/tlscacerts/tlsca.agritrace.com-cert.pem \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --sequence ${CHAINCODE_SEQUENCE} \
    --endorsement-plugin escc \
    --validation-plugin vscc \
    --signature-policy "OR('ProducersMSP.peer','LogisticsMSP.peer','RetailersMSP.peer')" \
    --peerAddresses peer0.producers.agritrace.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/producers.agritrace.com/peers/peer0.producers.agritrace.com/tls/ca.crt \
    --peerAddresses peer0.logistics.agritrace.com:9051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/logistics.agritrace.com/peers/peer0.logistics.agritrace.com/tls/ca.crt \
    --peerAddresses peer0.retailers.agritrace.com:11051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailers.agritrace.com/peers/peer0.retailers.agritrace.com/tls/ca.crt
check_status "Chaincode definition committed successfully" "Failed to commit chaincode definition"

# 查询已提交的链码
log "Querying committed chaincode..."
docker exec cli peer lifecycle chaincode querycommitted \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME}
check_status "Chaincode deployment completed successfully!" "Failed to query committed chaincode" 