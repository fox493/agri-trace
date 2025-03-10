const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const { logger } = require('./logger');

class FabricClient {
    constructor() {
        this.channelName = process.env.FABRIC_CHANNEL_NAME;
        this.chaincodeName = process.env.FABRIC_CHAINCODE_NAME;
        this.mspId = process.env.FABRIC_MSP_ID;
        this.walletPath = path.join(process.cwd(), process.env.FABRIC_WALLET_PATH || 'wallet');
        this.connectionProfilePath = path.join(process.cwd(), process.env.FABRIC_CONNECTION_PROFILE_PATH || 'connection-profile.json');
        
        // Log configuration
        logger.info('Fabric Client Configuration:', {
            channelName: this.channelName,
            chaincodeName: this.chaincodeName,
            mspId: this.mspId,
            walletPath: this.walletPath,
            connectionProfilePath: this.connectionProfilePath
        });
    }

    async connect() {
        try {
            // 加载连接配置文件
            if (!fs.existsSync(this.connectionProfilePath)) {
                throw new Error(`Connection profile not found at ${this.connectionProfilePath}`);
            }
            const ccp = JSON.parse(fs.readFileSync(this.connectionProfilePath, 'utf8'));

            // 创建钱包实例
            if (!fs.existsSync(this.walletPath)) {
                fs.mkdirSync(this.walletPath, { recursive: true });
            }
            this.wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // 检查管理员身份是否存在
            const identity = await this.wallet.get('admin');
            if (!identity) {
                throw new Error('Admin identity not found in the wallet');
            }

            // 创建网关连接
            this.gateway = new Gateway();
            await this.gateway.connect(ccp, {
                wallet: this.wallet,
                identity: 'admin',
                discovery: { enabled: true, asLocalhost: true },
                eventHandlerOptions: {
                    commitTimeout: 300,
                    strategy: null
                },
                clientTlsIdentity: 'admin',
                tlsInfo: {
                    certificate: identity.credentials.certificate,
                    key: identity.credentials.privateKey
                }
            });

            // 获取通道和合约
            if (!this.channelName) {
                throw new Error('Channel name is required');
            }
            this.network = await this.gateway.getNetwork(this.channelName);
            if (!this.chaincodeName) {
                throw new Error('Chaincode name is required');
            }
            this.contract = this.network.getContract(this.chaincodeName);

            logger.info('Successfully connected to Fabric network');
        } catch (error) {
            logger.error(`Failed to connect to Fabric network: ${error}`);
            throw error;
        }
    }

    async disconnect() {
        if (this.gateway) {
            await this.gateway.disconnect();
        }
    }

    async submitTransaction(fcn, ...args) {
        try {
            if (!this.contract) {
                await this.connect();
            }
            const result = await this.contract.submitTransaction(fcn, ...args);
            return result;
        } catch (error) {
            logger.error(`Failed to submit transaction: ${error}`);
            throw error;
        }
    }

    async evaluateTransaction(fcn, ...args) {
        try {
            if (!this.contract) {
                await this.connect();
            }
            const result = await this.contract.evaluateTransaction(fcn, ...args);
            return result;
        } catch (error) {
            logger.error(`Failed to evaluate transaction: ${error}`);
            throw error;
        }
    }

    // 查询产品信息
    async queryProduct(productId) {
        try {
            const result = await this.evaluateTransaction('QueryProduct', productId);
            if (!result || result.length === 0) {
                return null;
            }
            return JSON.parse(result.toString());
        } catch (error) {
            logger.error(`Failed to query product: ${error}`);
            throw error;
        }
    }

    // 查询产品生产信息
    async queryProductionInfo(productId) {
        try {
            const result = await this.evaluateTransaction('QueryProductionRecords', productId);
            if (!result || result.length === 0) {
                return [];
            }
            
            // 解析数据
            const data = JSON.parse(result.toString());
            const records = Array.isArray(data) ? data : [data];
            
            // 记录所有ID以便调试
            logger.debug(`Production records IDs: ${records.map(r => r.id).join(', ')}`);
            
            // 确保只返回生产记录
            return records.filter(record => {
                // 检查记录结构
                const isProduction = record && 
                       typeof record === 'object' && 
                       'productId' in record && 
                       'type' in record &&
                       'description' in record &&
                       // 检查是否是生产记录类型
                       (record.type === 'PLANTING' || 
                        record.type === 'FERTILIZING' || 
                        record.type === 'HARVESTING');
                
                if (!isProduction) {
                    logger.debug(`Filtered out non-production record: ${JSON.stringify(record)}`);
                }
                
                return isProduction;
            });
        } catch (error) {
            logger.error(`Failed to query production info: ${error}`);
            return [];
        }
    }

