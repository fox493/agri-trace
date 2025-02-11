const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');

// 获取产品完整溯源信息
router.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // 获取产品基本信息
    const product = await fabricClient.queryProduct(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 获取生产信息
    const productionInfo = await fabricClient.queryProductionInfo(productId);

    // 获取加工信息
    const processingInfo = await fabricClient.queryProcessingInfo(productId);

    // 获取物流信息
    const logisticsInfo = await fabricClient.queryLogisticsByProduct(productId);

    // 获取质量检测信息
    const qualityInfo = await fabricClient.queryQualityInfo(productId);

    // 获取零售信息
    const retailInfo = await fabricClient.queryRetailInfo(productId);

    // 组合完整的溯源信息
    const traceInfo = {
      product,
      productionInfo,
      processingInfo,
      logisticsInfo,
      qualityInfo,
      retailInfo
    };

    res.json(traceInfo);
  } catch (error) {
    logger.error('Failed to get trace information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取产品溯源历史记录
router.get('/history/:id', async (req, res) => {
  try {
    const history = await fabricClient.queryProductHistory(req.params.id);
    res.json(history);
  } catch (error) {
    logger.error('Failed to get trace history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取产品质量认证信息
router.get('/certifications/:id', async (req, res) => {
  try {
    const certifications = await fabricClient.queryProductCertifications(req.params.id);
    res.json(certifications);
  } catch (error) {
    logger.error('Failed to get certifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取产品环境数据
router.get('/environment/:id', async (req, res) => {
  try {
    const environmentData = await fabricClient.queryProductEnvironmentData(req.params.id);
    res.json(environmentData);
  } catch (error) {
    logger.error('Failed to get environment data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 验证产品真实性
router.post('/verify/:id', async (req, res) => {
  try {
    const verificationResult = await fabricClient.verifyProduct(req.params.id);
    res.json(verificationResult);
  } catch (error) {
    logger.error('Failed to verify product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 