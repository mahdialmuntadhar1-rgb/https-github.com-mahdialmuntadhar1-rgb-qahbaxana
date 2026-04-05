const express = require('express');
const { getRecentBusinesses } = require('../db/businesses');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/results - Get recent businesses
router.get('/results', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const businesses = await getRecentBusinesses(limit);
        
        res.json({
            success: true,
            businesses,
            count: businesses.length
        });
        
    } catch (error) {
        logger.error('Failed to fetch recent businesses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent businesses',
            businesses: []
        });
    }
});

module.exports = router;
