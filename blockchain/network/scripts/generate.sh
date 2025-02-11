#!/bin/bash

# 进入网络目录
cd "$(dirname "$0")/.."

# 删除之前生成的文件
rm -rf crypto-config
rm -rf config/*.block
rm -rf config/*.tx

# 生成证书
cryptogen generate --config=./config/crypto-config.yaml --output="./crypto-config"

# 生成创世区块
configtxgen -profile OrdererGenesis -channelID system-channel -outputBlock ./config/genesis.block -configPath ./config

# 生成通道配置交易
configtxgen -profile AgriTraceChannel -outputCreateChannelTx ./config/channel.tx -channelID agritrace -configPath ./config

# 为每个组织生成锚节点更新交易
configtxgen -profile AgriTraceChannel -outputAnchorPeersUpdate ./config/ProducersMSPanchors.tx -channelID agritrace -asOrg ProducersMSP -configPath ./config
configtxgen -profile AgriTraceChannel -outputAnchorPeersUpdate ./config/LogisticsMSPanchors.tx -channelID agritrace -asOrg LogisticsMSP -configPath ./config
configtxgen -profile AgriTraceChannel -outputAnchorPeersUpdate ./config/RetailersMSPanchors.tx -channelID agritrace -asOrg RetailersMSP -configPath ./config 