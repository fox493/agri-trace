const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkPermission } = require('../utils/auth');
const auth = require('../middleware/auth');

// 注册消费者
router.post('/register', async (req, res) => {
    try {
        const { name, phone } = req.body;

        const consumer = {
            id: `CONSUMER_${Date.now()}`,
            name,
            phone,
        };

        logger.info('Registering consumer:', consumer);

        await fabricClient.submitTransaction(
            'RegisterConsumer',
            JSON.stringify(consumer)
        );

        res.json({ message: '消费者注册成功', consumer });
    } catch (error) {
        logger.error('消费者注册失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 添加购买记录
router.post('/purchase', [auth, checkPermission('addPurchase')], async (req, res) => {
    try {
        const { productId, retailerId, quantity, unitPrice, paymentType } = req.body;

        const purchase = {
            id: `PURCHASE_${Date.now()}`,
            productId,
            consumerId: req.user.id,
            retailerId,
            quantity,
            unitPrice,
            paymentType,
        };

        logger.info('Adding purchase record:', purchase);

        await fabricClient.submitTransaction(
            'AddConsumerPurchase',
            JSON.stringify(purchase)
        );

        res.json({ message: '购买记录添加成功', purchase });
    } catch (error) {
        logger.error('添加购买记录失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询购买历史
router.get('/purchases', [auth, checkPermission('viewPurchases')], async (req, res) => {
    try {
        logger.info('Fetching purchase history for consumer:', req.user.id);

        const result = await fabricClient.evaluateTransaction(
            'QueryConsumerPurchases',
            req.user.id
        );

        let purchases;
        try {
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info('No purchase history found for consumer:', req.user.id);
                return res.json([]);
            }

            purchases = JSON.parse(rawData);

            if (!Array.isArray(purchases)) {
                purchases = [purchases];
            }

            // 验证数据结构并过滤掉带有SALE_前缀的记录
            purchases = purchases
                .filter(purchase => !purchase.id.startsWith('SALE_')) // 过滤掉SALE_开头的记录
                .map(purchase => ({
                    id: purchase.id || '',
                    salesId: purchase.salesId || '',
                    productId: purchase.productId || '',
                    consumerId: purchase.consumerId || '',
                    retailerId: purchase.retailerId || '',
                    quantity: purchase.quantity || 0,
                    unitPrice: purchase.unitPrice || 0,
                    totalAmount: purchase.totalAmount || 0,
                    purchaseTime: purchase.purchaseTime || new Date().toISOString(),
                    paymentType: purchase.paymentType || '',
                    purchaseCode: purchase.purchaseCode || ''
                }));

            // 按购买时间倒序排序
            purchases.sort((a, b) => new Date(b.purchaseTime).getTime() - new Date(a.purchaseTime).getTime());
        } catch (parseError) {
            logger.error('购买历史JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '购买历史数据格式错误' });
        }

        res.json(purchases);
    } catch (error) {
        logger.error('查询购买历史失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 添加产品反馈
router.post('/feedback', [auth, checkPermission('addFeedback')], async (req, res) => {
    try {
        const { productId, rating, comment, purchaseId } = req.body;

        // 验证必填字段
        if (!productId || !rating || !comment || !purchaseId) {
            return res.status(400).json({ error: '缺少必要的字段' });
        }

        // 验证评分范围
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: '评分必须在1-5之间' });
        }

        const feedback = {
            id: `FEEDBACK_${purchaseId}`,
            productId,
            consumerId: req.user.id,
            rating,
            comment,
            createdAt: new Date().toISOString()
        };

        logger.info('Adding product feedback:', feedback);

        await fabricClient.submitTransaction(
            'AddProductFeedback',
            JSON.stringify(feedback)
        );

        res.json({ message: '反馈添加成功', feedback });
    } catch (error) {
        logger.error('添加反馈失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 查询消费者的所有反馈
router.get('/feedback', [auth, checkPermission('viewFeedback')], async (req, res) => {
    try {
        logger.info('Fetching feedback history for consumer:', req.user.id);

        const result = await fabricClient.evaluateTransaction(
            'QueryConsumerFeedbacks',
            req.user.id
        );

        let feedbacks;
        try {
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info('No feedback found for consumer:', req.user.id);
                return res.json([]);
            }

            feedbacks = JSON.parse(rawData);

            if (!Array.isArray(feedbacks)) {
                feedbacks = [feedbacks];
            }

            // 验证数据结构并过滤掉带有SALE_前缀的记录
            feedbacks = feedbacks
                .filter(feedback => 
                    feedback.id.startsWith('FEEDBACK_') && // 只保留FEEDBACK_开头的记录
                    feedback.rating > 0 && // 确保评分大于0
                    feedback.comment && // 确保有评价内容
                    feedback.productId && // 确保有商品ID
                    feedback.consumerId // 确保有消费者ID
                )
                .map(feedback => ({
                    id: feedback.id,
                    productId: feedback.productId,
                    consumerId: feedback.consumerId,
                    rating: feedback.rating,
                    comment: feedback.comment,
                    createdAt: feedback.createdAt || new Date().toISOString()
                }));

            // 按创建时间倒序排序
            feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (parseError) {
            logger.error('反馈历史JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '反馈历史数据格式错误' });
        }

        res.json(feedbacks);
    } catch (error) {
        logger.error('查询反馈历史失败:', error);
        res.status(500).json({ error: error.message || '服务器内部错误' });
    }
});

// 获取零售商列表
router.get('/retailers', [auth, checkPermission('queryProduct')], async (req, res) => {
    try {
        logger.info('Fetching retailers list');

        const result = await fabricClient.evaluateTransaction(
            'QueryRetailers'
        );

        // 添加原始响应日志
        logger.debug('Raw blockchain response:', result.toString());

        let retailers;
        try {
            const rawData = result.toString().trim();
            if (!rawData) {
                logger.info('No retailers data found');
                return res.json([]);
            }

            retailers = JSON.parse(rawData);
            logger.debug('Parsed retailers data:', retailers);

            if (!Array.isArray(retailers)) {
                logger.debug('Converting non-array response to array');
                retailers = [retailers];
            }

            // 验证数据结构并处理ID前缀
            retailers = retailers.map(retailer => ({
                id: retailer.id ? retailer.id.replace('RETAILER_', '') : '',
                name: retailer.name || '',
                address: retailer.address || '',
                phone: retailer.phone || '',
                createdAt: retailer.createdAt || new Date().toISOString()
            }));

            logger.debug('Processed retailers data:', retailers);
        } catch (parseError) {
            logger.error('零售商列表JSON解析错误，原始数据:', result.toString());
            logger.error('解析错误详情:', parseError);
            return res.status(500).json({ error: '零售商列表数据格式错误' });
        }

        res.json(retailers);
    } catch (error) {
        logger.error('Failed to get retailers:', error);
        res.status(500).json({ error: 'Failed to get retailers' });
    }
});

module.exports = router; 