const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkApiKey } = require('../middleware/apiKey');

// 批量上传环境数据
router.post('/environment/batch', checkApiKey, async (req, res) => {
    try {
        const { deviceId, productId, records } = req.body;

        if (!Array.isArray(records)) {
            return res.status(400).json({
                error: '无效的数据格式，records必须是数组'
            });
        }

        const results = [];
        const alerts = [];

        // 批量处理环境记录
        for (const record of records) {
            try {
                const recordData = {
                    id: `env_${deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    productId: productId,
                    temperature: record.temperature,
                    humidity: record.humidity,
                    operatorId: 'IOT_DEVICE_' + deviceId,
                    recordTime: record.timestamp || new Date().toISOString()
                };

                await fabricClient.submitTransaction(
                    'AddEnvironmentRecord',
                    JSON.stringify(recordData)
                );

                results.push({
                    success: true,
                    data: recordData
                });

                // 检查是否需要发出警报
                if (record.temperature > 35 || record.temperature < 0) {
                    alerts.push({
                        type: 'TEMPERATURE_ALERT',
                        message: `温度异常: ${record.temperature}°C`,
                        timestamp: recordData.recordTime,
                        deviceId: deviceId,
                        productId: productId
                    });
                }

                if (record.humidity < 0 || record.humidity > 100) {
                    alerts.push({
                        type: 'HUMIDITY_ALERT',
                        message: `湿度异常: ${record.humidity}%`,
                        timestamp: recordData.recordTime,
                        deviceId: deviceId,
                        productId: productId
                    });
                }

            } catch (error) {
                results.push({
                    success: false,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            message: '环境数据批量上传完成',
            results: results,
            alerts: alerts
        });

    } catch (error) {
        logger.error('批量上传环境数据失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 获取设备最新状态
router.get('/devices/:deviceId/status', checkApiKey, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { productId } = req.query;

        // 这里可以添加获取设备状态的逻辑
        // 例如从缓存或数据库中获取设备的最新状态

        res.json({
            deviceId: deviceId,
            status: 'active',
            lastUpdate: new Date().toISOString(),
            productId: productId
        });
    } catch (error) {
        logger.error('获取设备状态失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 设备心跳检测
router.post('/devices/:deviceId/heartbeat', checkApiKey, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { status, timestamp } = req.body;

        // 这里可以添加更新设备心跳的逻辑
        // 例如更新设备的最后活动时间

        res.json({
            deviceId: deviceId,
            status: 'acknowledged',
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        logger.error('设备心跳更新失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

module.exports = router; 