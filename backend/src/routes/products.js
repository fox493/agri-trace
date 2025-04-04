const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const fabricClient = require('../utils/fabric');
const Product = require('../models/product');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const { checkPermission } = require('../utils/auth');

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

// 创建新的农产品记录
router.post('/', [auth, checkPermission('createProduct')], async (req, res) => {
    try {
        const productData = {
            id: req.body.id,
            name: req.body.name,
            area: req.body.area,
            plantingDate: req.body.plantingDate,
            farmerId: req.user.id,
            location: req.body.location
        };

        const result = await fabricClient.submitTransaction(
            'CreateProduct',
            JSON.stringify(productData)
        );
        
        res.status(201).json({
            message: '农产品创建成功',
            data: productData
        });
    } catch (error) {
        logger.error('创建农产品失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 添加生产记录
router.post('/:productId/production-records', [auth, checkPermission('updateProductionInfo')], async (req, res) => {
    try {
        const recordData = {
            id: req.body.id,
            productId: req.params.productId,
            type: req.body.type,
            date: req.body.date,
            description: req.body.description,
            operatorId: req.user.id
        };

        const result = await fabricClient.submitTransaction(
            'AddProductionRecord',
            JSON.stringify(recordData)
        );

        res.status(201).json({
            message: '生产记录添加成功',
            data: recordData
        });
    } catch (error) {
        logger.error('添加生产记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 获取生产记录
router.get('/:productId/production-records', auth, async (req, res) => {
    try {
        const result = await fabricClient.evaluateTransaction(
            'QueryProductionRecords',
            req.params.productId
        );

        // 如果返回的是空数组，result.toString() 可能是空字符串
        const resultStr = result.toString();
        const records = resultStr ? JSON.parse(resultStr) : [];
        res.json(records);
    } catch (error) {
        logger.error('查询生产记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 按状态查询产品
router.get('/status/:status', auth, async (req, res) => {
    try {
        logger.info('Querying products by status:', req.params.status);
        
        const result = await fabricClient.evaluateTransaction(
            'QueryProductsByStatus',
            req.params.status
        );
        
        // 如果返回的是空字符串，则返回空数组
        const resultStr = result.toString();
        const products = resultStr ? JSON.parse(resultStr) : [];
        
        // 添加调试日志
        logger.info(`Found ${products.length} products with status ${req.params.status}:`, products);
        
        res.json(products);
    } catch (error) {
        logger.error('Error querying products by status:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询农产品信息
router.get('/:productId', async (req, res) => {
    try {
        const result = await fabricClient.evaluateTransaction(
            'QueryProduct',
            req.params.productId
        );

        const product = JSON.parse(result.toString());
        res.json(product);
    } catch (error) {
        logger.error('查询农产品失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询农户的所有农产品
router.get('/farmer/:farmerId', auth, async (req, res) => {
    try {
        const result = await fabricClient.evaluateTransaction(
            'QueryProductsByFarmer',
            req.params.farmerId
        );

        const products = JSON.parse(result.toString());
        res.json(products);
    } catch (error) {
        logger.error('查询农户产品失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 更新农产品状态
router.put('/:productId/status', [auth, checkPermission('farmer')], async (req, res) => {
    try {
        const result = await fabricClient.submitTransaction(
            'UpdateProductStatus',
            req.params.productId,
            req.body.status
        );

        res.json({
            message: '产品状态更新成功',
            productId: req.params.productId,
            status: req.body.status
        });
    } catch (error) {
        logger.error('更新产品状态失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 更新生产信息
router.put('/:id/production', [auth, checkPermission('updateProductionInfo')], async (req, res) => {
    try {
        const result = await fabricClient.submitTransaction(
            'UpdateProductionInfo',
            req.params.id,
            JSON.stringify(req.body)
        );
        res.json({
            message: '生产信息更新成功',
            productId: req.params.id
        });
    } catch (error) {
        logger.error('更新生产信息失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 添加物流信息
router.post('/:id/logistics', [auth, checkPermission('addLogisticsInfo')], async (req, res) => {
    try {
        const result = await fabricClient.submitTransaction(
            'AddLogisticsRecord',
            JSON.stringify({
                ...req.body,
                productId: req.params.id,
                operatorId: req.user.id
            })
        );
        res.json({
            message: '物流信息添加成功',
            productId: req.params.id
        });
    } catch (error) {
        logger.error('添加物流信息失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 添加质量检测信息
router.post('/:id/quality', [auth, checkPermission('addQualityInspection')], async (req, res) => {
    try {
        const result = await fabricClient.submitTransaction(
            'AddQualityRecord',
            JSON.stringify({
                ...req.body,
                productId: req.params.id,
                inspectorId: req.user.id
            })
        );
        res.json({
            message: '质量检测信息添加成功',
            productId: req.params.id
        });
    } catch (error) {
        logger.error('添加质量检测信息失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 按批次查询产品
router.get('/batch/:batchNumber', auth, async (req, res) => {
    try {
        const result = await fabricClient.evaluateTransaction(
            'QueryProductsByBatch',
            req.params.batchNumber
        );
        
        const products = JSON.parse(result.toString());
        res.json(products);
    } catch (error) {
        logger.error('Error querying products by batch:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 按日期范围查询产品
router.get('/daterange', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const result = await fabricClient.evaluateTransaction(
            'QueryProductsByDateRange',
            startDate,
            endDate
        );
        
        const products = JSON.parse(result.toString());
        res.json(products);
    } catch (error) {
        logger.error('Error querying products by date range:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
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