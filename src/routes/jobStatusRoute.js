const express = require('express');
const { getJobById } = require('../db/jobs');
const { getBusinessesByJob } = require('../db/businesses');
const { getProgressLogs } = require('../db/progress');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/job/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Get job details
    const job = await getJobById(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Get businesses for this job
    const businesses = await getBusinessesByJob(id);
    
    // Get progress logs
    const logs = await getProgressLogs(id);

    const response = {
      success: true,
      job: {
        id: job.id,
        governorate: job.governorate,
        city: job.city,
        category: job.category,
        status: job.status,
        progress: job.progress,
        current_step: job.current_step,
        target_count: job.target_count,
        saved_count: job.saved_count,
        retry_count: job.retry_count,
        error_message: job.error_message,
        created_at: job.created_at,
        updated_at: job.updated_at,
        completed_at: job.completed_at
      },
      businesses: {
        total: businesses.length,
        items: businesses
      },
      logs: {
        total: logs.length,
        items: logs.slice(-20) // Last 20 logs
      },
      progressPercentage: job.target_count > 0 ? (job.saved_count / job.target_count) * 100 : 0
    };

    res.json(response);

  } catch (error) {
    logger.error('Job status route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
