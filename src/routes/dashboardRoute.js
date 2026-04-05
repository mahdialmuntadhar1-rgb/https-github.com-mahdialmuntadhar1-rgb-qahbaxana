const express = require('express');
const { getRunningJobs } = require('../db/jobs');
const { getBusinessesByJob } = require('../db/businesses');
const { getProgressLogs } = require('../db/progress');
const GOVERNORATES = require('../config/governorates');
const CATEGORIES = require('../config/categories');
const CITY_MAP = require('../config/cityMap');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    // Get all running jobs
    const runningJobs = await getRunningJobs();
    
    // Get detailed info for each job
    const jobsWithDetails = await Promise.all(
      runningJobs.map(async (job) => {
        const businesses = await getBusinessesByJob(job.id);
        const logs = await getProgressLogs(job.id);
        
        return {
          ...job,
          businessesCount: businesses.length,
          recentLogs: logs.slice(-5) // Last 5 logs
        };
      })
    );
    
    // Calculate overall stats
    const stats = {
      totalJobs: runningJobs.length,
      runningJobs: runningJobs.filter(j => j.status === 'running').length,
      pendingJobs: runningJobs.filter(j => j.status === 'pending').length,
      totalBusinesses: jobsWithDetails.reduce((sum, job) => sum + job.businessesCount, 0)
    };
    
    res.json({
      success: true,
      stats,
      jobs: jobsWithDetails,
      availableGovernorates: GOVERNORATES,
      availableCategories: CATEGORIES,
      cityMap: CITY_MAP
    });

  } catch (error) {
    logger.error('Dashboard route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

router.get('/dashboard/summary', async (req, res) => {
  try {
    const runningJobs = await getRunningJobs();
    
    // Group jobs by governorate and city
    const jobsByLocation = {};
    
    runningJobs.forEach(job => {
      const key = `${job.governorate}|${job.city}`;
      if (!jobsByLocation[key]) {
        jobsByLocation[key] = {
          governorate: job.governorate,
          city: job.city,
          categories: {},
          totalSaved: 0,
          totalTarget: 0
        };
      }
      
      jobsByLocation[key].categories[job.category] = {
        status: job.status,
        saved: job.saved_count,
        target: job.target_count,
        progress: (job.saved_count / job.target_count) * 100
      };
      
      jobsByLocation[key].totalSaved += job.saved_count;
      jobsByLocation[key].totalTarget += job.target_count;
    });
    
    res.json({
      success: true,
      locations: Object.values(jobsByLocation),
      totalLocations: Object.keys(jobsByLocation).length
    });

  } catch (error) {
    logger.error('Dashboard summary route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
