const express = require('express');
const { getRecentLogs } = require('../db/progress');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/activity - Get activity log
router.get('/activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await getRecentLogs(limit);
        
        res.json({
            success: true,
            logs,
            count: logs.length
        });
        
    } catch (error) {
        logger.error('Failed to fetch activity log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity log',
            logs: []
        });
    }
});

module.exports = router;
