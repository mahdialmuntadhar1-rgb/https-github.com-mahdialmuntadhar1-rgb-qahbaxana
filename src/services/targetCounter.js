const { getBusinessCountForCityCategory } = require('../db/businesses');
const CONFIG = require('../config/constants');
const logger = require('../utils/logger');

async function checkTargetReached(city, category) {
  try {
    const currentCount = await getBusinessCountForCityCategory(city, category);
    const targetCount = CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY;
    
    const reached = currentCount >= targetCount;
    const remaining = Math.max(0, targetCount - currentCount);
    
    logger.debug(`📊 ${category} in ${city}: ${currentCount}/${targetCount} (${remaining} remaining)`);
    
    return {
      reached,
      current: currentCount,
      target: targetCount,
      remaining
    };
  } catch (error) {
    logger.error('Check target reached error:', error);
    return {
      reached: false,
      current: 0,
      target: CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY,
      remaining: CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY
    };
  }
}

async function getProgressPercentage(city, category) {
  const status = await checkTargetReached(city, category);
  return Math.min(100, (status.current / status.target) * 100);
}

module.exports = {
  checkTargetReached,
  getProgressPercentage
};
