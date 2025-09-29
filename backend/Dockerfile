# Multi-stage build for Railway with EasyOCR - Optimized for size
FROM node:18-slim AS builder

# Install build dependencies for Python and EasyOCR
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

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

# Final stage - minimal runtime image
FROM node:18-slim AS runtime

# Install only runtime Python dependencies (no build tools)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get autoremove -y

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
