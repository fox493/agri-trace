const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { generateToken, hashPassword, comparePassword, ROLES } = require('../utils/auth');

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const {
            username,
            password,
            role,
            orgId,
            orgName,
            name,
            email,
            phone
        } = req.body;

        // 检查必要字段
        if (!username || !password || !role || !orgId || !orgName || !name || !email || !phone) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // 验证角色是否有效
        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // 创建新用户
        const hashedPassword = await hashPassword(password);
        const user = new User({
            username,
            password: hashedPassword,
            role,
            orgId,
            orgName,
            name,
            email,
            phone
        });

        await user.save();

        // 生成token
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                orgId: user.orgId,
                orgName: user.orgName,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查找用户
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 检查用户是否被禁用
        if (!user.active) {
            return res.status(403).json({ error: 'Account is disabled' });
        }

        // 验证密码
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 更新最后登录时间
        user.lastLogin = new Date();
        await user.save();

        // 生成token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                orgId: user.orgId,
                orgName: user.orgName,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
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