    // 查询产品加工信息
    async queryProcessingInfo(productId) {
        // 目前没有专门的加工信息查询方法，返回空数组
        return [];
    }

    // 查询物流信息
    async queryLogisticsByProduct(productId) {
        try {
            const result = await this.evaluateTransaction('QueryLogisticsRecordsByProduct', productId);
            if (!result || result.length === 0) {
                return [];
            }
            
            // 解析数据
            const data = JSON.parse(result.toString());
            const records = Array.isArray(data) ? data : [data];
            
            // 记录所有ID以便调试
            logger.debug(`Logistics records IDs: ${records.map(r => r.id).join(', ')}`);
            
            // 确保只返回物流记录
            return records.filter(record => {
                // 验证记录是物流记录的更严格条件
                const isLogistics = record && 
                       typeof record === 'object' && 
                       'productId' in record && 
                       'status' in record && 
                       'location' in record &&
                       'description' in record &&
                       'recordTime' in record &&
                       // 检查物流状态字段
                       (record.status === 'IN_TRANSIT' || record.status === 'DELIVERED');
                
                if (!isLogistics) {
                    logger.debug(`Filtered out non-logistics record: ${JSON.stringify(record)}`);
                }
                
                return isLogistics;
            });
        } catch (error) {
            logger.error(`Failed to query logistics info: ${error}`);
            return [];
        }
    }

    // 查询质量检测信息
    async queryQualityInfo(productId) {
        try {
            const result = await this.evaluateTransaction('QueryQualityRecords', productId);
            if (!result || result.length === 0) {
                return [];
            }
            
            // 解析数据
            const data = JSON.parse(result.toString());
            const records = Array.isArray(data) ? data : [data];
            
            // 记录所有ID以便调试
            logger.debug(`Quality records IDs: ${records.map(r => r.id).join(', ')}`);
            
            // 排除的前缀列表 - 这些前缀表示零售相关记录（库存记录现在单独处理）
            const retailPrefixes = ['PURCHASE_', 'FEEDBACK_PURCHASE_', 'PRICE_', 'SALE_', 'SALE_PURCHASE_', 'INV_'];
            
            // 确保只返回质量检测记录
            return records.filter(record => {
                // 检查记录是否包含特定于质量检测记录的字段
                const isQuality = record && 
                       typeof record === 'object' && 
                       'productId' in record && 
                       // 质量检测记录特有的字段
                       'testType' in record && 
                       'isQualified' in record && 
                       'stage' in record &&
                       'recordTime' in record;
                
                // 检查ID是否带有零售相关前缀，如果是，则排除
                const isRetailRecord = record && record.id && 
                                    retailPrefixes.some(prefix => 
                                        typeof record.id === 'string' && 
                                        record.id.startsWith(prefix));
                
                if (isRetailRecord) {
                    logger.debug(`Filtered out retail record from quality data: ${record.id}`);
                    return false;
                }
                
                if (!isQuality) {
                    logger.debug(`Filtered out non-quality record: ${JSON.stringify(record)}`);
                }
                
                return isQuality;
            });
        } catch (error) {
            logger.error(`Failed to query quality info: ${error}`);
            return [];
        }
    }

