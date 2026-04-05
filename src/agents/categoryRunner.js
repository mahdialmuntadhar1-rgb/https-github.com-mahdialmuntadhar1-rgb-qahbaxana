const { createJob, updateJobStatus, incrementSavedCount, completeJob, failJob } = require('../db/jobs');
const { logProgress } = require('../db/progress');
const { fetchFromAllSources } = require('../sources/mergeSources');
const { validateBusiness } = require('../services/validator');
const { normalizeBusiness, createDeduplicationKey } = require('../services/normalizer');
const { findDuplicateBusiness, saveBusiness } = require('../db/businesses');
const CONFIG = require('../config/constants');
const logger = require('../utils/logger');
const { sleep } = require('../utils/sleep');

async function runCategoryCollection(governorate, city, category) {
  let job = null;
  
  try {
    logger.info(`🏃 Starting category collection: ${category} in ${city}, ${governorate}`);
    
    // Create job
    job = await createJob(governorate, city, category);
    await logProgress(job.id, `Started collecting ${category} in ${city}`, 'CREATED');
    
    // Update status to running
    await updateJobStatus(job.id, CONFIG.JOB_STATUS.RUNNING, CONFIG.PROGRESS_STEPS.FETCHING, 'Fetching from sources');
    
    // Fetch from all sources
    logger.info(`📡 Fetching from sources for ${category} in ${city}`);
    const sourceResults = await fetchFromAllSources(governorate, category, city);
    await logProgress(job.id, `Fetched ${sourceResults.total} raw candidates from sources`, 'FETCHING');
    
    if (sourceResults.total === 0) {
      logger.warn(`No businesses found for ${category} in ${city}`);
      await updateJobStatus(job.id, CONFIG.JOB_STATUS.DONE, 100, 'No businesses found');
      await logProgress(job.id, 'No businesses found in any source', 'COMPLETED');
      return { success: true, saved: 0, message: 'No businesses found' };
    }
    
    // Update status to validating
    await updateJobStatus(job.id, CONFIG.JOB_STATUS.RUNNING, CONFIG.PROGRESS_STEPS.VALIDATING, 'Validating businesses');
    
    // Process each business
    let savedCount = 0;
    const targetCount = CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY;
    
    for (let i = 0; i < sourceResults.all.length && savedCount < targetCount; i++) {
      const business = sourceResults.all[i];
      
      try {
        // Validate business
        const validation = validateBusiness(business);
        if (!validation.isValid) {
          logger.debug(`❌ Invalid business: ${business.name} - ${validation.errors.join(', ')}`);
          continue;
        }
        
        // Normalize business
        const normalized = normalizeBusiness(validation.business);
        
        // Check for duplicates
        const deduplicationKey = createDeduplicationKey(normalized);
        const existing = await findDuplicateBusiness(deduplicationKey);
        
        if (existing) {
          logger.debug(`🔄 Duplicate found: ${normalized.name} in ${normalized.city}`);
          continue;
        }
        
        // Save business immediately
        await saveBusiness(normalized, job.id);
        savedCount++;
        
        // Update job count
        await incrementSavedCount(job.id);
        
        logger.info(`✅ Saved business ${savedCount}/${targetCount}: ${normalized.name}`);
        await logProgress(job.id, `Saved business: ${normalized.name} (${savedCount}/${targetCount})`, 'SAVING');
        
        // Update progress
        const progress = Math.min(100, CONFIG.PROGRESS_STEPS.SAVING + (savedCount / targetCount) * 20);
        await updateJobStatus(job.id, CONFIG.JOB_STATUS.RUNNING, progress, 'Saving businesses', null, savedCount);
        
      } catch (error) {
        logger.error(`Error processing business ${business.name}:`, error);
        await logProgress(job.id, `Error processing ${business.name}: ${error.message}`, 'ERROR');
        continue;
      }
    }
    
    // Complete job
    await completeJob(job.id);
    await logProgress(job.id, `Completed: saved ${savedCount}/${targetCount} businesses`, 'COMPLETED');
    
    logger.info(`🎉 Category collection completed: ${category} in ${city} - ${savedCount}/${targetCount} saved`);
    
    return {
      success: true,
      saved: savedCount,
      target: targetCount,
      message: savedCount >= targetCount ? 'Target reached' : 'Sources exhausted'
    };
    
  } catch (error) {
    logger.error(`❌ Category collection failed for ${category} in ${city}:`, error);
    
    if (job) {
      await failJob(job.id, error.message);
      await logProgress(job.id, `Failed: ${error.message}`, 'FAILED');
    }
    
    throw error;
  }
}

module.exports = {
  runCategoryCollection
};
