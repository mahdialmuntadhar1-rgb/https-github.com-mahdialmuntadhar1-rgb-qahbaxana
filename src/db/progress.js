const { supabase } = require('./supabase');
const logger = require('../utils/logger');

async function logProgress(jobId, message, step = null) {
  try {
    const { data, error } = await supabase
      .from('progress_logs')
      .insert({
        job_id: jobId,
        message,
        step
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Log progress error:', error);
    // Don't throw error - logging should not break the main flow
    return null;
  }
}

async function getProgressLogs(jobId) {
  try {
    const { data, error } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get progress logs error:', error);
    return [];
  }
}

module.exports = {
  logProgress,
  getProgressLogs
};
