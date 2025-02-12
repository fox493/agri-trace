const { logger } = require('../utils/logger');

// API密钥验证中间件
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            error: '缺少API密钥'
        });
    }

    // 在实际应用中，这里应该从数据库或配置中验证API密钥
    // 这里为了演示，使用一个简单的判断
    const validApiKey = process.env.IOT_API_KEY || 'test_iot_key';

    if (apiKey !== validApiKey) {
        logger.warn('无效的API密钥尝试:', {
            apiKey: apiKey,
            ip: req.ip
        });
        
        return res.status(401).json({
            error: '无效的API密钥'
        });
    }

    // 添加设备信息到请求对象
    req.device = {
        type: 'iot',
        authenticated: true,
        apiKey: apiKey
    };

    next();
};

module.exports = {
    checkApiKey
}; 