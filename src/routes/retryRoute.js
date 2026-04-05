const express = require('express');
const { retryJob, retryFailedJobs } = require('../db/jobs');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/retry-failed - Retry all failed jobs
router.post('/retry-failed', async (req, res) => {
    try {
        const retried = await retryFailedJobs();
        
        logger.info(`🔄 Retried ${retried} failed jobs`);
        
        res.json({
            success: true,
            message: `Retried ${retried} failed jobs`,
            retried
        });
        
    } catch (error) {
        logger.error('Failed to retry failed jobs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retry failed jobs'
        });
    }
});

// POST /api/retry-job/:id - Retry specific job
router.post('/retry-job/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Job ID is required'
            });
        }
        
        const success = await retryJob(id);
        
        if (success) {
            logger.info(`🔄 Retried job: ${id}`);
            res.json({
                success: true,
                message: 'Job retry initiated'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Job not found or cannot be retried'
            });
        }
        
    } catch (error) {
        logger.error('Failed to retry job:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retry job'
        });
    }
});

module.exports = router;
