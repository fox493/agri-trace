const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkPermission } = require('../utils/auth');

// 添加环境记录
router.post('/', checkPermission('addEnvironmentalData'), async (req, res) => {
    try {
        const recordData = {
            id: req.body.id,
            productId: req.body.productId,
            temperature: req.body.temperature,
            humidity: req.body.humidity,
            operatorId: req.user.id
        };

        const result = await fabricClient.submitTransaction(
            'AddEnvironmentRecord',
            JSON.stringify(recordData)
        );

        res.status(201).json({
            message: '环境记录添加成功',
            data: recordData
        });
    } catch (error) {
        // 处理特定的错误情况
        if (error.message.includes('温度异常警报') || error.message.includes('湿度异常警报')) {
            return res.status(400).json({
                error: error.message,
                type: 'ENVIRONMENT_ALERT'
            });
        }

        logger.error('添加环境记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询产品的环境记录
router.get('/product/:productId', async (req, res) => {
    try {
        const result = await fabricClient.evaluateTransaction(
            'QueryEnvironmentRecords',
            req.params.productId
        );

        // 如果返回的是空数组，result.toString() 可能是空字符串
        const resultStr = result.toString();
        const records = resultStr ? JSON.parse(resultStr) : [];
        res.json(records);
    } catch (error) {
        logger.error('查询环境记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

module.exports = router; 