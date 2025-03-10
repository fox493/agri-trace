const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { logger } = require('./utils/logger');
const morgan = require('morgan');
const auth = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Log environment variables for debugging
logger.info('Environment Variables:', {
    FABRIC_CHANNEL_NAME: process.env.FABRIC_CHANNEL_NAME,
    FABRIC_CHAINCODE_NAME: process.env.FABRIC_CHAINCODE_NAME,
    FABRIC_MSP_ID: process.env.FABRIC_MSP_ID,
    FABRIC_WALLET_PATH: process.env.FABRIC_WALLET_PATH,
    FABRIC_CONNECTION_PROFILE_PATH: process.env.FABRIC_CONNECTION_PROFILE_PATH
});

const fabricClient = require('./utils/fabric');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const qualityRoutes = require('./routes/quality');
const logisticsRoutes = require('./routes/logistics');
const retailRoutes = require('./routes/retail');
const consumerRoutes = require('./routes/consumer');
const traceRoutes = require('./routes/trace');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/farms', auth, require('./routes/farms'));
app.use('/api/environment', auth, require('./routes/environment'));
app.use('/api/quality', qualityRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/retail', retailRoutes);
app.use('/api/consumer', consumerRoutes);
app.use('/api/trace', traceRoutes);

// Initialize Fabric client
(async () => {
  try {
    await fabricClient.connect();
    logger.info('Fabric client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Fabric client:', error);
    process.exit(1);
  }
})();

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agritrace', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
}); 