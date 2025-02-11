const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { logger } = require('./utils/logger');
const morgan = require('morgan');
const { authMiddleware } = require('./utils/auth');
const fabricClient = require('./utils/fabric');
const productsRouter = require('./routes/products');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/products', authMiddleware, productsRouter);
app.use('/api/farms', authMiddleware, require('./routes/farms'));
app.use('/api/logistics', authMiddleware, require('./routes/logistics'));
app.use('/api/trace', authMiddleware, require('./routes/trace'));

// Initialize Fabric client
(async () => {
  try {
    await fabricClient.init();
    console.log('Fabric client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Fabric client:', error);
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