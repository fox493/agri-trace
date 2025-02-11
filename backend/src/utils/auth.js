const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// 用户角色
const ROLES = {
    PRODUCER: 'producer',    // 生产者
    LOGISTICS: 'logistics',  // 物流方
    RETAILER: 'retailer',   // 零售商
    INSPECTOR: 'inspector',  // 质检员
    ADMIN: 'admin'          // 管理员
};

// 角色权限映射
const ROLE_PERMISSIONS = {
    [ROLES.PRODUCER]: [
        'createProduct',
        'updateProductionInfo',
        'addQualityInfo',
        'queryProduct'
    ],
    [ROLES.LOGISTICS]: [
        'addLogisticsInfo',
        'updateProcessingInfo',
        'addQualityInfo',
        'queryProduct'
    ],
    [ROLES.RETAILER]: [
        'updateRetailInfo',
        'markProductAsSold',
        'addQualityInfo',
        'queryProduct'
    ],
    [ROLES.INSPECTOR]: [
        'addQualityInfo',
        'queryProduct'
    ],
    [ROLES.ADMIN]: [
        'all'  // 管理员有所有权限
    ]
};

// 生成JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id,
            username: user.username,
            role: user.role,
            orgId: user.orgId
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// 验证JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// 检查用户是否有权限
const hasPermission = (userRole, permission) => {
    if (userRole === ROLES.ADMIN) return true;
    return ROLE_PERMISSIONS[userRole]?.includes(permission);
};

// 密码加密
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// 密码验证
const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

// 认证中间件
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// 权限检查中间件
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

module.exports = {
    ROLES,
    generateToken,
    verifyToken,
    hasPermission,
    hashPassword,
    comparePassword,
    authMiddleware,
    checkPermission
}; 