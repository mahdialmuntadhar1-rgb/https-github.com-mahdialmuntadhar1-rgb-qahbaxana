// Simplified system configuration constants
const CONFIG = {
  MAX_CONCURRENT_JOBS: 2,
  MAX_RETRIES: 3,
  SOURCE_DELAY_MS: 3000,
  TARGET_BUSINESSES_PER_CITY_CATEGORY: 10,
  
  // Progress tracking steps
  PROGRESS_STEPS: {
    CREATED: 10,
    FETCHING: 30,
    VALIDATING: 50,
    SAVING: 80,
    COMPLETED: 100
  },
  
  // Job statuses
  JOB_STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    DONE: 'done',
    FAILED: 'failed'
  },
  
  // Business verification statuses
  VERIFICATION_STATUS: {
    VERIFIED: 'verified',
    PENDING: 'pending',
    REJECTED: 'rejected'
  }
};

module.exports = CONFIG;
