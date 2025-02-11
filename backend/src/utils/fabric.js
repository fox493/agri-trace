const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

class FabricClient {
    constructor() {
        this.gateway = new Gateway();
        this.connectionProfile = null;
        this.wallet = null;
    }

    async init() {
        try {
            // 加载连接配置文件
            const ccpPath = path.resolve(__dirname, '../../connection-profile.json');
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // 创建钱包实例
            const walletPath = path.join(__dirname, '../../wallet');
            this.wallet = await Wallets.newFileSystemWallet(walletPath);

            // 连接网络
            await this.gateway.connect(ccp, {
                wallet: this.wallet,
                identity: 'admin',
                discovery: { enabled: true, asLocalhost: true }
            });

            // 获取通道
            this.network = await this.gateway.getNetwork('agritrace');
            // 获取合约
            this.contract = this.network.getContract('agritrace');

            console.log('Successfully connected to Fabric network');
        } catch (error) {
            console.error('Failed to connect to Fabric network:', error);
            throw error;
        }
    }

    async createProduct(productData) {
        try {
            const result = await this.contract.submitTransaction('CreateProduct', JSON.stringify(productData));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to create product:', error);
            throw error;
        }
    }

    async queryProduct(productId) {
        try {
            const result = await this.contract.evaluateTransaction('QueryProduct', productId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query product:', error);
            throw error;
        }
    }

    async updateProductionInfo(productId, productionInfo) {
        try {
            const result = await this.contract.submitTransaction('UpdateProductionInfo', productId, JSON.stringify(productionInfo));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to update production info:', error);
            throw error;
        }
    }

    async addLogisticsInfo(productId, logisticsInfo) {
        try {
            const result = await this.contract.submitTransaction('AddLogisticsInfo', productId, JSON.stringify(logisticsInfo));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to add logistics info:', error);
            throw error;
        }
    }

    async addQualityInfo(productId, qualityInfo) {
        try {
            const result = await this.contract.submitTransaction('AddQualityInfo', productId, JSON.stringify(qualityInfo));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to add quality info:', error);
            throw error;
        }
    }

    async queryProductsByBatch(batchNumber) {
        try {
            const result = await this.contract.evaluateTransaction('QueryProductsByBatch', batchNumber);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query products by batch:', error);
            throw error;
        }
    }

    async queryProductsByStatus(status) {
        try {
            const result = await this.contract.evaluateTransaction('QueryProductsByStatus', status);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query products by status:', error);
            throw error;
        }
    }

    async queryProductsByDateRange(startDate, endDate) {
        try {
            const result = await this.contract.evaluateTransaction('QueryProductsByDateRange', startDate, endDate);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query products by date range:', error);
            throw error;
        }
    }

    async updateRetailInfo(productId, retailInfo) {
        try {
            const result = await this.contract.submitTransaction('UpdateRetailInfo', productId, JSON.stringify(retailInfo));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to update retail info:', error);
            throw error;
        }
    }

    async markProductAsSold(productId) {
        try {
            const result = await this.contract.submitTransaction('SellProduct', productId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to mark product as sold:', error);
            throw error;
        }
    }

    async disconnect() {
        this.gateway.disconnect();
    }
}

module.exports = new FabricClient(); 