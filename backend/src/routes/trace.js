const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fabricClient = require('../utils/fabric');

// 格式化时间戳为统一格式
function formatTimestamp(records, timeFields = ['recordTime', 'timestamp', 'createdAt', 'updatedAt', 'date', 'plantingDate', 'harvestDate']) {
  if (!records || !Array.isArray(records)) {
    return records;
  }
  
  return records.map(record => {
    if (!record || typeof record !== 'object') {
      return record;
    }
    
    const formattedRecord = { ...record };
    
    // 处理所有可能的时间字段
    for (const field of timeFields) {
      if (field in formattedRecord && formattedRecord[field]) {
        try {
          // 检查是否为时间戳数字
          if (typeof formattedRecord[field] === 'number') {
            // 将数字时间戳转换为日期对象
            const date = new Date(formattedRecord[field]);
            // 检查是否为有效日期
            if (!isNaN(date.getTime())) {
              // 格式化为 YYYY-MM-DD HH:MM:SS
              formattedRecord[field] = date.toISOString().replace('T', ' ').substring(0, 19);
            }
          } 
          // 检查是否为ISO字符串或类似格式
          else if (typeof formattedRecord[field] === 'string') {
            const date = new Date(formattedRecord[field]);
            // 检查是否为有效日期
            if (!isNaN(date.getTime())) {
              // 格式化为 YYYY-MM-DD HH:MM:SS
              formattedRecord[field] = date.toISOString().replace('T', ' ').substring(0, 19);
            }
          }
        } catch (error) {
          // 如果解析失败，保留原始值
          logger.warn(`Failed to format timestamp for field ${field}:`, error);
        }
      }
    }
    
    return formattedRecord;
  });
}

// 处理单个记录对象
function formatSingleObject(obj, timeFields = ['recordTime', 'timestamp', 'createdAt', 'updatedAt', 'date', 'plantingDate', 'harvestDate']) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const formattedObj = { ...obj };
  
  // 处理所有可能的时间字段
  for (const field of timeFields) {
    if (field in formattedObj && formattedObj[field]) {
      try {
        // 检查是否为时间戳数字
        if (typeof formattedObj[field] === 'number') {
          // 将数字时间戳转换为日期对象
          const date = new Date(formattedObj[field]);
          // 检查是否为有效日期
          if (!isNaN(date.getTime())) {
            // 格式化为 YYYY-MM-DD HH:MM:SS
            formattedObj[field] = date.toISOString().replace('T', ' ').substring(0, 19);
          }
        } 
        // 检查是否为ISO字符串或类似格式
        else if (typeof formattedObj[field] === 'string') {
          const date = new Date(formattedObj[field]);
          // 检查是否为有效日期
          if (!isNaN(date.getTime())) {
            // 格式化为 YYYY-MM-DD HH:MM:SS
            formattedObj[field] = date.toISOString().replace('T', ' ').substring(0, 19);
          }
        }
      } catch (error) {
        // 如果解析失败，保留原始值
        logger.warn(`Failed to format timestamp for field ${field}:`, error);
      }
    }
  }
  
  return formattedObj;
}

