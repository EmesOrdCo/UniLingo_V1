# Ultra-minimal multi-stage build for Railway with EasyOCR
FROM node:18-alpine AS builder

# Install build dependencies for Python, EasyOCR, and Canvas on Alpine
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    libc6-compat \
    linux-headers \
    gcc \
    g++ \
    make \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Install node-easyocr explicitly if missing
RUN npm list node-easyocr || npm install node-easyocr@^1.0.9

# Verify node-easyocr installation
RUN npm list node-easyocr

# Copy application code
COPY . .

# Final stage - ultra-minimal runtime image
FROM node:18-alpine AS runtime

# Install only essential runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    libc6-compat \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
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
