-- Create table for managing allowed IPs for monitoring endpoints
CREATE TABLE IF NOT EXISTS allowed_monitoring_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  description TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster IP lookups
CREATE INDEX IF NOT EXISTS idx_allowed_monitoring_ips_active 
  ON allowed_monitoring_ips(ip_address) 
  WHERE is_active = TRUE;

-- Insert default IPs
INSERT INTO allowed_monitoring_ips (ip_address, description) VALUES
  ('127.0.0.1', 'localhost'),
  ('::1', 'localhost IPv6'),
  ('::ffff:127.0.0.1', 'localhost IPv4-mapped IPv6'),
  ('146.198.140.69', 'User home/WiFi IP address'),
  ('148.252.147.103', 'User cellular/mobile IP address'),
  ('192.76.8.161', 'Monitoring dashboard IP')
ON CONFLICT (ip_address) DO NOTHING;

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE allowed_monitoring_ips ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage IPs
CREATE POLICY "Service role can manage allowed IPs" 
  ON allowed_monitoring_ips
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE allowed_monitoring_ips IS 'IP whitelist for monitoring endpoints - allows dynamic IP management without server restart';
