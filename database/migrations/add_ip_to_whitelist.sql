-- Add IP 192.76.8.181 to monitoring whitelist
-- This IP was denied access and needs to be added

INSERT INTO allowed_monitoring_ips (ip_address, description, is_active)
VALUES ('192.76.8.181', 'Added from access denied error - monitoring access', true)
ON CONFLICT (ip_address) 
DO UPDATE SET 
  is_active = true,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the IP was added
SELECT ip_address, description, is_active, added_at, last_used_at
FROM allowed_monitoring_ips
WHERE ip_address = '192.76.8.181';

