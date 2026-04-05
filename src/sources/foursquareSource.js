const axios = require('axios');
const logger = require('../utils/logger');
const { sleep } = require('../utils/sleep');
const CONFIG = require('../config/constants');

async function fetchFromFoursquare(governorate, category, city = null) {
  try {
    const apiKey = process.env.FOURSQUARE_API_KEY;
    
    if (!apiKey) {
      logger.warn('Foursquare API key not provided, skipping Foursquare source');
      return [];
    }
    
    logger.info(`📍 Fetching from Foursquare: ${category} in ${city || governorate}`);
    
    // Map categories to Foursquare categories
    const categoryToId = {
      'restaurants': '4d4b7105d754a06374d81259',
      'hotels': '4bf58dd8d48988d1fa931735',
      'pharmacies': '4bf58dd8d48988d10f951735',
      'supermarkets': '4bf58dd8d48988d118951735',
      'gas stations': '4bf58dd8d48988d113951735',
      'hospitals': '4bf58dd8d48988d196941735',
      'schools': '4bf58dd8d48988d13b951735',
      'banks': '4bf58dd8d48988d10a951735',
      'clothing stores': '4bf58dd8d48988d103951735',
      'electronics stores': '4bf58dd8d48988d122951735',
      'car repair': '4bf58dd8d48988d124951735',
      'beauty salons': '4bf58dd8d48988d110951735',
      'cafes': '4bf58dd8d48988d16d941735',
      'bakeries': '4bf58dd8d48988d16a941735',
      'bookstores': '4bf58dd8d48988d114951735',
      'hardware stores': '4bf58dd8d48988d1a0942d5',
      'jewelry stores': '4bf58dd8d48988d1a0942d5',
      'mobile phone stores': '4bf58dd8d48988d1a0942d5',
      'furniture stores': '4bf58dd8d48988d1a0942d5',
      'fitness centers': '4bf58dd8d48988d1a0942d5'
    };
    
    const categoryId = categoryToId[category.toLowerCase()];
    if (!categoryId) {
      logger.warn(`No Foursquare category mapping for: ${category}`);
      return [];
    }
    
    const url = 'https://api.foursquare.com/v3/places/search';
    
    // Build location string
    const location = city ? `${city}, ${governorate}, Iraq` : `${governorate}, Iraq`;
    
    const params = {
      categories: categoryId,
      near: location,
      limit: CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY * 2,
      fields: 'name,categories,location,phone,address'
    };
    
    const headers = {
      'Authorization': apiKey,
      'accept': 'application/json'
    };
    
    const response = await axios.get(url, { params, headers, timeout: 30000 });
    
    if (!response.data || !response.data.results) {
      logger.warn(`No Foursquare data found for ${category} in ${city || governorate}`);
      return [];
    }
    
    const businesses = response.data.results
      .map(place => ({
        name: place.name,
        category: category,
        governorate: governorate,
        city: place.location?.locality || city || governorate,
        phone: place.phone || null,
        address: place.location?.address || null,
        source: 'foursquare',
        confidence: 0.8 // Foursquare data confidence
      }))
      .slice(0, CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY * 2);
    
    logger.info(`✅ Foursquare returned ${businesses.length} businesses`);
    
    // Rate limiting
    await sleep(CONFIG.SOURCE_DELAY_MS);
    
    return businesses;
  } catch (error) {
    logger.error(`❌ Foursquare fetch failed for ${category} in ${city || governorate}:`, error);
    return []; // Return empty array instead of throwing to avoid breaking the flow
  }
}

module.exports = {
  fetchFromFoursquare
};
