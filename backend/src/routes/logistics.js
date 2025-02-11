const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');

// 获取物流记录列表
router.get('/', async (req, res) => {
  try {
    const logistics = await fabricClient.queryLogistics();
    res.json(logistics);
  } catch (error) {
    logger.error('Failed to get logistics records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取单个物流记录
router.get('/:id', async (req, res) => {
  try {
    const logistic = await fabricClient.queryLogistic(req.params.id);
    if (!logistic) {
      return res.status(404).json({ error: 'Logistics record not found' });
    }
    res.json(logistic);
  } catch (error) {
    logger.error('Failed to get logistics record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建物流记录
router.post('/', async (req, res) => {
  try {
    const logisticData = {
      id: req.body.id,
      productId: req.body.productId,
      fromLocation: req.body.fromLocation,
      toLocation: req.body.toLocation,
      carrier: req.body.carrier,
      transportType: req.body.transportType,
      status: req.body.status,
      temperature: req.body.temperature,
      humidity: req.body.humidity,
      timestamp: new Date().toISOString()
    };
    await fabricClient.createLogistic(logisticData);
    res.status(201).json(logisticData);
  } catch (error) {
    logger.error('Failed to create logistics record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新物流记录
router.put('/:id', async (req, res) => {
  try {
    const logisticData = {
      id: req.params.id,
      status: req.body.status,
      temperature: req.body.temperature,
      humidity: req.body.humidity,
      location: req.body.location,
      timestamp: new Date().toISOString()
    };
    await fabricClient.updateLogistic(logisticData);
    res.json(logisticData);
  } catch (error) {
    logger.error('Failed to update logistics record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取产品的物流轨迹
router.get('/product/:productId', async (req, res) => {
  try {
    const logistics = await fabricClient.queryLogisticsByProduct(req.params.productId);
    res.json(logistics);
  } catch (error) {
    logger.error('Failed to get product logistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 