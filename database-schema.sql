-- Create jobs table for tracking city+category collection
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  target_count INTEGER DEFAULT 10 CHECK (target_count > 0),
  saved_count INTEGER DEFAULT 0 CHECK (saved_count >= 0),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create businesses table for final data
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  source TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('verified', 'pending', 'rejected')),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress_logs table for tracking
CREATE TABLE IF NOT EXISTS progress_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  step TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_governorate ON jobs(governorate);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_governorate_city_category ON jobs(governorate, city, category);

CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_name_city ON businesses(name, city);

-- Add unique constraint to prevent exact duplicates
ALTER TABLE businesses ADD CONSTRAINT unique_business_name_phone 
  UNIQUE (name, phone) 
  WHERE phone IS NOT NULL AND phone != '';

-- Enable RLS (Row Level Security)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access - jobs" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Public read access - businesses" ON businesses
  FOR SELECT USING (true);

CREATE POLICY "Public read access - progress_logs" ON progress_logs
  FOR SELECT USING (true);

-- Service role bypasses RLS for writes
CREATE POLICY "Service insert - jobs" ON jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service update - jobs" ON jobs
  FOR UPDATE USING (true);

CREATE POLICY "Service insert - businesses" ON businesses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service insert - progress_logs" ON progress_logs
  FOR INSERT WITH CHECK (true);
