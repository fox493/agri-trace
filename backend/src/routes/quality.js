const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkPermission } = require('../utils/auth');

// 添加质量检测记录
router.post('/', checkPermission('inspector'), async (req, res) => {
    try {
        const recordData = {
            id: req.body.id,
            productId: req.body.productId,
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

module.exports = router; 