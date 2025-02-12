const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');
const { checkPermission } = require('../utils/auth');

// 获取所有农场列表
router.get('/', async (req, res) => {
  try {
    const farms = await fabricClient.queryAllFarms();
    res.json(farms);
  } catch (error) {
    logger.error('Failed to get farms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const farm = await fabricClient.queryFarm(req.params.id);
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }
    res.json(farm);
  } catch (error) {
    logger.error('Failed to get farm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建新农场
router.post('/', checkPermission('producer'), async (req, res) => {
  try {
    const farmData = {
      id: req.body.id,
      name: req.body.name,
      owner: req.body.owner,
      location: req.body.location,
      size: req.body.size,
      products: req.body.products || [],
      certifications: req.body.certifications || []
    };
    
    await fabricClient.createFarm(farmData);
    res.status(201).json(farmData);
  } catch (error) {
    logger.error('Failed to create farm:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 更新农场信息
router.put('/:id', checkPermission('producer'), async (req, res) => {
  try {
    const farmData = {
      id: req.params.id,
      name: req.body.name,
      owner: req.body.owner,
      location: req.body.location,
      size: req.body.size,
      products: req.body.products,
      certifications: req.body.certifications
    };
    
    await fabricClient.updateFarm(req.params.id, farmData);
    res.json(farmData);
  } catch (error) {
    logger.error('Failed to update farm:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 删除农场
router.delete('/:id', async (req, res) => {
  try {
    await fabricClient.deleteFarm(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete farm:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 