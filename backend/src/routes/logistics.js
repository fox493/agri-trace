const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkPermission } = require('../utils/auth');
const auth = require('../middleware/auth');

// 获取物流记录列表
router.get('/', auth, async (req, res) => {
  try {
    // 添加调试日志
    logger.info('Fetching logistics records for operator:', req.user.id);
    
    const result = await fabricClient.evaluateTransaction(
      'QueryLogisticsRecordsByOperator',
      req.user.id
    );

    // 如果返回的是空字符串，则返回空数组
    const resultStr = result.toString();
    const records = resultStr ? JSON.parse(resultStr) : [];
    
    // 添加调试日志
    logger.info('Fetched logistics records:', records);
    
    res.json(records);
  } catch (error) {
    logger.error('Failed to get logistics records:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

// 创建物流记录
router.post('/', [auth, checkPermission('addLogisticsInfo')], async (req, res) => {
  try {
    // 首先检查产品是否通过质检
    const qualityResult = await fabricClient.evaluateTransaction(
      'QueryQualityRecords',
      req.body.productId
    );
    
    const resultStr = qualityResult.toString();
    const qualityRecords = resultStr ? JSON.parse(resultStr) : [];
    
    // 检查是否有质检记录
    if (qualityRecords.length === 0) {
      return res.status(400).json({ error: '产品尚未进行质量检测，无法添加物流记录' });
    }

    // 获取收获阶段的质检记录
    const harvestingRecords = qualityRecords.filter(record => record.stage === 'HARVESTING');
    if (harvestingRecords.length === 0) {
      return res.status(400).json({ error: '产品尚未进行收获阶段的质量检测，无法添加物流记录' });
    }

    // 获取最新的收获阶段质检记录（已按时间排序，第一个就是最新的）
    const latestHarvestingRecord = harvestingRecords[0];
    if (!latestHarvestingRecord.isQualified) {
      return res.status(400).json({ error: '产品最新的收获阶段质量检测未通过，无法添加物流记录' });
    }

    const recordData = {
      id: req.body.id,
      productId: req.body.productId,
      location: req.body.location,
      status: req.body.status,
      description: req.body.description,
      operatorId: req.user.id,
    };

    // 添加调试日志
    logger.info('Creating logistics record:', recordData);

    await fabricClient.submitTransaction(
      'AddLogisticsRecord',
      JSON.stringify(recordData)
    );

    res.status(201).json({
      message: '物流记录添加成功',
      data: recordData
    });
  } catch (error) {
    logger.error('添加物流记录失败:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

// 获取单个物流记录
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await fabricClient.evaluateTransaction(
      'QueryLogisticsRecord',
      req.params.id
    );

    const record = JSON.parse(result.toString());
    res.json(record);
  } catch (error) {
    logger.error('查询物流记录失败:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

// 更新物流记录
router.put('/:id', [auth, checkPermission('addLogisticsInfo')], async (req, res) => {
  try {
    await fabricClient.submitTransaction(
      'UpdateLogisticsRecord',
      req.params.id,
      req.body.status,
      req.body.location,
      req.body.description
    );

    res.json({
      message: '物流记录更新成功',
      recordId: req.params.id
    });
  } catch (error) {
    logger.error('更新物流记录失败:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

// 获取产品的物流轨迹
router.get('/product/:productId', auth, async (req, res) => {
  try {
    const result = await fabricClient.evaluateTransaction(
      'QueryLogisticsRecordsByProduct',
      req.params.productId
    );

    const records = JSON.parse(result.toString());
    res.json(records);
  } catch (error) {
    logger.error('查询产品物流记录失败:', error);
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
});

module.exports = router; 