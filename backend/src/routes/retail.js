const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkPermission } = require('../utils/auth');
const auth = require('../middleware/auth');
const User = require('../models/user');
const { hashPassword, generateToken } = require('../utils/auth');

// 添加零售库存
router.post('/inventory', [auth, checkPermission('addRetailInventory')], async (req, res) => {
    try {
        const { productId, quantity, minQuantity } = req.body;

        const inventory = {
            id: `INV_${Date.now()}`,
            productId,
            retailerId: req.user.id,
            quantity,
            minQuantity,
        };

        logger.info('Adding retail inventory:', inventory);

        await fabricClient.submitTransaction(
            'AddRetailInventory',
            JSON.stringify(inventory)
        );

        res.json({ message: '库存添加成功', inventory });
    } catch (error) {
        logger.error('添加库存失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 更新库存数量
router.put('/inventory/:id', [auth, checkPermission('updateRetailInventory')], async (req, res) => {
    try {
        const { quantity } = req.body;
        const inventoryId = req.params.id;

        logger.info('Updating inventory quantity:', { inventoryId, quantity });

        await fabricClient.submitTransaction(
            'UpdateInventoryQuantity',
            inventoryId,
            quantity.toString()
        );

        res.json({ message: '库存更新成功' });
    } catch (error) {
        logger.error('更新库存失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询零售商的库存
router.get('/inventory', [auth, checkPermission('viewRetailInventory')], async (req, res) => {
    try {
        // 直接使用原始ID，不添加前缀
        const retailerId = (req.query.retailerId || req.user.id).toString();
        logger.info('Fetching inventory for retailer:', retailerId);

        const result = await fabricClient.evaluateTransaction(
            'QueryInventoryByRetailer',
            retailerId
        );

        // 添加调试日志
        logger.debug('Raw blockchain response:', result.toString());
        
        let inventories;
        try {
            // 确保返回的是非空数据
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info('No inventory data found for retailer:', retailerId);
                return res.json([]);  // 返回空数组而不是错误
            }
            
            inventories = JSON.parse(rawData);
            
            // 确保返回的是数组
            if (!Array.isArray(inventories)) {
                inventories = [inventories];
            }
        } catch (parseError) {
            logger.error('JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '数据格式错误' });
        }
        
        res.json(inventories);
    } catch (error) {
        logger.error('查询库存失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 添加销售记录
router.post('/sales', [auth, checkPermission('addSalesRecord')], async (req, res) => {
    try {
        const { productId, quantity, unitPrice, paymentType } = req.body;

        const salesRecord = {
            id: `SALE_${Date.now()}`,
            productId,
            retailerId: req.user.id,
            quantity,
            unitPrice,
            paymentType,
        };

        logger.info('Adding sales record:', salesRecord);

        await fabricClient.submitTransaction(
            'AddSalesRecord',
            JSON.stringify(salesRecord)
        );

        res.json({ message: '销售记录添加成功', salesRecord });
    } catch (error) {
        logger.error('添加销售记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询销售记录
router.get('/sales', [auth, checkPermission('viewSalesRecords')], async (req, res) => {
    try {
        logger.info('Fetching sales records for retailer:', req.user.id);

        const result = await fabricClient.evaluateTransaction(
            'QuerySalesByRetailer',
            req.user.id
        );

        // 添加调试日志
        logger.debug('Raw blockchain response for sales:', result.toString());
        
        let sales;
        try {
            // 确保返回的是非空数据
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info('No sales records found for retailer:', req.user.id);
                return res.json([]);  // 返回空数组而不是错误
            }
            
            sales = JSON.parse(rawData);
            
            // 确保返回的是数组
            if (!Array.isArray(sales)) {
                sales = [sales];
            }

            // 验证数据结构
            sales = sales.map(sale => ({
                id: sale.id || '',
                productId: sale.productId || '',
                retailerId: sale.retailerId || '',
                consumerId: sale.consumerId || '',
                quantity: sale.quantity || 0,
                unitPrice: sale.unitPrice || 0,
                totalAmount: sale.totalAmount || 0,
                saleTime: sale.saleTime || new Date().toISOString(),
                paymentType: sale.paymentType || '',
                purchaseCode: sale.purchaseCode || ''
            }));
        } catch (parseError) {
            logger.error('销售记录JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '销售记录数据格式错误' });
        }
        
        res.json(sales);
    } catch (error) {
        logger.error('查询销售记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 设置产品价格
router.post('/price', [auth, checkPermission('setProductPrice')], async (req, res) => {
    try {
        const { productId, price } = req.body;

        const priceRecord = {
            id: `PRICE_${Date.now()}`,
            productId,
            retailerId: req.user.id,
            price,
        };

        logger.info('Setting product price:', priceRecord);

        await fabricClient.submitTransaction(
            'SetProductPrice',
            JSON.stringify(priceRecord)
        );

        res.json({ message: '价格设置成功', priceRecord });
    } catch (error) {
        logger.error('设置价格失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询价格历史
router.get('/price/:productId/history', [auth, checkPermission('viewPriceHistory')], async (req, res) => {
    try {
        logger.info('Fetching price history for product:', req.params.productId);

        const result = await fabricClient.evaluateTransaction(
            'QueryPriceHistory',
            req.params.productId
        );

        // 添加调试日志
        logger.debug('Raw blockchain response:', result.toString());
        
        let priceHistory;
        try {
            // 确保返回的是非空数据
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info('No price history found for product:', req.params.productId);
                return res.json([]);  // 返回空数组而不是错误
            }
            
            priceHistory = JSON.parse(rawData);
            
            // 确保返回的是数组
            if (!Array.isArray(priceHistory)) {
                priceHistory = [priceHistory];
            }

            // 验证数据结构
            priceHistory = priceHistory.map(price => ({
                id: price.id || '',
                productId: price.productId || '',
                retailerId: price.retailerId || '',
                price: price.price || 0,
                startTime: price.startTime || new Date().toISOString(),
                endTime: price.endTime || null,
                status: price.status || 'INACTIVE'
            }));
        } catch (parseError) {
            logger.error('价格历史JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '价格历史数据格式错误' });
        }
        
        res.json(priceHistory);
    } catch (error) {
        logger.error('查询价格历史失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询当前价格
router.get('/price/:productId/current', [auth, checkPermission('viewCurrentPrice')], async (req, res) => {
    try {
        logger.info('Fetching current price for product:', req.params.productId);

        const result = await fabricClient.evaluateTransaction(
            'QueryCurrentPrice',
            req.params.productId
        );

        const currentPrice = JSON.parse(result.toString());
        res.json(currentPrice);
    } catch (error) {
        logger.error('查询当前价格失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 产品上架
router.post('/product/:id/onsale', [auth, checkPermission('manageProductStatus')], async (req, res) => {
    try {
        logger.info('Putting product on sale:', req.params.id);

        await fabricClient.submitTransaction(
            'PutProductOnSale',
            req.params.id
        );

        res.json({ message: '产品上架成功' });
    } catch (error) {
        logger.error('产品上架失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 产品下架
router.post('/product/:id/offshelf', [auth, checkPermission('manageProductStatus')], async (req, res) => {
    try {
        logger.info('Taking product off shelf:', req.params.id);

        await fabricClient.submitTransaction(
            'TakeProductOffShelf',
            req.params.id
        );

        res.json({ message: '产品下架成功' });
    } catch (error) {
        logger.error('产品下架失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 标记产品售罄
router.post('/product/:id/soldout', [auth, checkPermission('manageProductStatus')], async (req, res) => {
    try {
        logger.info('Marking product as sold out:', req.params.id);

        await fabricClient.submitTransaction(
            'MarkProductAsSoldOut',
            req.params.id
        );

        res.json({ message: '产品已标记为售罄' });
    } catch (error) {
        logger.error('标记产品售罄失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 验证购买凭证
router.get('/verify-purchase/:code', [auth, checkPermission('verifyPurchase')], async (req, res) => {
    try {
        logger.info('Verifying purchase code:', req.params.code);

        const result = await fabricClient.evaluateTransaction(
            'VerifyPurchase',
            req.params.code
        );

        let purchase;
        try {
            const rawData = result.toString().trim();
            if (!rawData) {
                return res.status(404).json({ error: '未找到购买记录' });
            }

            purchase = JSON.parse(rawData);
        } catch (parseError) {
            logger.error('购买记录JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '购买记录数据格式错误' });
        }

        res.json(purchase);
    } catch (error) {
        logger.error('验证购买凭证失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 注册零售商
router.post('/register', async (req, res) => {
    try {
        const { username, password, name, address, phone } = req.body;

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 创建用户
        const hashedPassword = await hashPassword(password);
        const user = new User({
            username,
            password: hashedPassword,
            role: 'retailer'
        });
        await user.save();

        // 使用原始MongoDB ID
        const retailerId = user._id.toString();

        // 创建零售商数据
        const retailer = {
            id: retailerId,
            name,
            address,
            phone
        };

        logger.info('Registering retailer:', retailer);

        // 调用链码注册零售商
        await fabricClient.submitTransaction(
            'RegisterRetailer',
            JSON.stringify(retailer)
        );

        // 生成token
        const token = generateToken({
            ...user.toObject(),
            id: retailerId
        });

        res.json({
            message: '零售商注册成功',
            token,
            user: {
                id: retailerId,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('零售商注册失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

module.exports = router; 