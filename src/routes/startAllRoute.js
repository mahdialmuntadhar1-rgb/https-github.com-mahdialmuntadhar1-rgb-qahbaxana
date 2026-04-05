const express = require('express');
const { runGovernorateCollection } = require('../agents/governorateRunner');
const GOVERNORATES = require('../config/governorates');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/start-all', async (req, res) => {
  try {
    logger.info(`📥 Received start-all request for all governorates`);
    
    // Run all governorates in background (fire and forget)
    (async () => {
      const results = {
        total: 0,
        successful: 0,
        failed: 0,
        governorates: {}
      };
      
      for (const governorate of GOVERNORATES) {
        try {
          logger.info(`🏛️ Starting governorate: ${governorate}`);
          
          const governorateResult = await runGovernorateCollection(governorate);
          
          results.governorates[governorate] = governorateResult;
          results.successful++;
          results.total += governorateResult.total;
          
          logger.info(`✅ Governorate ${governorate} completed: ${governorateResult.total} businesses`);
          
        } catch (error) {
          logger.error(`❌ Governorate ${governorate} failed:`, error.message);
          
          results.governorates[governorate] = {
            success: false,
            error: error.message
          };
          
          results.failed++;
        }
      }
      
      logger.info(`🎉 All governorates completed: ${results.successful} successful, ${results.failed} failed, ${results.total} total businesses`);
    })();
    
    res.json({
      success: true,
      message: 'All governorates collection started',
      status: 'running',
      governorateCount: GOVERNORATES.length,
      note: 'This will run through all 18 governorates sequentially in the background. Expected duration: Several hours.'
    });

  } catch (error) {
    logger.error('Start all route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
