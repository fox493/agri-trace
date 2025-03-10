/**
 * 清空MongoDB数据库脚本
 * 运行方法: node scripts/clearDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { logger } = require('../src/utils/logger');

async function clearDatabase() {
  try {
    // 连接到MongoDB
    logger.info('正在连接MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agritrace', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB连接成功');

    // 获取所有集合
    const collections = await mongoose.connection.db.collections();
    
    // 清空每个集合
    logger.info(`开始清空数据库中的 ${collections.length} 个集合...`);
    for (const collection of collections) {
      const name = collection.collectionName;
      await collection.deleteMany({});
      logger.info(`已清空集合: ${name}`);
    }
    
    logger.info('数据库清空完成');
    
  } catch (error) {
    logger.error('清空数据库时出错:', error);
  } finally {
    // 关闭连接
    await mongoose.connection.close();
    logger.info('MongoDB连接已关闭');
    process.exit(0);
  }
}

clearDatabase(); 