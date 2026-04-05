const { fetchFromOpenStreetMap } = require('./openstreetmapSource');
const { fetchFromFoursquare } = require('./foursquareSource');
const logger = require('../utils/logger');
const CONFIG = require('../config/constants');

async function fetchFromAllSources(governorate, category, city = null) {
  const results = {
    openstreetmap: [],
    foursquare: [],
    all: [],
    total: 0
  };
  
  try {
    // Fetch from OpenStreetMap
    try {
      results.openstreetmap = await fetchFromOpenStreetMap(governorate, category, city);
      logger.info(`OpenStreetMap: ${results.openstreetmap.length} businesses`);
    } catch (error) {
      logger.error('OpenStreetMap source failed:', error);
    }
    
    // Fetch from Foursquare
    try {
      results.foursquare = await fetchFromFoursquare(governorate, category, city);
      logger.info(`Foursquare: ${results.foursquare.length} businesses`);
    } catch (error) {
      logger.error('Foursquare source failed:', error);
    }
    
    // Merge all results
    results.all = [
      ...results.openstreetmap,
      ...results.foursquare
    ];
    
    results.total = results.all.length;
    
    logger.info(`📊 All sources combined: ${results.total} businesses (${results.openstreetmap.length} OSM, ${results.foursquare.length} Foursquare)`);
    
    return results;
  } catch (error) {
    logger.error('Critical error in source merging:', error);
    throw error;
  }
}

function removeObviousDuplicates(businesses) {
  const seen = new Set();
  const deduplicated = [];
  
  for (const business of businesses) {
    // Create a simple key for obvious duplicates
    const key = `${business.name.toLowerCase().trim()}|${business.city.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(business);
    } else {
      logger.debug(`Removed obvious duplicate: ${business.name}`);
    }
  }
  
  logger.info(`Removed ${businesses.length - deduplicated.length} obvious duplicates`);
  
  return deduplicated.slice(0, CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY * 3); // Get more than needed for filtering
}

module.exports = {
  fetchFromAllSources,
  removeObviousDuplicates
};
