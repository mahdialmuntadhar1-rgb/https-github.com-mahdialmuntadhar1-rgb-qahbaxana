const { getRunningJobs } = require('../db/jobs');
const { runCategoryCollection } = require('./categoryRunner');
const logger = require('../utils/logger');

async function resumeInterruptedJobs() {
  try {
    logger.info('🔄 Checking for interrupted jobs...');
    
    const runningJobs = await getRunningJobs();
    
    if (runningJobs.length === 0) {
      logger.info('✅ No interrupted jobs found');
      return { resumed: 0, failed: 0 };
    }
    
    logger.info(`Found ${runningJobs.length} interrupted jobs, resuming...`);
    
    const results = {
      resumed: 0,
      failed: 0,
      details: []
    };
    
    for (const job of runningJobs) {
      try {
        logger.info(`🔄 Resuming job: ${job.governorate} - ${job.city} - ${job.category} (ID: ${job.id})`);
        
        // Re-run the category collection with the same parameters
        await runCategoryCollection(job.governorate, job.city, job.category);
        
        results.resumed++;
        results.details.push({
          jobId: job.id,
          governorate: job.governorate,
          city: job.city,
          category: job.category,
          status: 'resumed'
        });
        
        logger.info(`✅ Successfully resumed job ${job.id}`);
      } catch (error) {
        logger.error(`❌ Failed to resume job ${job.id}:`, error.message);
        
        results.failed++;
        results.details.push({
          jobId: job.id,
          governorate: job.governorate,
          city: job.city,
          category: job.category,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    logger.info(`✅ Job resumption completed: ${results.resumed} resumed, ${results.failed} failed`);
    
    return results;
  } catch (error) {
    logger.error('❌ Job resumption system failed:', error);
    return { resumed: 0, failed: 0, error: error.message };
  }
}

module.exports = {
  resumeInterruptedJobs
};
