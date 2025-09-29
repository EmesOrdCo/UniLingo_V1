# Ultra-minimal multi-stage build for Railway
FROM node:18-slim AS builder

# Install build dependencies for EasyOCR and Canvas
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libgomp1 \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

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
FROM node:18-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libgomp1 \
    libcairo2 \
    libjpeg62 \
    libpango1.0-0 \
    libgif7 \
    libpixman-1-0 \
    libfreetype6 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

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
