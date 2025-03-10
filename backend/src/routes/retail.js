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
        const retailerId = req.user.id;

        // 先查询产品的当前状态
        logger.info('Checking product status:', productId);
        const productData = await fabricClient.evaluateTransaction('QueryProduct', productId);
        
        let product;
        try {
            product = JSON.parse(productData.toString());
        } catch (error) {
            logger.error('解析产品数据失败:', error);
            return res.status(404).json({ error: '产品不存在或数据格式错误' });
        }
        
        // 检查该零售商是否已经有该产品的库存记录
        logger.info('Checking if retailer already has inventory for this product');
        const result = await fabricClient.evaluateTransaction(
            'QueryInventoryByRetailer',
            retailerId
        );
        
        let existingInventory = null;
        if (result && result.toString().trim()) {
            try {
                const inventories = JSON.parse(result.toString());
                const inventoriesArray = Array.isArray(inventories) ? inventories : [inventories];
                
                // 查找匹配的库存记录
                existingInventory = inventoriesArray.find(inv => inv.productId === productId);
            } catch (error) {
                logger.warn('解析库存数据失败，假设没有现有库存:', error);
            }
        }
        
        if (existingInventory) {
            // 已有库存记录，更新数量
            logger.info('Updating existing inventory:', existingInventory.id);
            const newQuantity = existingInventory.quantity + quantity;
            
            // 如果产品状态是售罄但有库存，更新产品状态为上架
            if (product.status === 'SOLD_OUT' && newQuantity > 0) {
                logger.info('Product was sold out, updating to ON_SALE:', productId);
                await fabricClient.submitTransaction(
                    'UpdateProductStatus',
                    productId,
                    'ON_SALE'
                );
            }
            
            // 更新库存数量
            await fabricClient.submitTransaction(
                'UpdateInventoryQuantity',
                existingInventory.id,
                newQuantity.toString()
            );
            
            // 返回更新后的库存信息
            const updatedInventory = {
                ...existingInventory,
                quantity: newQuantity,
                minQuantity: minQuantity || existingInventory.minQuantity // 更新最小库存如果提供了
            };
            
            res.json({ 
                message: '库存更新成功', 
                inventory: updatedInventory,
                statusUpdated: product.status === 'SOLD_OUT' && newQuantity > 0,
                updated: true // 表示是更新而不是新建
            });
        } else {
            // 没有现有库存，创建新记录
            // 如果产品状态是售罄，先将其改为在售
            if (product.status === 'SOLD_OUT' && quantity > 0) {
                logger.info('Product was sold out, updating to ON_SALE:', productId);
                await fabricClient.submitTransaction(
                    'UpdateProductStatus',
                    productId,
                    'ON_SALE'
                );
            }
            
            const inventory = {
                id: `INV_${Date.now()}`,
                productId,
                retailerId,
                quantity,
                minQuantity: minQuantity || 5, // 默认最小库存为5
            };
            
            logger.info('Adding new retail inventory:', inventory);
            
            await fabricClient.submitTransaction(
                'AddRetailInventory',
                JSON.stringify(inventory)
            );
            
            res.json({ 
                message: '库存添加成功', 
                inventory,
                statusUpdated: product.status === 'SOLD_OUT' && quantity > 0,
                updated: false // 表示是新建而不是更新
            });
        }
    } catch (error) {
        logger.error('添加库存失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 更新库存数量
router.put('/inventory/:id', [auth, checkPermission('updateRetailInventory')], async (req, res) => {
    try {
        const { quantity, minQuantity } = req.body;
        const inventoryId = req.params.id;
        const retailerId = req.user.id;

        // 先查询库存记录，确保属于当前零售商
        const allInventories = await fabricClient.evaluateTransaction('QueryInventoryByRetailer', retailerId);
        const inventories = JSON.parse(allInventories.toString());
        const inventoriesArray = Array.isArray(inventories) ? inventories : [inventories];
        
        const inventory = inventoriesArray.find(inv => inv.id === inventoryId);
        if (!inventory) {
            return res.status(404).json({ error: '未找到该库存记录或该记录不属于您' });
        }

        logger.info('Updating inventory:', { inventoryId, quantity, minQuantity });
        
        // 如果有数量更新
        if (quantity !== undefined) {
            logger.info('Updating inventory quantity:', { inventoryId, quantity });
            await fabricClient.submitTransaction(
                'UpdateInventoryQuantity',
                inventoryId,
                quantity.toString()
            );
            
            // 如果数量变为大于0，检查产品状态并更新
            if (quantity > 0 && inventory.quantity === 0) {
                const productData = await fabricClient.evaluateTransaction('QueryProduct', inventory.productId);
                const product = JSON.parse(productData.toString());
                
                if (product.status === 'SOLD_OUT') {
                    logger.info('Product was sold out, updating to ON_SALE:', inventory.productId);
                    await fabricClient.submitTransaction(
                        'UpdateProductStatus',
                        inventory.productId,
                        'ON_SALE'
                    );
                }
            }
        }
        
        // 如果有最小库存更新
        if (minQuantity !== undefined) {
            logger.info('Updating inventory min quantity:', { inventoryId, minQuantity });
            await fabricClient.submitTransaction(
                'UpdateInventorySettings',
                inventoryId,
                minQuantity.toString()
            );
        }

        // 获取更新后的库存
        const updatedInventoryData = await fabricClient.evaluateTransaction('QueryInventory', inventoryId);
        const updatedInventory = JSON.parse(updatedInventoryData.toString());

        res.json({ 
            message: '库存更新成功',
            inventory: updatedInventory
        });
    } catch (error) {
        logger.error('更新库存失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询零售商的库存
router.get('/inventory', [auth, checkPermission('viewRetailInventory')], async (req, res) => {
    try {
        // 从 JWT token 中获取零售商 ID
        const retailerId = req.user.id;
        
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
            logger.debug('inventories:', inventories);
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

// 查询所有零售商的库存
router.get('/public/all-inventory', async (req, res) => {
    try {
        logger.info('Fetching all retail inventories');

        const result = await fabricClient.evaluateTransaction('QueryAllInventories');

        let inventories;
        try {
            // 确保返回的是非空数据
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info('No inventory data found');
                return res.json([]);  // 返回空数组而不是错误
            }
            
            inventories = JSON.parse(rawData);
            logger.debug('All inventories:', inventories);
            
            // 确保返回的是数组
            if (!Array.isArray(inventories)) {
                inventories = [inventories];
            }

            // 统一时间戳格式
            inventories = inventories.map(inventory => {
                if (!inventory) return inventory;
                
                const formatted = { ...inventory };
                
                // 处理时间字段
                if (formatted.updatedAt) {
                    try {
                        const date = new Date(formatted.updatedAt);
                        if (!isNaN(date.getTime())) {
                            formatted.updatedAt = date.toISOString().replace('T', ' ').substring(0, 19);
                        }
                    } catch (error) {
                        // 如果转换失败，保留原始值
                    }
                }
                
                return formatted;
            });
        } catch (parseError) {
            logger.error('JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '数据格式错误' });
        }
        
        res.json(inventories);
    } catch (error) {
        logger.error('查询所有库存失败:', error);
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
        // 从 JWT token 中获取零售商 ID
        const retailerId = req.user.id;
        logger.info('Fetching sales records for retailer:', retailerId);

        const result = await fabricClient.evaluateTransaction(
            'QuerySalesByRetailer',
            retailerId
        );

        // 添加调试日志
        logger.debug('Raw blockchain response for sales:', result.toString());
        
        let sales;
        try {
            // 确保返回的是非空数据
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info('No sales records found for retailer:', retailerId);
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

// 查询特定零售商的产品价格
router.get('/price/:productId/:retailerId/current', [auth, checkPermission('viewCurrentPrice')], async (req, res) => {
    try {
        const { productId, retailerId } = req.params;
        logger.info(`Fetching price for product ${productId} from retailer ${retailerId}`);

        // 首先获取所有价格记录
        const result = await fabricClient.evaluateTransaction(
            'QueryPriceHistory',
            productId
        );

        let priceHistory;
        try {
            // 确保返回的是非空数据
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info(`No price records found for product ${productId}`);
                return res.status(404).json({ error: '未找到价格记录' });
            }
            
            priceHistory = JSON.parse(rawData);
            
            // 确保返回的是数组
            if (!Array.isArray(priceHistory)) {
                priceHistory = [priceHistory];
            }
        } catch (parseError) {
            logger.error('价格历史JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '价格历史数据格式错误' });
        }

        // 查找特定零售商的当前价格（活跃状态）
        const retailerPrice = priceHistory.find(price => 
            price.retailerId === retailerId && price.status === 'ACTIVE'
        );

        if (!retailerPrice) {
            return res.status(404).json({ error: `未找到零售商 ${retailerId} 的当前价格` });
        }

        res.json(retailerPrice);
    } catch (error) {
        logger.error('查询价格失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 将产品放回上架
router.post('/product/:id/onsale', [auth, checkPermission('manageProductStatus')], async (req, res) => {
    try {
        const productId = req.params.id;
        const retailerId = req.user.id;
        
        logger.info('Finding inventory for product and retailer:', { productId, retailerId });
        
        // 查询该零售商的该产品库存
        const result = await fabricClient.evaluateTransaction(
            'QueryInventoryByRetailer',
            retailerId
        );
        
        let inventories;
        try {
            const rawData = result.toString().trim();
            if (!rawData) {
                return res.status(404).json({ error: '未找到相关库存记录' });
            }
            
            inventories = JSON.parse(rawData);
            if (!Array.isArray(inventories)) {
                inventories = [inventories];
            }
        } catch (parseError) {
            logger.error('JSON解析错误，原始数据:', result.toString());
            return res.status(500).json({ error: '数据格式错误' });
        }
        
        // 找到匹配产品ID的库存记录
        const inventory = inventories.find(inv => inv.productId === productId);
        if (!inventory) {
            return res.status(404).json({ error: '未找到该产品的库存记录' });
        }
        
        // 检查库存数量，如果为0，返回错误
        if (inventory.quantity <= 0) {
            return res.status(400).json({ 
                error: '库存数量为0，无法上架',
                suggestion: '请先添加库存再上架'
            });
        }
        
        // 将产品状态改为上架
        await fabricClient.submitTransaction(
            'UpdateProductStatus',
            productId,
            'ON_SALE'
        );
        
        res.json({ 
            message: '产品已上架',
            inventory: inventory
        });
    } catch (error) {
        logger.error('上架产品失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 将产品下架
router.post('/product/:id/offshelf', [auth, checkPermission('manageProductStatus')], async (req, res) => {
    try {
        const productId = req.params.id;
        const retailerId = req.user.id;
        
        logger.info('Finding inventory for product and retailer:', { productId, retailerId });
        
        // 查询该零售商的该产品库存
        const result = await fabricClient.evaluateTransaction(
            'QueryInventoryByRetailer',
            retailerId
        );
        
        let inventories;
        try {
            const rawData = result.toString().trim();
            if (!rawData) {
                return res.status(404).json({ error: '未找到相关库存记录' });
            }
            
            inventories = JSON.parse(rawData);
            if (!Array.isArray(inventories)) {
                inventories = [inventories];
            }
        } catch (parseError) {
            logger.error('JSON解析错误，原始数据:', result.toString());
            return res.status(500).json({ error: '数据格式错误' });
        }
        
        // 找到匹配产品ID的库存记录
        const inventory = inventories.find(inv => inv.productId === productId);
        if (!inventory) {
            return res.status(404).json({ error: '未找到该产品的库存记录' });
        }
        
        // 将产品状态改为下架
        await fabricClient.submitTransaction(
            'UpdateProductStatus',
            productId,
            'OFF_SHELF'
        );
        
        res.json({ 
            message: '产品已下架',
            inventory: inventory
        });
    } catch (error) {
        logger.error('下架产品失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 标记产品售罄
router.post('/product/:id/soldout', [auth, checkPermission('manageProductStatus')], async (req, res) => {
    try {
        const productId = req.params.id;
        const retailerId = req.user.id; // 从JWT中获取零售商ID
        
        logger.info('Finding inventory for product and retailer:', { productId, retailerId });
        
        // 查询该零售商的该产品库存
        const result = await fabricClient.evaluateTransaction(
            'QueryInventoryByRetailer',
            retailerId
        );
        
        let inventories;
        try {
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.warn('No inventory records found for retailer:', retailerId);
                return res.status(404).json({ error: '未找到相关库存记录' });
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
        
        // 找到匹配产品ID的库存记录
        const inventory = inventories.find(inv => inv.productId === productId);
        if (!inventory) {
            return res.status(404).json({ error: '未找到该产品的库存记录' });
        }
        
        // 更新该库存记录数量为0
        logger.info('Setting inventory quantity to 0:', inventory.id);
        await fabricClient.submitTransaction(
            'UpdateInventoryQuantity',
            inventory.id,
            '0'
        );
        
        // 查询其他零售商是否还有该产品库存
        const allInventories = await fabricClient.evaluateTransaction('QueryAllInventories');
        const allInventoriesArray = JSON.parse(allInventories.toString());
        
        // 检查是否还有其他库存数量大于0的记录
        const anyInventoryLeft = allInventoriesArray.some(inv => 
            inv.productId === productId && inv.quantity > 0
        );
        
        let statusUpdated = false;
        
        // 只有当没有其他任何库存时，才将产品全局状态设为售罄
        if (!anyInventoryLeft) {
            logger.info('No inventory left for this product, marking as globally sold out');
            await fabricClient.submitTransaction(
                'UpdateProductStatus',
                productId,
                'SOLD_OUT'
            );
            statusUpdated = true;
        }
        
        // 返回成功消息
        res.json({ 
            message: '库存已标记为售罄',
            inventory: { ...inventory, quantity: 0 },
            globalStatusUpdated: statusUpdated
        });
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

// 注册零售商 - 已废弃，使用通用/auth/register接口
router.post('/register', async (req, res) => {
    // 返回引导信息，指导使用新的注册接口
    return res.status(410).json({
        error: '此注册端点已废弃',
        message: '请使用统一的注册接口 /api/auth/register，将role字段设置为"retailer"'
    });
});

// 公开查询产品库存信息，用于溯源系统
router.get('/public/inventory', async (req, res) => {
    try {
        // 从查询参数中获取产品ID
        const { productId } = req.query;
        
        if (!productId) {
            return res.status(400).json({ error: '缺少必要的产品ID参数' });
        }
        
        logger.info(`公开查询产品库存信息: ${productId}`);
        
        // 使用溯源系统专用的库存查询方法
        const inventoryData = await fabricClient.queryInventoryInfo(productId);
        
        // 记录一些调试信息
        logger.debug(`查询到 ${inventoryData.length} 条库存记录`);
        if (inventoryData.length > 0) {
            logger.debug(`库存ID列表: ${inventoryData.map(r => r.id).join(', ')}`);
        }
        
        // 统一时间戳格式
        const formattedInventoryData = inventoryData.map(record => {
            if (!record) return record;
            
            const formatted = { ...record };
            
            // 处理常见的时间字段
            const timeFields = ['createdAt', 'updatedAt', 'timestamp', 'date'];
            
            for (const field of timeFields) {
                if (field in formatted && formatted[field]) {
                    try {
                        const date = new Date(formatted[field]);
                        if (!isNaN(date.getTime())) {
                            formatted[field] = date.toISOString().replace('T', ' ').substring(0, 19);
                        }
                    } catch (error) {
                        // 如果转换失败，保留原始值
                    }
                }
            }
            
            return formatted;
        });
        
        res.json(formattedInventoryData);
    } catch (error) {
        logger.error('查询库存信息失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

module.exports = router; 