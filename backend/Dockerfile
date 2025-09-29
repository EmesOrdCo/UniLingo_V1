# Ultra-minimal multi-stage build for Railway
FROM node:18-alpine AS builder

# Install minimal build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    freetype-dev \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Install node-easyocr explicitly
RUN npm install node-easyocr@^1.0.9

# Verify node-easyocr installation
RUN npm list node-easyocr

# Copy application code
COPY . .

# Final stage - ultra-minimal runtime image
FROM node:18-alpine AS runtime

# Install minimal runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    freetype \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app .

# Run as root for faster builds (less secure but functional)
# USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
