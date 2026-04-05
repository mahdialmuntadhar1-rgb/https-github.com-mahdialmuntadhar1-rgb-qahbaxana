const express = require('express');
const { runGovernorateCollection } = require('../agents/governorateRunner');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/start-governorate', async (req, res) => {
  try {
    const { governorate, startCity } = req.body;

    // Validate input
    if (!governorate) {
      return res.status(400).json({
        success: false,
        error: 'Governorate is required'
      });
    }

    if (typeof governorate !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Governorate must be a string'
      });
    }

    logger.info(`📥 Received governorate start request: ${governorate}`);
    
    // Run governorate collection in background (fire and forget)
    runGovernorateCollection(governorate, startCity)
      .then(result => {
        logger.info(`✅ Governorate collection completed: ${governorate} - ${result.total} businesses`);
      })
      .catch(error => {
        logger.error(`❌ Governorate collection failed: ${governorate}:`, error);
      });

    res.json({
      success: true,
      message: `Governorate collection started for ${governorate}`,
      status: 'running',
      governorate,
      startCity: startCity || null,
      note: 'This will run through all cities and categories sequentially in the background'
    });

  } catch (error) {
    logger.error('Start governorate route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