    // 查询零售信息
    async queryRetailInfo(productId) {
        try {
            // 尝试获取所有记录，然后筛选出零售相关记录
            const qualityResult = await this.evaluateTransaction('QueryQualityRecords', productId);
            const logisticsResult = await this.evaluateTransaction('QueryLogisticsRecords', productId);
            const environmentResult = await this.evaluateTransaction('QueryEnvironmentRecords', productId);
            
            let allRecords = [];
            
            if (qualityResult && qualityResult.length > 0) {
                const qualityData = JSON.parse(qualityResult.toString());
                allRecords = allRecords.concat(Array.isArray(qualityData) ? qualityData : [qualityData]);
            }
            
            if (logisticsResult && logisticsResult.length > 0) {
                const logisticsData = JSON.parse(logisticsResult.toString());
                allRecords = allRecords.concat(Array.isArray(logisticsData) ? logisticsData : [logisticsData]);
            }
            
            if (environmentResult && environmentResult.length > 0) {
                const environmentData = JSON.parse(environmentResult.toString());
                allRecords = allRecords.concat(Array.isArray(environmentData) ? environmentData : [environmentData]);
            }
            
            logger.debug(`Total records collected for retail filtering: ${allRecords.length}`);
            logger.debug(`Record IDs before filtering: ${allRecords.map(r => r.id).join(', ')}`);
            
            // 确定哪些记录是零售相关的
            const retailPrefixes = ['PURCHASE_', 'FEEDBACK_PURCHASE_', 'PRICE_', 'SALE_', 'SALE_PURCHASE_', 'INV_'];
            const inventoryPrefixes = ['INV_'];
            const allPrefixes = [...retailPrefixes, ...inventoryPrefixes];
            
            // 筛选零售和库存记录
            const retailRecords = allRecords.filter(record => 
                record && 
                record.id && 
                typeof record.id === 'string' && 
                allPrefixes.some(prefix => record.id.startsWith(prefix)) &&
                record.productId === productId
            );
            
            // 区分库存记录和其他零售记录
            const inventoryRecords = retailRecords.filter(record => 
                inventoryPrefixes.some(prefix => record.id.startsWith(prefix))
            );
            
            const otherRetailRecords = retailRecords.filter(record => 
                !inventoryPrefixes.some(prefix => record.id.startsWith(prefix))
            );
            
            // 详细记录
            logger.info(`Found ${retailRecords.length} total retail/inventory records for product ${productId}`);
            logger.info(`- ${inventoryRecords.length} inventory records`);
            logger.info(`- ${otherRetailRecords.length} other retail records`);
            
            // 记录每条库存记录的详细信息
            if (inventoryRecords.length > 0) {
                logger.debug('Inventory records:');
                inventoryRecords.forEach(r => {
                    logger.debug(`INV record: ${r.id}, fields: ${Object.keys(r).join(', ')}`);
                });
            } else {
                logger.debug('No inventory records found');
            }
            
            // 记录零售记录的来源和ID
            retailRecords.forEach(r => {
                // 尝试确定记录的原始类型
                let recordType = "unknown";
                if ('temperature' in r && 'humidity' in r) {
                    recordType = "environment";
                } else if ('testType' in r && 'isQualified' in r) {
                    recordType = "quality";
                } else if ('status' in r && 'location' in r) {
                    recordType = "logistics";
                } else if (r.id && r.id.startsWith('INV_')) {
                    recordType = "inventory";
                }
                
                logger.debug(`Record ${r.id} appears to be originally from ${recordType} data`);
            });
            
            return retailRecords;
        } catch (error) {
            logger.error(`Failed to query retail info: ${error}`);
            return [];
        }
    }
    
    // 查询专门的库存记录
    async queryInventoryInfo(productId) {
        try {
            // 尝试获取所有记录，然后筛选出库存相关记录
            const qualityResult = await this.evaluateTransaction('QueryQualityRecords', productId);
            const logisticsResult = await this.evaluateTransaction('QueryLogisticsRecords', productId);
            const environmentResult = await this.evaluateTransaction('QueryEnvironmentRecords', productId);
            
            let allRecords = [];
            
            if (qualityResult && qualityResult.length > 0) {
                const qualityData = JSON.parse(qualityResult.toString());
                allRecords = allRecords.concat(Array.isArray(qualityData) ? qualityData : [qualityData]);
            }
            
            if (logisticsResult && logisticsResult.length > 0) {
                const logisticsData = JSON.parse(logisticsResult.toString());
                allRecords = allRecords.concat(Array.isArray(logisticsData) ? logisticsData : [logisticsData]);
            }
            
            if (environmentResult && environmentResult.length > 0) {
                const environmentData = JSON.parse(environmentResult.toString());
                allRecords = allRecords.concat(Array.isArray(environmentData) ? environmentData : [environmentData]);
            }
            
            logger.debug(`Total records collected for inventory filtering: ${allRecords.length}`);
            
            // 筛选库存记录 - 只筛选以INV_开头的ID
            const inventoryRecords = allRecords.filter(record => 
                record && 
                record.id && 
                typeof record.id === 'string' && 
                record.id.startsWith('INV_') &&
                record.productId === productId
            );
            
            logger.info(`Found ${inventoryRecords.length} inventory records for product ${productId}`);
            
            // 记录每条库存记录的详细信息
            if (inventoryRecords.length > 0) {
                logger.debug('Inventory records details:');
                inventoryRecords.forEach(r => {
                    logger.debug(`Inventory record: ${r.id}, fields: ${Object.keys(r).join(', ')}`);
                });
            } else {
                logger.debug('No inventory records found');
            }
            
            return inventoryRecords;
        } catch (error) {
            logger.error(`Failed to query inventory info: ${error}`);
            return [];
        }
    }

