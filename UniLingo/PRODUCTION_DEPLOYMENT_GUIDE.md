# UniLingo Production Deployment Guide

This guide covers deploying the UniLingo application to production environments.

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- OpenAI API key
- Cloudmersive API key
- Domain name and SSL certificate

## Environment Setup

### 1. Backend Server

Create a production environment file:

```bash
# .env.production
CLOUDMERSIVE_API_KEY=your_production_cloudmersive_key
PORT=3001
NODE_ENV=production
```

### 2. Frontend Environment

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
OPENAI_API_KEY=your_production_openai_key
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Option 2: Railway

1. Connect GitHub repository
2. Set environment variables
3. Deploy both frontend and backend

### Option 3: DigitalOcean App Platform

1. Create new app from GitHub
2. Configure build settings
3. Set environment variables
4. Deploy

## Backend Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start the backend server
pm2 start server.js --name "unilingo-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t unilingo-backend .
docker run -p 3001:3001 --env-file .env.production unilingo-backend
```

## Database Setup

### Supabase Production

1. Create production Supabase project
2. Run database migrations:
   ```sql
   -- Run all SQL files in order
   \i database_setup.sql
   \i database_update.sql
   \i setup_user_profiles.sql
   \i setup_user_flashcards.sql
   \i backend/create_favourite_games_table.sql
   ```

3. Configure Row Level Security policies
4. Set up database backups

## Security Considerations

### API Keys

- Use environment variables, never hardcode
- Rotate keys regularly
- Use different keys for development/production
- Monitor API usage and costs

### CORS Configuration

Update backend CORS settings for production:

```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

### File Upload Security

- Validate file types server-side
- Implement file size limits
- Scan uploaded files for malware
- Use secure file storage (AWS S3, etc.)

## Performance Optimization

### Backend

- Enable gzip compression
- Implement request rate limiting
- Use Redis for session storage
- Set up monitoring and logging

### Frontend

- Enable Next.js production optimizations
- Implement image optimization
- Use CDN for static assets
- Enable service worker for caching

## Monitoring

### Health Checks

- Backend: `GET /health`
- Database connection monitoring
- API response time tracking
- Error rate monitoring

### Logging

```javascript
// Add to backend server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Backup Strategy

### Database Backups

- Daily automated Supabase backups
- Point-in-time recovery enabled
- Test restore procedures regularly

### File Backups

- Regular backups of uploaded files
- Cross-region replication
- Version control for configuration files

## SSL/TLS Configuration

### Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com
```

### Cloudflare (Recommended)

1. Add domain to Cloudflare
2. Enable SSL/TLS encryption
3. Configure security settings
4. Enable DDoS protection

## Scaling Considerations

### Horizontal Scaling

- Use load balancer for multiple backend instances
- Implement session affinity or stateless design
- Database connection pooling
- CDN for static assets

### Vertical Scaling

- Monitor CPU and memory usage
- Upgrade server resources as needed
- Optimize database queries
- Implement caching strategies

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Monitor API usage and costs
- Review and rotate API keys
- Check security advisories
- Test backup and restore procedures

### Monitoring Alerts

- Server downtime alerts
- High error rate notifications
- API quota warnings
- Database connection issues
- Disk space monitoring

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check origin configuration
2. **API Timeouts**: Increase timeout values or optimize queries
3. **File Upload Failures**: Check file size limits and permissions
4. **Database Connection**: Verify connection strings and network access

### Debug Mode

Enable debug logging in production:

```bash
DEBUG=true npm start
```

## Support

For deployment issues:

1. Check application logs
2. Verify environment variables
3. Test API endpoints manually
4. Review database connectivity
5. Check SSL certificate validity
