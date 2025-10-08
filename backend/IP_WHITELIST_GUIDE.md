# IP Whitelist Management Guide

## Overview

The monitoring endpoints are now protected by a **database-backed IP whitelist** that allows you to add/remove IPs dynamically **without restarting the server**.

## Features

✅ **No Server Restart Required** - Changes take effect within 5 minutes automatically, or instantly via API  
✅ **Database Backed** - All IPs stored in Supabase for persistence  
✅ **Auto-Reload** - Syncs from database every 5 minutes  
✅ **Usage Tracking** - Records when each IP last accessed monitoring  
✅ **Soft Delete** - IPs can be deactivated without losing history  
✅ **Admin API** - Manage IPs programmatically via REST endpoints  

---

## Initial Setup

### Step 1: Create the Database Table

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the SQL from `backend/create_allowed_ips_table.sql`

This will:
- Create the `allowed_monitoring_ips` table
- Insert your existing IPs (including `192.76.8.161`)
- Set up indexes for fast lookups
- Enable Row Level Security

### Step 2: Restart Your Server (One Time Only)

```bash
cd backend
npm restart
```

You'll see this in the logs:
```
🔐 [IP Whitelist] Initializing IP whitelist manager...
🔐 [IP Whitelist] Initialized with 6 allowed IPs
🔐 [IP Whitelist] Auto-reload every 5 minutes
```

---

## Managing IPs

### Option 1: Via Supabase Table Editor (Easiest)

1. Go to **Table Editor** → `allowed_monitoring_ips`
2. Click **Insert row** or edit existing rows
3. Changes will be picked up within 5 minutes (or use reload API)

**Fields:**
- `ip_address` (required): The IP to whitelist
- `description` (optional): Human-readable note
- `is_active` (required): `true` to allow, `false` to block

### Option 2: Via SQL Editor (Faster for Bulk)

```sql
-- Add a single IP
INSERT INTO allowed_monitoring_ips (ip_address, description)
VALUES ('203.0.113.42', 'New office IP');

-- Add multiple IPs
INSERT INTO allowed_monitoring_ips (ip_address, description) VALUES
  ('198.51.100.10', 'Cloud monitoring service'),
  ('198.51.100.11', 'Backup monitoring'),
  ('198.51.100.12', 'Mobile team VPN');

-- Deactivate an IP (soft delete)
UPDATE allowed_monitoring_ips 
SET is_active = false 
WHERE ip_address = '192.76.8.161';

-- Reactivate an IP
UPDATE allowed_monitoring_ips 
SET is_active = true 
WHERE ip_address = '192.76.8.161';

-- View all IPs with status
SELECT ip_address, description, is_active, last_used_at, added_at 
FROM allowed_monitoring_ips 
ORDER BY added_at DESC;
```

### Option 3: Via Admin API (For Automation)

All endpoints require an **already whitelisted IP** to access.

#### List All IPs
```bash
curl http://your-server:3001/api/admin/ips
```

Response:
```json
{
  "success": true,
  "ips": [
    {
      "ip_address": "192.76.8.161",
      "description": "Monitoring dashboard IP",
      "is_active": true,
      "last_used_at": "2025-10-08T12:34:56Z",
      "added_at": "2025-10-08T10:00:00Z"
    }
  ],
  "activeCount": 6,
  "inactiveCount": 0
}
```

#### Add New IP
```bash
curl -X POST http://your-server:3001/api/admin/ips/add \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "203.0.113.42",
    "description": "New monitoring location"
  }'
```

Response:
```json
{
  "success": true,
  "message": "IP 203.0.113.42 added successfully",
  "ip": { ... }
}
```

#### Remove IP
```bash
curl -X POST http://your-server:3001/api/admin/ips/remove \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "203.0.113.42"
  }'
```

#### Force Reload (Instant Update)
```bash
curl -X POST http://your-server:3001/api/admin/ips/reload
```

This immediately syncs from database without waiting for the 5-minute interval.

Response:
```json
{
  "success": true,
  "message": "IP whitelist reloaded from database",
  "count": 7,
  "added": ["203.0.113.42"],
  "removed": []
}
```

#### Check Whitelist Status
```bash
curl http://your-server:3001/api/admin/ips/status
```

Response:
```json
{
  "success": true,
  "status": {
    "initialized": true,
    "allowedIPCount": 6,
    "allowedIPs": ["127.0.0.1", "192.76.8.161", ...],
    "lastReloadTime": "2025-10-08T12:30:00Z",
    "nextReloadIn": 180000,
    "reloadIntervalMs": 300000
  }
}
```

