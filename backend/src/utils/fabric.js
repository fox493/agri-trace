const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const { logger } = require('./logger');

class FabricClient {
    constructor() {
        this.channelName = process.env.FABRIC_CHANNEL_NAME;
        this.chaincodeName = process.env.FABRIC_CHAINCODE_NAME;
        this.mspId = process.env.FABRIC_MSP_ID;
        this.walletPath = path.join(process.cwd(), process.env.FABRIC_WALLET_PATH || 'wallet');
        this.connectionProfilePath = path.join(process.cwd(), process.env.FABRIC_CONNECTION_PROFILE_PATH || 'connection-profile.json');
        
        // Log configuration
        logger.info('Fabric Client Configuration:', {
            channelName: this.channelName,
            chaincodeName: this.chaincodeName,
            mspId: this.mspId,
            walletPath: this.walletPath,
            connectionProfilePath: this.connectionProfilePath
        });
    }

    async connect() {
        try {
            // 加载连接配置文件
            if (!fs.existsSync(this.connectionProfilePath)) {
                throw new Error(`Connection profile not found at ${this.connectionProfilePath}`);
            }
            const ccp = JSON.parse(fs.readFileSync(this.connectionProfilePath, 'utf8'));

            // 创建钱包实例
            if (!fs.existsSync(this.walletPath)) {
                fs.mkdirSync(this.walletPath, { recursive: true });
            }
            this.wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // 检查管理员身份是否存在
            const identity = await this.wallet.get('admin');
            if (!identity) {
                throw new Error('Admin identity not found in the wallet');
            }

            // 创建网关连接
            this.gateway = new Gateway();
            await this.gateway.connect(ccp, {
                wallet: this.wallet,
                identity: 'admin',
                discovery: { enabled: true, asLocalhost: true },
                eventHandlerOptions: {
                    commitTimeout: 300,
                    strategy: null
                },
                clientTlsIdentity: 'admin',
                tlsInfo: {
                    certificate: identity.credentials.certificate,
                    key: identity.credentials.privateKey
                }
            });

            // 获取通道和合约
            if (!this.channelName) {
                throw new Error('Channel name is required');
            }
            this.network = await this.gateway.getNetwork(this.channelName);
            if (!this.chaincodeName) {
                throw new Error('Chaincode name is required');
            }
            this.contract = this.network.getContract(this.chaincodeName);

            logger.info('Successfully connected to Fabric network');
        } catch (error) {
            logger.error(`Failed to connect to Fabric network: ${error}`);
            throw error;
        }
    }

    async disconnect() {
        if (this.gateway) {
            await this.gateway.disconnect();
        }
    }

    async submitTransaction(fcn, ...args) {
        try {
            if (!this.contract) {
                await this.connect();
            }
            const result = await this.contract.submitTransaction(fcn, ...args);
            return result;
        } catch (error) {
            logger.error(`Failed to submit transaction: ${error}`);
            throw error;
        }
    }

    async evaluateTransaction(fcn, ...args) {
        try {
            if (!this.contract) {
                await this.connect();
            }
            const result = await this.contract.evaluateTransaction(fcn, ...args);
            return result;
        } catch (error) {
            logger.error(`Failed to evaluate transaction: ${error}`);
            throw error;
        }
    }
}

// 创建单例实例
const fabricClient = new FabricClient();

module.exports = fabricClient; 