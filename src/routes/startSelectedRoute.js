const express = require('express');
const { runGovernorateCollection } = require('../agents/governorateRunner');
const logger = require('../utils/logger');
const queueManager = require('../services/queueManager');

const router = express.Router();

// POST /api/start-selected - Start selected governorates with selected categories
router.post('/start-selected', async (req, res) => {
    try {
        const { governorates, categories } = req.body;
        
        // Validation
        if (!governorates || !Array.isArray(governorates) || governorates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please select at least one governorate'
            });
        }
        
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please select at least one category'
            });
        }
        
        logger.info(`🚀 Starting selected collection: ${governorates.length} governorates, ${categories.length} categories`);
        
        // Start collection for each selected governorate with selected categories
        const results = [];
        
        for (const governorate of governorates) {
            try {
                // Add to queue with selected categories
                const jobId = await queueManager.addJob({
                    governorate,
                    categories, // Pass selected categories
                    type: 'selected-collection'
                });
                
                // Start collection in background
                runGovernorateCollection(governorate, categories).catch(error => {
                    logger.error(`Failed to start collection for ${governorate}:`, error);
                });
                
                results.push({
                    governorate,
                    jobId,
                    status: 'started',
                    categories: categories.length
                });
                
            } catch (error) {
                logger.error(`Failed to queue ${governorate}:`, error);
                results.push({
                    governorate,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        const successCount = results.filter(r => r.status === 'started').length;
        
        res.json({
            success: true,
            message: `Started collection for ${successCount} governorates with ${categories.length} categories each`,
            results,
            started: successCount,
            failed: governorates.length - successCount
        });
        
    } catch (error) {
        logger.error('Start selected error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start selected collection'
        });
    }
});

module.exports = router;
