const { saveBusiness } = require('../db/businesses');
const { incrementSavedCount, updateJobStatus } = require('../db/jobs');
const { logProgress } = require('../db/progress');
const logger = require('../utils/logger');

async function saveBusinessImmediate(business, jobId) {
  try {
    // Save business immediately
    const savedBusiness = await saveBusiness(business, jobId);
    
    // Update job count
    await incrementSavedCount(jobId);
    
    // Log the save
    await logProgress(jobId, `Saved business: ${business.name}`, 'SAVED');
    
    logger.info(`💾 Saved business: ${business.name} (ID: ${savedBusiness.id})`);
    
    return savedBusiness;
  } catch (error) {
    logger.error(`Failed to save business ${business.name}:`, error);
    await logProgress(jobId, `Failed to save ${business.name}: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function updateJobProgress(jobId, savedCount, totalTarget) {
  try {
    const progress = Math.min(100, (savedCount / totalTarget) * 100);
    
    await updateJobStatus(jobId, 'running', progress, 'Saving businesses', null, savedCount);
    
    logger.debug(`📈 Job ${jobId} progress: ${savedCount}/${totalTarget} (${progress.toFixed(1)}%)`);
    
    return progress;
  } catch (error) {
    logger.error('Failed to update job progress:', error);
    throw error;
  }
}

module.exports = {
  saveBusinessImmediate,
  updateJobProgress
};
