const winston = require('winston');

// 定义日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// 创建logger实例
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // 写入所有日志到 combined.log
        new winston.transports.File({ filename: 'logs/combined.log' }),
        // 写入错误日志到 error.log
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // 开发环境下同时输出到控制台
        ...(process.env.NODE_ENV !== 'production'
            ? [new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })]
            : [])
    ]
});

module.exports = {
    logger
}; 