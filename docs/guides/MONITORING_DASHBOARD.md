# UniLingo Monitoring Dashboard

## Access URL
```
https://unilingov1-production.up.railway.app/monitoring
```

## Features

### 📊 Real-Time Monitoring
- **Auto-refresh**: Updates every 30 seconds
- **Manual refresh**: Click the refresh button
- **Responsive design**: Works on desktop and mobile

### 🏥 System Health
- Overall system status (Healthy/Degraded/Unhealthy)
- System uptime
- Active issues and warnings
- Service-level health checks

### 📈 Performance Metrics
- Total requests processed
- Error rate with visual indicator
- Average response time
- Requests per minute
- Color-coded progress bars

### 🎤 Pronunciation Service
- Service status
- Queue size and processing count
- Circuit breaker state
- Max concurrent capacity

### 🛡️ Rate Limiting
- Real-time usage tracking
- Pronunciation assessment limits
- AI service limits
- Visual progress bars
- Reset time display

## Security

### IP Whitelist Protection
- Only accessible from whitelisted IPs
- Current whitelist includes:
  - `127.0.0.1` (localhost)
  - `::1` (localhost IPv6)
  - `146.198.140.69` (your IP)

### Access Control
- Protected endpoints require IP whitelist
- Public health check available at `/api/health`
- Detailed monitoring only for authorized users

## Dashboard Features

### Visual Design
- Modern gradient background
- Glass-morphism cards
- Smooth animations and hover effects
- Status badges with color coding
- Progress bars for metrics
- Clean typography

### Status Indicators
- 🟢 **Healthy**: Green badges
- 🟡 **Degraded**: Yellow badges
- 🔴 **Unhealthy**: Red badges

### Progress Bars
- Green: Normal operation (< 5% error rate)
- Yellow: Warning (5-15% error rate)
- Red: Critical (> 15% error rate)

## API Endpoints (Protected)

### Detailed Health
```
GET /api/health/detailed
```
Returns comprehensive system health information

### Performance Metrics
```
GET /api/metrics
```
Returns detailed performance metrics

### Pronunciation Status
```
GET /api/pronunciation/status
```
Returns pronunciation service status

### Rate Limits
```
GET /api/rate-limits/status
```
Returns current rate limit usage

### Cleanup Stats
```
GET /api/cleanup/stats
```
Returns file cleanup statistics

## Adding More IPs

To add additional IP addresses to the whitelist:

1. Edit `backend/server.js`
2. Add IP to the `allowedIPs` array:
```javascript
const allowedIPs = [
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
  '146.198.140.69',
  'YOUR.NEW.IP.ADDRESS',  // Add here
];
```
3. Commit and push changes
4. Railway will auto-deploy

## Mobile Access

The dashboard is fully responsive and works on mobile devices. Simply access the same URL from your mobile browser (must be from a whitelisted IP).

## Auto-Refresh

The dashboard automatically refreshes every 30 seconds. You can also manually refresh using:
- The refresh button (bottom right)
- Browser refresh (F5 or Cmd+R)

## Troubleshooting

### "Access Denied" Error
- Ensure you're accessing from a whitelisted IP
- Check your current IP: `curl ifconfig.me`
- Add your IP to the whitelist in `server.js`

### Dashboard Not Loading
- Check Railway deployment status
- Verify `/monitoring` endpoint is accessible
- Check browser console for errors

### Data Not Updating
- Check auto-refresh is enabled
- Manually refresh the page
- Verify API endpoints are responding

## Benefits

### Visibility
- Real-time system health monitoring
- Performance metrics at a glance
- Service status tracking
- Resource utilization insights

### Security
- IP-based access control
- Protected sensitive data
- Audit trail in logs
- Minimal public exposure

### User Experience
- Beautiful, modern interface
- Easy to read and understand
- Quick access to critical info
- Mobile-friendly design

## Maintenance

### Regular Checks
- Monitor error rates
- Watch queue sizes
- Track rate limit usage
- Review system health

### Alerts to Watch
- Error rate > 15%
- Circuit breaker open
- High queue sizes
- Rate limits approaching max

### Performance Optimization
- Use metrics to identify bottlenecks
- Monitor response times
- Track request patterns
- Optimize based on data

---

**Dashboard URL**: https://unilingov1-production.up.railway.app/monitoring

**Access**: IP Whitelisted (146.198.140.69)

**Status**: Live and operational ✅
