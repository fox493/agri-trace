const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { generateToken, hashPassword, comparePassword, ROLES } = require('../utils/auth');
const fabricClient = require('../utils/fabric');
const { logger } = require('../utils/logger');

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // 检查必要字段
        if (!username || !password || !role) {
            return res.status(400).json({ error: '用户名、密码和角色是必填项' });
        }

        // 验证用户名长度
        if (username.length < 3) {
            return res.status(400).json({ error: '用户名长度至少3位' });
        }

        // 验证密码长度
        if (password.length < 6) {
            return res.status(400).json({ error: '密码长度至少6位' });
        }

        // 验证角色是否有效
        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json({ error: '无效的角色' });
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 创建新用户
        const hashedPassword = await hashPassword(password);
        const user = new User({
            username,
            password: hashedPassword,
            role
        });

        await user.save();

        // 如果是消费者角色，注册消费者信息到链码
        if (role === ROLES.CONSUMER) {
            try {
                const consumer = {
                    id: user._id.toString(),
                    name: username,
                    phone: '',  // 可以后续更新
                };

                logger.info('Registering consumer to chaincode:', consumer);

                await fabricClient.submitTransaction(
                    'RegisterConsumer',
                    JSON.stringify(consumer)
                );
            } catch (error) {
                // 如果链码注册失败，删除已创建的用户
                await User.findByIdAndDelete(user._id);
                logger.error('Failed to register consumer to chaincode:', error);
                return res.status(500).json({ error: '消费者注册失败' });
            }
        }

        // 如果是零售商角色，注册零售商信息到链码
        if (role === ROLES.RETAILER) {
            try {
                const retailer = {
                    id: user._id.toString(),
                    name: username,
                    address: '',  // 可以后续更新
                    phone: '',    // 可以后续更新
                };

                logger.info('Registering retailer to chaincode:', retailer);

                await fabricClient.submitTransaction(
                    'RegisterRetailer',
                    JSON.stringify(retailer)
                );
            } catch (error) {
                // 如果链码注册失败，删除已创建的用户
                await User.findByIdAndDelete(user._id);
                logger.error('Failed to register retailer to chaincode:', error);
                return res.status(500).json({ error: '零售商注册失败' });
            }
        }

        // 生成 token
        const token = generateToken(user);

        res.status(201).json({
            message: '注册成功',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 检查用户是否存在
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 验证密码
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 生成 token
        const token = generateToken(user);

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user information' });
    }
});

module.exports = router; 