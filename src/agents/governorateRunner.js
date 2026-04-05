const { runCityCollection } = require('./cityRunner');
const CITY_MAP = require('../config/cityMap');
const logger = require('../utils/logger');
const { sleep } = require('../utils/sleep');

async function runGovernorateCollection(governorate, startCity = null) {
  logger.info(`🏛️ Starting governorate collection: ${governorate}`);
  
  const cities = CITY_MAP[governorate];
  if (!cities) {
    throw new Error(`Governorate ${governorate} not found in city map`);
  }
  
  const citiesToRun = startCity 
    ? cities.slice(cities.indexOf(startCity))
    : cities;
  
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    cities: {}
  };
  
  for (const city of citiesToRun) {
    try {
      logger.info(`\n🏙️ Processing city: ${city} in ${governorate}`);
      logger.info('='.repeat(60));
      
      const cityResult = await runCityCollection(governorate, city);
      
      results.cities[city] = cityResult;
      results.successful++;
      results.total += cityResult.total;
      
      logger.info(`✅ Governorate ${governorate} city ${city} completed: ${cityResult.total} businesses`);
      
      // Small delay between cities to avoid rate limiting
      await sleep(3000);
      
    } catch (error) {
      logger.error(`❌ Governorate ${governorate} city ${city} failed:`, error.message);
      
      results.cities[city] = {
        success: false,
        error: error.message
      };
      
      results.failed++;
      
      // Continue with next city even if one fails
      continue;
    }
  }
  
  logger.info(`\n🎉 Governorate collection completed for ${governorate}`);
  logger.info(`📊 Summary: ${results.successful} successful cities, ${results.failed} failed cities, ${results.total} total businesses`);
  
  return results;
}

module.exports = {
  runGovernorateCollection
};
