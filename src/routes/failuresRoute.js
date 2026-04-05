const express = require('express');
const { getFailedJobs } = require('../db/jobs');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/failures - Get failed jobs
router.get('/failures', async (req, res) => {
    try {
        const failedJobs = await getFailedJobs();
        
        res.json({
            success: true,
            jobs: failedJobs,
            count: failedJobs.length
        });
        
    } catch (error) {
        logger.error('Failed to fetch failed jobs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch failed jobs',
            jobs: []
        });
    }
});

module.exports = router;
