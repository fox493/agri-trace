const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkPermission } = require('../utils/auth');
const auth = require('../middleware/auth');

// 添加质量检测记录
router.post('/', [auth, checkPermission('addQualityInspection')], async (req, res) => {
    try {
        // 检查产品是否存在且已收获
        const productResult = await fabricClient.evaluateTransaction(
            'QueryProduct',
            req.body.productId
        );
        
        const product = JSON.parse(productResult.toString());
        if (!product) {
            return res.status(404).json({ error: '产品不存在' });
        }
        
        if (product.status !== 'HARVESTED') {
            return res.status(400).json({ error: '只能对已收获的产品进行质量检测' });
        }

        const recordData = {
            id: req.body.id,
            productId: req.body.productId,
            stage: req.body.stage,
            testType: req.body.testType,
            result: req.body.result,
            isQualified: req.body.isQualified,
            inspectorId: req.user.id
        };

        // 添加调试日志
        logger.info('Creating quality inspection record:', recordData);

        const result = await fabricClient.submitTransaction(
            'AddQualityRecord',
            JSON.stringify(recordData)
        );

        res.status(201).json({
            message: '质量检测记录添加成功',
            data: recordData
        });
    } catch (error) {
        logger.error('添加质量检测记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询产品的质量检测记录
router.get('/product/:productId', auth, async (req, res) => {
    try {
        const result = await fabricClient.evaluateTransaction(
            'QueryQualityRecords',
            req.params.productId
        );

        // 如果返回的是空字符串，则返回空数组
        const resultStr = result.toString();
        const records = resultStr ? JSON.parse(resultStr) : [];
        
        // 添加调试日志
        logger.info(`Found ${records.length} quality records for product ${req.params.productId}`);
        
        res.json(records);
    } catch (error) {
        logger.error('查询质量检测记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 获取待检测的农产品列表
router.get('/pending', [auth, checkPermission('addQualityInspection')], async (req, res) => {
    try {
        // 获取所有已收获的产品
        const result = await fabricClient.evaluateTransaction(
            'QueryProductsByStatus',
            'HARVESTED'
        );

        const resultStr = result.toString();
        // 如果返回的是空字符串，则返回空数组
        const products = resultStr ? JSON.parse(resultStr) : [];
        
        // 添加调试日志
        logger.info(`Found ${products.length} pending products for quality inspection`);
        
        res.json(products);
    } catch (error) {
        logger.error('查询待检测产品失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 获取质检员的检测历史
router.get('/inspector/history', [auth, checkPermission('addQualityInspection')], async (req, res) => {
    try {
        // 添加调试日志
        logger.info('Fetching inspection history for inspector:', req.user.id);

        const result = await fabricClient.evaluateTransaction(
            'QueryQualityRecordsByInspector',
            req.user.id
        );

        const resultStr = result.toString();
        // 如果返回的是空字符串，则返回空数组
        const records = resultStr ? JSON.parse(resultStr) : [];
        
        // 添加调试日志
        logger.info(`Found ${records.length} inspection records for inspector ${req.user.id}`);
        
        res.json(records);
    } catch (error) {
        logger.error('查询检测历史失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

module.exports = router; 