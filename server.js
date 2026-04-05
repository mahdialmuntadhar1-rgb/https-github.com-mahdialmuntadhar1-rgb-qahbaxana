require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { resumeInterruptedJobs } = require('./src/agents/resumeInterruptedJobs');
const { testConnection } = require('./src/db/supabase');
const queueManager = require('./src/services/queueManager');
const logger = require('./src/utils/logger');

// Import routes
const startGovernorateRoute = require('./src/routes/startGovernorateRoute');
const startAllRoute = require('./src/routes/startAllRoute');
const jobStatusRoute = require('./src/routes/jobStatusRoute');
const dashboardRoute = require('./src/routes/dashboardRoute');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dashboard directory
app.use(express.static(path.join(__dirname, 'dashboard')));

// Register API routes
app.use('/api', startGovernorateRoute);
app.use('/api', startAllRoute);
app.use('/api', jobStatusRoute);
app.use('/api', dashboardRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    queue: queueManager.getQueueStatus()
  });
});

// Root endpoint - serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'StartFresh Iraqi Business Collection System',
    version: '2.0.0',
    description: 'Simplified backend system for Iraqi business data collection',
    endpoints: {
      'POST /api/start-governorate': 'Start collection for one governorate',
      'POST /api/start-all': 'Start collection for all governorates',
      'GET /api/job/:id': 'Get job status and progress',
      'GET /api/dashboard': 'Get dashboard overview',
      'GET /api/dashboard/summary': 'Get summary by location',
      'GET /health': 'Health check and queue status'
    }
  });
});

// Initialize server
async function initializeServer() {
  try {
    logger.info('🚀 Initializing StartFresh Iraqi Business Collection System...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Initialize queue manager
    await queueManager.initialize();
    
    // Resume interrupted jobs
    logger.info('🔄 Checking for interrupted jobs...');
    const resumeResults = await resumeInterruptedJobs();
    
    if (resumeResults.resumed > 0) {
      logger.info(`✅ Resumed ${resumeResults.resumed} interrupted jobs`);
    } else {
      logger.info('✅ No interrupted jobs to resume');
    }
    
    logger.info('✅ Server initialization completed');
    
  } catch (error) {
    logger.error('❌ Server initialization failed:', error);
    // Don't exit the process, just log the error
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🤖 StartFresh Iraqi Business Collection System running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🚀 Available endpoints:`);
  console.log(`  POST /api/start-governorate - Start one governorate`);
  console.log(`  POST /api/start-all - Start all governorates`);
  console.log(`  GET /api/job/:id - Get job status`);
  console.log(`  GET /api/dashboard - View progress dashboard`);
  console.log(`  GET /health - Health check`);
  
  // Initialize server components
  await initializeServer();
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
