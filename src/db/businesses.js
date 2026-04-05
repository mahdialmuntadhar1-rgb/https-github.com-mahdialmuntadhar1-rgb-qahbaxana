const { supabase } = require('./supabase');
const logger = require('../utils/logger');

async function findDuplicateBusiness(normalizedKey) {
  try {
    // For exact match, check name and phone
    if (normalizedKey.includes('|') && normalizedKey.split('|').length === 3) {
      const [name, city, phone] = normalizedKey.split('|');
      
      let query = supabase.from('businesses').select('*');
      
      if (phone && phone !== 'null') {
        // Prefer phone matching for exact duplicates
        query = query.eq('phone', phone);
      } else {
        // Fall back to name + city matching
        query = query.eq('name', name).eq('city', city);
      }
      
      const { data, error } = await query.limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    }
    
    return null;
  } catch (error) {
    logger.error('Find duplicate business error:', error);
    return null;
  }
}

async function saveBusiness(business, jobId) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        governorate: business.governorate,
        city: business.city,
        category: business.category,
        name: business.name,
        phone: business.phone || null,
        address: business.address || null,
        source: business.source,
        confidence: business.confidence || 0.5,
        verification_status: 'verified',
        job_id: jobId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Save business error:', error);
    throw error;
  }
}

async function getBusinessesByJob(jobId) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get businesses by job error:', error);
    return [];
  }
}

async function getBusinessCountForCityCategory(city, category) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('count', { count: 'exact' })
      .eq('city', city)
      .eq('category', category);

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    logger.error('Get business count error:', error);
    return 0;
  }
}

module.exports = {
  findDuplicateBusiness,
  saveBusiness,
  getBusinessesByJob,
  getBusinessCountForCityCategory
};