---

## How It Works

1. **Server Startup**: Loads all active IPs from database into memory
2. **Request Check**: Each monitoring request checks against in-memory whitelist (fast!)
3. **Auto-Reload**: Every 5 minutes, syncs from database automatically
4. **Manual Reload**: You can force reload via API for instant updates
5. **Usage Tracking**: Records `last_used_at` timestamp for each IP

### Sync Flow

```
┌─────────────┐
│  Supabase   │  ← You add IP here
│  Database   │
└──────┬──────┘
       │
       ├── Auto sync every 5 min
       ├── Or manual reload via API
       │
       ▼
┌─────────────┐
│  In-Memory  │  ← Server checks here (fast!)
│  Whitelist  │
└─────────────┘
```

---

## Protected Endpoints

The following endpoints require whitelisted IPs:

- `GET /monitoring` - Monitoring dashboard
- `GET /api/health/detailed` - Detailed health metrics
- `GET /api/metrics` - Performance metrics
- `GET /api/ai/status` - AI service status
- `GET /api/pronunciation/status` - Pronunciation service status
- `GET /api/cleanup/stats` - Cleanup statistics
- `POST /api/cleanup/emergency` - Emergency cleanup
- `GET /api/errors` - Error logs
- `GET /api/errors/stats` - Error statistics
- `POST /api/errors/clear` - Clear error logs
- `GET /api/rate-limits/status` - Rate limit status
- `GET /api/admin/*` - All admin endpoints
- `GET /api/admin/ips/*` - IP management endpoints

---

## Troubleshooting

### "Access Denied" Error

If you get:
```json
{
  "error": "Access denied. Monitoring endpoints are restricted to authorized IPs only.",
  "code": "MONITORING_ACCESS_DENIED",
  "clientIP": "203.0.113.42"
}
```

**Solutions:**

1. **Add your IP via Supabase:**
   ```sql
   INSERT INTO allowed_monitoring_ips (ip_address, description)
   VALUES ('203.0.113.42', 'My IP');
   ```

2. **Wait 5 minutes** for auto-reload, OR

3. **Force reload** (requires access from already whitelisted IP):
   ```bash
   curl -X POST http://your-server:3001/api/admin/ips/reload
   ```

### IP Not Loading After Adding

Check server logs:
```bash
# Look for these messages
🔐 [IP Whitelist] Reloaded from database
  ✅ Added: 203.0.113.42
```

If you don't see this within 5 minutes:
- Force a reload via API
- Check database connectivity
- Verify the IP is marked `is_active = true`

### Database Connection Issues

If the database is unavailable, the server falls back to these IPs:
- `127.0.0.1` (localhost)
- `::1` (localhost IPv6)
- `::ffff:127.0.0.1` (localhost IPv4-mapped)
- `146.198.140.69`
- `148.252.147.103`
- `192.76.8.161`

Check logs for:
```
🔐 [IP Whitelist] Failed to initialize from database, using fallback IPs
```

---

## Best Practices

1. **Always add a description** - Makes it easy to remember why an IP was added
2. **Use soft delete** - Set `is_active = false` instead of deleting rows (keeps audit trail)
3. **Monitor usage** - Check `last_used_at` to find unused IPs
4. **Use /api/admin/ips/reload** - After adding IPs for instant access (no 5-min wait)
5. **Regular audits** - Review IPs monthly and remove unused ones

---

## Migration from Hardcoded IPs

Your old hardcoded IPs have been migrated to the database:
- ✅ `127.0.0.1` - localhost
- ✅ `::1` - localhost IPv6
- ✅ `::ffff:127.0.0.1` - localhost IPv4-mapped IPv6
- ✅ `146.198.140.69` - Home/WiFi IP
- ✅ `148.252.147.103` - Cellular/mobile IP
- ✅ `192.76.8.161` - Monitoring dashboard IP

You can now manage these through the database/API instead of editing code!

---

## Security Notes

- IP whitelist uses Row Level Security (RLS) in Supabase
- Only service role can modify IPs
- All IP access is logged with timestamps
- Monitoring endpoints remain protected
- Failed access attempts are logged to console

---

## Quick Reference

| Action | Method | Time to Effect |
|--------|--------|----------------|
| Add IP via Supabase | SQL/Table Editor | ~5 minutes |
| Add IP via API | POST /api/admin/ips/add | Instant |
| Remove IP | SQL/API | ~5 minutes |
| Force reload | POST /api/admin/ips/reload | Instant |
| Auto sync | Automatic | Every 5 minutes |
