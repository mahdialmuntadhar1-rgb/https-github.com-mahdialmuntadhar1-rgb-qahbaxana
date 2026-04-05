const { runCategoryCollection } = require('./categoryRunner');
const CATEGORIES = require('../config/categories');
const logger = require('../utils/logger');
const { sleep } = require('../utils/sleep');

async function runCityCollection(governorate, city) {
  logger.info(`🏙️ Starting city collection: ${city} in ${governorate}`);
  
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    categories: {}
  };
  
  for (const category of CATEGORIES) {
    try {
      logger.info(`\n📍 ${city} → ${category}`);
      logger.info('='.repeat(50));
      
      const categoryResult = await runCategoryCollection(governorate, city, category);
      
      results.categories[category] = {
        success: true,
        saved: categoryResult.saved,
        target: categoryResult.target,
        message: categoryResult.message
      };
      
      results.successful++;
      results.total += categoryResult.saved;
      
      logger.info(`✅ Completed ${category}: ${categoryResult.saved}/${categoryResult.target} businesses saved`);
      
      // Small delay between categories to avoid rate limiting
      await sleep(2000);
      
    } catch (error) {
      logger.error(`❌ Failed ${category}:`, error.message);
      
      results.categories[category] = {
        success: false,
        error: error.message
      };
      
      results.failed++;
      
      // Continue with next category even if one fails
      continue;
    }
  }
  
  logger.info(`\n🎉 City collection completed for ${city}`);
  logger.info(`📊 Summary: ${results.successful} successful, ${results.failed} failed, ${results.total} total businesses`);
  
  return results;
}

module.exports = {
  runCityCollection
};
