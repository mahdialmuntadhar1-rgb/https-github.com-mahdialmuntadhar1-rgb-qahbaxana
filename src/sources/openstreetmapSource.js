const axios = require('axios');
const logger = require('../utils/logger');
const { sleep } = require('../utils/sleep');
const CONFIG = require('../config/constants');

async function fetchFromOpenStreetMap(governorate, category, city = null) {
  try {
    logger.info(`🗺️ Fetching from OpenStreetMap: ${category} in ${city || governorate}`);
    
    // Map categories to OSM tags
    const categoryToTag = {
      'restaurants': 'amenity=restaurant',
      'hotels': 'tourism=hotel',
      'pharmacies': 'amenity=pharmacy',
      'supermarkets': 'shop=supermarket',
      'gas stations': 'amenity=fuel',
      'hospitals': 'amenity=hospital',
      'schools': 'amenity=school',
      'banks': 'amenity=bank',
      'clothing stores': 'shop=clothes',
      'electronics stores': 'shop=electronics',
      'car repair': 'shop=car_repair',
      'beauty salons': 'shop=beauty',
      'cafes': 'amenity=cafe',
      'bakeries': 'shop=bakery',
      'bookstores': 'shop=books',
      'hardware stores': 'shop=hardware',
      'jewelry stores': 'shop=jewelry',
      'mobile phone stores': 'shop=mobile_phone',
      'furniture stores': 'shop=furniture',
      'fitness centers': 'leisure=fitness_centre'
    };
    
    const tag = categoryToTag[category.toLowerCase()];
    if (!tag) {
      logger.warn(`No OSM tag mapping for category: ${category}`);
      return [];
    }
    
    // Build location filter
    let locationFilter = '';
    if (city) {
      locationFilter = `["name"="${city}"] -> .searchArea;`;
    } else {
      locationFilter = `["name"="${governorate}"] -> .searchArea;`;
    }
    
    // Overpass API query
    const query = `
      [out:json][timeout:25];
      (
        area${locationFilter}
        node[${tag}](area.searchArea);
        way[${tag}](area.searchArea);
        relation[${tag}](area.searchArea);
      );
      out geom;
    `;
    
    const url = 'https://overpass-api.de/api/interpreter';
    const response = await axios.post(url, query, {
      headers: { 'Content-Type': 'text/plain' },
      timeout: 30000
    });
    
    if (!response.data || !response.data.elements) {
      logger.warn(`No OSM data found for ${category} in ${city || governorate}`);
      return [];
    }
    
    const businesses = response.data.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => ({
        name: element.tags.name,
        category: category,
        governorate: governorate,
        city: element.tags['addr:city'] || city || governorate,
        phone: element.tags.phone || null,
        address: element.tags['addr:street'] || null,
        source: 'openstreetmap',
        confidence: 0.6 // OSM data confidence
      }))
      .slice(0, CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY * 2);
    
    logger.info(`✅ OpenStreetMap returned ${businesses.length} businesses`);
    
    // Rate limiting
    await sleep(CONFIG.SOURCE_DELAY_MS);
    
    return businesses;
  } catch (error) {
    logger.error(`❌ OpenStreetMap fetch failed for ${category} in ${city || governorate}:`, error);
    return []; // Return empty array instead of throwing to avoid breaking the flow
  }
}

module.exports = {
  fetchFromOpenStreetMap
};
