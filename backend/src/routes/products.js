const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const fabricClient = require('../utils/fabric');

// 连接到Fabric网络
async function connectToNetwork() {
    try {
        // 加载连接配置文件
        const ccpPath = path.resolve(__dirname, '..', '..', '..', 'blockchain', 'network', 'connection.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // 创建钱包实例
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // 创建网关连接
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        // 获取通道
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('agritrace');

        return { gateway, contract };
    } catch (error) {
        logger.error(`Failed to connect to the network: ${error}`);
        throw error;
    }
}

// 创建新产品
router.post('/', async (req, res) => {
    try {
        const result = await fabricClient.createProduct(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
});

// 查询产品信息
router.get('/:id', async (req, res) => {
    try {
        const result = await fabricClient.queryProduct(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error querying product:', error);
        res.status(500).json({ error: error.message });
    }
});

// 更新生产信息
router.put('/:id/production', async (req, res) => {
    try {
        const result = await fabricClient.updateProductionInfo(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error updating production info:', error);
        res.status(500).json({ error: error.message });
    }
});

// 添加物流信息
router.post('/:id/logistics', async (req, res) => {
    try {
        const result = await fabricClient.addLogisticsInfo(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error adding logistics info:', error);
        res.status(500).json({ error: error.message });
    }
});

// 添加质量检测信息
router.post('/:id/quality', async (req, res) => {
    try {
        const result = await fabricClient.addQualityInfo(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error adding quality info:', error);
        res.status(500).json({ error: error.message });
    }
});

// 按批次查询产品
router.get('/batch/:batchNumber', async (req, res) => {
    try {
        const result = await fabricClient.queryProductsByBatch(req.params.batchNumber);
        res.json(result);
    } catch (error) {
        console.error('Error querying products by batch:', error);
        res.status(500).json({ error: error.message });
    }
});

// 按状态查询产品
router.get('/status/:status', async (req, res) => {
    try {
        const result = await fabricClient.queryProductsByStatus(req.params.status);
        res.json(result);
    } catch (error) {
        console.error('Error querying products by status:', error);
        res.status(500).json({ error: error.message });
    }
});

// 按日期范围查询产品
router.get('/daterange', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const result = await fabricClient.queryProductsByDateRange(startDate, endDate);
        res.json(result);
    } catch (error) {
        console.error('Error querying products by date range:', error);
        res.status(500).json({ error: error.message });
    }
});

// 更新零售信息
router.put('/:id/retail', async (req, res) => {
    try {
        const result = await fabricClient.updateRetailInfo(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error updating retail info:', error);
        res.status(500).json({ error: error.message });
    }
});

// 标记产品为已售出
router.post('/:id/sell', async (req, res) => {
    try {
        const result = await fabricClient.markProductAsSold(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error marking product as sold:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 