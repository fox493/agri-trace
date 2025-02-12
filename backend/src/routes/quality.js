const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkPermission } = require('../utils/auth');

// 添加质量检测记录
router.post('/', checkPermission('addQualityInspection'), async (req, res) => {
    try {
        const recordData = {
            id: req.body.id,
            productId: req.body.productId,
            stage: req.body.stage,
            testType: req.body.testType,
            result: req.body.result,
            isQualified: req.body.isQualified,
            inspectorId: req.user.id
        };

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
router.get('/product/:productId', async (req, res) => {
    try {
        const result = await fabricClient.evaluateTransaction(
            'QueryQualityRecords',
            req.params.productId
        );

        // 如果返回的是空数组，result.toString() 可能是空字符串
        const resultStr = result.toString();
        const records = resultStr ? JSON.parse(resultStr) : [];
        res.json(records);
    } catch (error) {
        logger.error('查询质量检测记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 获取待检测的农产品列表
router.get('/pending', checkPermission('addQualityInspection'), async (req, res) => {
    try {
        // 获取所有已收获的产品
        const result = await fabricClient.evaluateTransaction(
            'QueryProductsByStatus',
            'HARVESTED'
        );

        const resultStr = result.toString();
        // 如果返回的是空字符串，则返回空数组
        const products = resultStr ? JSON.parse(resultStr) : [];
        res.json(products);
    } catch (error) {
        logger.error('查询待检测产品失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 获取质检员的检测历史
router.get('/inspector/history', checkPermission('addQualityInspection'), async (req, res) => {
    try {
        const result = await fabricClient.evaluateTransaction(
            'QueryQualityRecordsByInspector',
            req.user.id
        );

        const resultStr = result.toString();
        // 如果返回的是空字符串，则返回空数组
        const records = resultStr ? JSON.parse(resultStr) : [];
        res.json(records);
    } catch (error) {
        logger.error('查询检测历史失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

module.exports = router; 