const { runCityCollection } = require('./cityRunner');
const logger = require('../utils/logger');
const { sleep } = require('../utils/sleep');

async function runGovernorateCollection(governorate, selectedCategories = null) {
    logger.info(`🏛️ Starting collection for ${governorate}`);
    
    const { CATEGORIES, CITY_MAP } = require('../config');
    const cities = CITY_MAP[governorate] || [];
    const categories = selectedCategories || CATEGORIES;
    
    let totalJobs = 0;
    let completedJobs = 0;
    
    for (const city of cities) {
        for (const category of categories) {
            try {
                totalJobs++;
                await runCityCollection(governorate, city, category);
                completedJobs++;
                logger.info(`✅ Completed ${governorate} - ${city} - ${category} (${completedJobs}/${totalJobs})`);
            } catch (error) {
                logger.error(`❌ Failed ${governorate} - ${city} - ${category}:`, error);
            }
            
            // Small delay between categories
            await sleep(1000);
        }
        
        // Delay between cities
        await sleep(2000);
    }
    
    logger.info(`� Completed collection for ${governorate}: ${completedJobs}/${totalJobs} jobs`);
    return { totalJobs, completedJobs };
}

module.exports = {
    runGovernorateCollection
};