// 获取产品完整溯源信息
router.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    logger.info(`Querying trace information for product: ${productId}`);
    
    // 获取产品基本信息
    const product = await fabricClient.queryProduct(productId);
    if (!product) {
      logger.warn(`Product not found: ${productId}`);
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info(`Found product: ${product.id} - ${product.name}`);

    // 获取生产信息
    const productionInfo = await fabricClient.queryProductionInfo(productId);
    logger.info(`Found ${productionInfo.length} production records`);
    
    // 检查并记录每条记录的类型和ID
    if (productionInfo.length > 0) {
      const productionIds = productionInfo.map(r => r.id);
      logger.debug('Production IDs:', productionIds);
    }

    // 获取物流信息
    const logisticsInfo = await fabricClient.queryLogisticsByProduct(productId);
    logger.info(`Found ${logisticsInfo.length} logistics records`);
    
    // 检查并记录每条记录的类型和ID
    if (logisticsInfo.length > 0) {
      const logisticsIds = logisticsInfo.map(r => r.id);
      logger.debug('Logistics IDs:', logisticsIds);
    }

    // 获取质量检测信息
    const qualityInfo = await fabricClient.queryQualityInfo(productId);
    logger.info(`Found ${qualityInfo.length} quality records`);
    
    // 检查并记录每条记录的类型和ID
    if (qualityInfo.length > 0) {
      const qualityIds = qualityInfo.map(r => r.id);
      logger.debug('Quality IDs:', qualityIds);
    }

    // 获取零售信息
    const retailInfo = await fabricClient.queryRetailInfo(productId);
    logger.info(`Found ${retailInfo.length} retail records`);
    
    // 检查并记录每条零售记录的ID
    if (retailInfo.length > 0) {
      const retailIds = retailInfo.map(r => r.id);
      logger.debug('Retail IDs:', retailIds);
    }

    // 获取库存信息
    const inventoryInfo = await fabricClient.queryInventoryInfo(productId);
    logger.info(`Found ${inventoryInfo.length} inventory records`);
    
    // 检查并记录每条库存记录的ID
    if (inventoryInfo.length > 0) {
      const inventoryIds = inventoryInfo.map(r => r.id);
      logger.debug('Inventory IDs:', inventoryIds);
    }

    // 环境数据
    const environmentInfo = await fabricClient.queryProductEnvironmentData(productId);
    logger.info(`Found ${environmentInfo.length} environment records`);
    
    // 检查并记录每条记录的类型和ID
    if (environmentInfo.length > 0) {
      const environmentIds = environmentInfo.map(r => r.id);
      logger.debug('Environment IDs:', environmentIds);
      
      // 额外检查环境数据，确保没有零售相关的记录（库存记录现在单独处理）
      const retailPrefixes = ['PURCHASE_', 'FEEDBACK_PURCHASE_', 'PRICE_', 'SALE_', 'SALE_PURCHASE_', 'INV_'];
      
      // 在这里进行二次过滤，确保不会有零售记录混入
      const originalLength = environmentInfo.length;
      for (let i = environmentInfo.length - 1; i >= 0; i--) {
        const record = environmentInfo[i];
        if (record && record.id && typeof record.id === 'string' &&
            retailPrefixes.some(prefix => record.id.startsWith(prefix))) {
          logger.warn(`Removing retail record from environment data at route level: ${record.id}`);
          environmentInfo.splice(i, 1);
        }
      }
      
      if (originalLength !== environmentInfo.length) {
        logger.info(`Removed ${originalLength - environmentInfo.length} retail records from environment data at route level`);
      }
    }

    // 检查数据一致性，确保不同类型的记录ID没有重复
    const allIds = [
      ...productionInfo.map(r => r.id),
      ...logisticsInfo.map(r => r.id),
      ...qualityInfo.map(r => r.id),
      ...retailInfo.map(r => r.id),
      ...inventoryInfo.map(r => r.id),
      ...environmentInfo.map(r => r.id)
    ];
    
    const uniqueIds = new Set(allIds);
    if (uniqueIds.size !== allIds.length) {
      // 存在ID重复，发出警告并尝试修复
      logger.warn('WARNING: Duplicate record IDs detected in different record types!');
      
      // 创建ID计数器
      const idCounts = {};
      allIds.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
      });
      
      // 找出重复的ID
      const duplicateIds = Object.entries(idCounts)
        .filter(([id, count]) => count > 1)
        .map(([id]) => id);
      
      logger.warn('Duplicate IDs:', duplicateIds);

      // 记录每种记录类型的ID
      const recordTypes = {
        'production': new Set(productionInfo.map(r => r.id)),
        'logistics': new Set(logisticsInfo.map(r => r.id)),
        'quality': new Set(qualityInfo.map(r => r.id)),
        'retail': new Set(retailInfo.map(r => r.id)),
        'inventory': new Set(inventoryInfo.map(r => r.id)),
        'environment': new Set(environmentInfo.map(r => r.id))
      };

      // 打印详细的重复信息
      for (const dupId of duplicateIds) {
        const appearsIn = [];
        for (const [type, idSet] of Object.entries(recordTypes)) {
          if (idSet.has(dupId)) {
            appearsIn.push(type);
          }
        }
        logger.warn(`ID ${dupId} appears in record types: ${appearsIn.join(', ')}`);
      }
      
      // 优先级：生产 > 物流 > 质检 > 零售 > 库存 > 环境
      // 对每个重复ID，保留最高优先级的记录类型，从其他类型中移除
      const priorityOrder = ['production', 'logistics', 'quality', 'retail', 'inventory', 'environment'];
      
      for (const dupId of duplicateIds) {
        const typesWithId = priorityOrder.filter(type => recordTypes[type].has(dupId));
        if (typesWithId.length <= 1) continue; // 不需要处理
        
        // 保留最高优先级的类型，从其他类型中移除
        const highestPriorityType = typesWithId[0];
        logger.info(`Keeping duplicate ID ${dupId} in ${highestPriorityType} records`);
        
        // 从其他类型中移除
        for (let i = 1; i < typesWithId.length; i++) {
          const typeToFilter = typesWithId[i];
          logger.info(`Removing duplicate ID ${dupId} from ${typeToFilter} records`);
          
          // 根据类型选择要过滤的数组
          if (typeToFilter === 'production') {
            for (let i = productionInfo.length - 1; i >= 0; i--) {
              if (productionInfo[i].id === dupId) {
                productionInfo.splice(i, 1);
              }
            }
          } else if (typeToFilter === 'logistics') {
            for (let i = logisticsInfo.length - 1; i >= 0; i--) {
              if (logisticsInfo[i].id === dupId) {
                logisticsInfo.splice(i, 1);
              }
            }
          } else if (typeToFilter === 'quality') {
            for (let i = qualityInfo.length - 1; i >= 0; i--) {
              if (qualityInfo[i].id === dupId) {
                qualityInfo.splice(i, 1);
              }
            }
          } else if (typeToFilter === 'retail') {
            for (let i = retailInfo.length - 1; i >= 0; i--) {
              if (retailInfo[i].id === dupId) {
                retailInfo.splice(i, 1);
              }
            }
          } else if (typeToFilter === 'inventory') {
            for (let i = inventoryInfo.length - 1; i >= 0; i--) {
              if (inventoryInfo[i].id === dupId) {
                inventoryInfo.splice(i, 1);
              }
            }
          } else if (typeToFilter === 'environment') {
            for (let i = environmentInfo.length - 1; i >= 0; i--) {
              if (environmentInfo[i].id === dupId) {
                environmentInfo.splice(i, 1);
              }
            }
          }
        }
      }
    }

    // 在返回前统一时间戳格式
    const formattedProduct = formatSingleObject(product);
    const formattedProductionInfo = formatTimestamp(productionInfo);
    const formattedLogisticsInfo = formatTimestamp(logisticsInfo);
    const formattedQualityInfo = formatTimestamp(qualityInfo);
    const formattedRetailInfo = formatTimestamp(retailInfo);
    const formattedInventoryInfo = formatTimestamp(inventoryInfo);
    const formattedEnvironmentInfo = formatTimestamp(environmentInfo);
    
    logger.info('Timestamp formats have been standardized');

    // 组合完整的溯源信息
    const traceInfo = {
      product: formattedProduct,
      productionInfo: formattedProductionInfo,
      processingInfo: [],
      logisticsInfo: formattedLogisticsInfo,
      qualityInfo: formattedQualityInfo,
      retailInfo: formattedRetailInfo,
      inventoryInfo: formattedInventoryInfo,
      environmentInfo: formattedEnvironmentInfo
    };
    
    logger.debug('Sending trace info response');
    res.json(traceInfo);
  } catch (error) {
    logger.error('Failed to get trace information:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// 获取产品溯源历史记录
router.get('/history/:id', async (req, res) => {
  try {
    const history = await fabricClient.queryProductHistory(req.params.id);
    // 格式化历史记录中的时间戳
    const formattedHistory = formatTimestamp(history);
    res.json(formattedHistory);
  } catch (error) {
    logger.error('Failed to get trace history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取产品质量认证信息
router.get('/certifications/:id', async (req, res) => {
  try {
    const certifications = await fabricClient.queryProductCertifications(req.params.id);
    // 格式化认证信息中的时间戳
    const formattedCertifications = formatTimestamp(certifications);
    res.json(formattedCertifications);
  } catch (error) {
    logger.error('Failed to get certifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取产品环境数据
router.get('/environment/:id', async (req, res) => {
  try {
    const environmentData = await fabricClient.queryProductEnvironmentData(req.params.id);
    // 格式化环境数据中的时间戳
    const formattedEnvironmentData = formatTimestamp(environmentData);
    res.json(formattedEnvironmentData);
  } catch (error) {
    logger.error('Failed to get environment data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取产品库存信息
router.get('/inventory/:id', async (req, res) => {
  try {
    const inventoryData = await fabricClient.queryInventoryInfo(req.params.id);
    // 格式化库存数据中的时间戳
    const formattedInventoryData = formatTimestamp(inventoryData);
    res.json(formattedInventoryData);
  } catch (error) {
    logger.error('Failed to get inventory data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 验证产品真实性
router.post('/verify/:id', async (req, res) => {
  try {
    const verificationResult = await fabricClient.verifyProduct(req.params.id);
    // 格式化验证结果中的时间戳
    const formattedResult = formatSingleObject(verificationResult);
    res.json(formattedResult);
  } catch (error) {
    logger.error('Failed to verify product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 