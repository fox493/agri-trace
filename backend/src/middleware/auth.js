const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        // 从请求头获取token
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ error: '未提供认证令牌' });
        }

        const token = authHeader.replace('Bearer ', '');
       
        if (!token) {
            return res.status(401).json({ error: '无效的认证令牌格式' });
        }

        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug('Token decoded:', decoded);

        // 查找用户
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: '用户不存在' });
        }

        if (!user.active) {
            return res.status(401).json({ error: '用户已被禁用' });
        }

        // 将用户信息添加到请求对象
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        logger.error('Authentication error:', {
            error: error.message,
            stack: error.stack,
            headers: req.headers
        });
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: '无效的认证令牌' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: '认证令牌已过期' });
        }
        
        res.status(401).json({ error: '认证失败' });
    }
};

module.exports = auth; 