    // 查询产品历史
    async queryProductHistory(productId) {
        try {
            const result = await this.evaluateTransaction('QueryProductHistory', productId);
            if (!result || result.length === 0) {
                return [];
            }
            const data = JSON.parse(result.toString());
            return Array.isArray(data) ? data : [data];
        } catch (error) {
            logger.error(`Failed to query product history: ${error}`);
            return [];
        }
    }

    // 查询产品认证
    async queryProductCertifications(productId) {
        // 目前没有专门的认证信息查询方法，返回空数组
        return [];
    }

    // 查询环境数据
    async queryProductEnvironmentData(productId) {
        try {
            // 尝试直接通过链码方法获取
            try {
                const result = await this.evaluateTransaction('QueryEnvironmentRecords', productId);
                if (result && result.length > 0) {
                    // 解析数据
                    const data = JSON.parse(result.toString());
                    const records = Array.isArray(data) ? data : [data];
                    
                    // 记录所有ID以便调试
                    logger.debug(`Environment records IDs (from chain): ${records.map(r => r.id).join(', ')}`);
                    
                    // 排除的前缀列表 - 这些前缀表示零售相关记录（库存记录现在单独处理）
                    const retailPrefixes = ['PURCHASE_', 'FEEDBACK_PURCHASE_', 'PRICE_', 'SALE_', 'SALE_PURCHASE_'];
                    
                    // 确保只返回真正的环境记录
                    const filteredRecords = records.filter(record => {
                        // 检查ID是否带有零售相关前缀，如果是，则排除
                        const isRetailRecord = record && record.id && 
                                             retailPrefixes.some(prefix => 
                                                 typeof record.id === 'string' && 
                                                 record.id.startsWith(prefix));
                        
                        if (isRetailRecord) {
                            logger.debug(`Filtered out retail record from environment data: ${record.id}`);
                            return false;
                        }
                        
                        // 检查记录是否包含特定于环境记录的字段
                        const isEnvironment = record && 
                               typeof record === 'object' && 
                               'productId' in record && 
                               // 环境记录特有的字段，要求非常严格
                               'temperature' in record && 
                               'humidity' in record &&
                               'recordTime' in record && 
                               typeof record.temperature === 'number' &&
                               typeof record.humidity === 'number';
                        
                        if (!isEnvironment) {
                            logger.debug(`Filtered out non-environment record: ${JSON.stringify(record)}`);
                        }
                        
                        return isEnvironment;
                    });
                    
                    // 如果找到有效记录，返回
                    if (filteredRecords.length > 0) {
                        logger.info(`Found ${filteredRecords.length} valid environment records after filtering`);
                        return filteredRecords;
                    } else {
                        logger.info(`No valid environment records found after filtering from ${records.length} total records`);
                    }
                }
            } catch (error) {
                logger.warn(`Failed to query environment records: ${error}`);
                // 继续尝试其他方法
            }
            
            // 目前还没有实际的环境记录，返回空数组
            return [];
        } catch (error) {
            logger.error(`Failed to query environment data: ${error}`);
            return [];
        }
    }

    // 验证产品
    async verifyProduct(productId) {
        try {
            // 简单验证方法：如果产品存在且状态正常则认为验证通过
            const product = await this.queryProduct(productId);
            return {
                verified: !!product,
                product: product,
                message: product ? '产品验证通过' : '产品不存在或已被删除'
            };
        } catch (error) {
            logger.error(`Failed to verify product: ${error}`);
            return {
                verified: false,
                message: '验证过程中发生错误'
            };
        }
    }
}

// 创建单例实例
const fabricClient = new FabricClient();

module.exports = fabricClient; 