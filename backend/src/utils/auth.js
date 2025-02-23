const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_EXPIRES_IN = '24h';

// 用户角色
const ROLES = {
    ADMIN: 'admin',
    FARMER: 'farmer',        // 农户
    LOGISTICS: 'logistics',  // 物流方
    RETAILER: 'retailer',   // 零售商
    INSPECTOR: 'inspector',  // 质检员
    CONSUMER: 'consumer'    // 消费者
};

// 角色权限映射
const ROLE_PERMISSIONS = {
    [ROLES.FARMER]: [
        'createProduct',           // 创建农产品
        'updateProductionInfo',    // 更新生产信息
        'addEnvironmentalData',    // 添加环境数据
        'updatePlantingStatus',    // 更新种植状态
        'recordHarvest',          // 记录收获信息
        'manageFarm',             // 管理农场信息
        'viewFarmProducts',       // 查看自己的农产品
        'queryProduct',            // 查询产品
        'addProductionRecord'      // 添加生产记录
    ],
    [ROLES.LOGISTICS]: [
        'addLogisticsInfo',       // 添加物流信息
        'updateProcessingInfo',   // 更新加工信息
        'updateStorageInfo',      // 更新仓储信息
        'addQualityInfo',         // 添加运输过程中的质量信息
        'queryProduct',            // 查询产品
        'updateLogisticsInfo'      // 更新物流信息
    ],
    [ROLES.RETAILER]: [
        'addRetailInventory',     // 添加零售库存
        'updateRetailInventory',  // 更新库存数量
        'viewRetailInventory',    // 查看库存
        'addSalesRecord',         // 添加销售记录
        'viewSalesRecords',       // 查看销售记录
        'setProductPrice',        // 设置产品价格
        'viewPriceHistory',       // 查看价格历史
        'viewCurrentPrice',       // 查看当前价格
        'manageProductStatus',    // 管理产品状态（上架、下架、售罄）
        'queryProduct'            // 查询产品
    ],
    [ROLES.INSPECTOR]: [
        'addQualityInspection',   // 添加质量检测记录
        'issueCertification',     // 颁发认证
        'revokeQualification',    // 撤销资格
        'queryProduct',           // 查询产品
        'viewInspectionHistory'   // 查看检测历史
    ],
    [ROLES.CONSUMER]: [
        'queryProduct',           // 查询产品
        'viewTraceability',       // 查看溯源信息
        'submitFeedback',         // 提交反馈
        'addPurchase',           // 添加购买记录
        'viewPurchases',         // 查看购买历史
        'addFeedback',           // 添加商品反馈
        'viewFeedback',          // 查看反馈历史
        'viewCurrentPrice',       // 查看当前价格
        'viewRetailInventory'    // 查看零售库存
    ],
    [ROLES.ADMIN]: [
        'all'                     // 管理员有所有权限
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
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// 验证JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
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