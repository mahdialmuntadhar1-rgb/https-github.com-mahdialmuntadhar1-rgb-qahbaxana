const { supabase } = require('./supabase');
const CONFIG = require('../config/constants');
const logger = require('../utils/logger');

async function createJob(governorate, city, category) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        governorate,
        city,
        category,
        status: CONFIG.JOB_STATUS.PENDING,
        target_count: CONFIG.TARGET_BUSINESSES_PER_CITY_CATEGORY,
        saved_count: 0,
        current_step: 'Created'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Create job error:', error);
    throw error;
  }
}

async function updateJobStatus(jobId, status, progress = null, currentStep = null, errorMessage = null, savedCount = null) {
  try {
    const updateData = { status };
    
    if (progress !== null) updateData.progress = progress;
    if (currentStep !== null) updateData.current_step = currentStep;
    if (errorMessage !== null) updateData.error_message = errorMessage;
    if (savedCount !== null) updateData.saved_count = savedCount;
    
    if (status === CONFIG.JOB_STATUS.DONE || status === CONFIG.JOB_STATUS.FAILED) {
      updateData.completed_at = new Date().toISOString();
    }
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Update job status error:', error);
    throw error;
  }
}

async function incrementSavedCount(jobId) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        saved_count: supabase.rpc('increment', { x: 'saved_count' }),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Increment saved count error:', error);
    throw error;
  }
}

async function getJobById(jobId) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Get job by ID error:', error);
    throw error;
  }
}

async function getRunningJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .in('status', [CONFIG.JOB_STATUS.PENDING, CONFIG.JOB_STATUS.RUNNING])
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get running jobs error:', error);
    return [];
  }
}

async function getPendingJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', CONFIG.JOB_STATUS.PENDING)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get pending jobs error:', error);
    return [];
  }
}

async function incrementRetryCount(jobId) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        retry_count: supabase.rpc('increment', { x: 'retry_count' }),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Increment retry count error:', error);
    throw error;
  }
}

async function completeJob(jobId) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        status: CONFIG.JOB_STATUS.DONE,
        progress: 100,
        current_step: 'Completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Complete job error:', error);
    throw error;
  }
}

async function failJob(jobId, errorMessage) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        status: CONFIG.JOB_STATUS.FAILED,
        current_step: 'Failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Fail job error:', error);
    throw error;
  }
}

async function getFailedJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'failed')
      .order('updated_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get failed jobs error:', error);
    return [];
  }
}

async function retryFailedJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'pending', 
        retry_count: supabase.raw('retry_count + 1'),
        error_message: null 
      })
      .eq('status', 'failed')
      .lt('retry_count', 3);
    
    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    logger.error('Retry failed jobs error:', error);
    return 0;
  }
}

async function retryJob(jobId) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'pending', 
        retry_count: supabase.raw('retry_count + 1'),
        error_message: null 
      })
      .eq('id', jobId)
      .eq('status', 'failed')
      .lt('retry_count', 3)
      .single();
    
    if (error) throw error;
    return !!data;
  } catch (error) {
    logger.error('Retry job error:', error);
    return false;
  }
}

module.exports = {
  createJob,
  updateJobStatus,
  incrementSavedCount,
  getJobById,
  getRunningJobs,
  getPendingJobs,
  incrementRetryCount,
  completeJob,
  failJob,
  getFailedJobs,
  retryFailedJobs,
  retryJob
};
