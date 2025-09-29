# Comprehensive multi-stage build for Railway with full EasyOCR support
FROM node:20-slim AS builder

# Install ALL dependencies for EasyOCR, Canvas, and Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libglib2.0-dev \
    libgomp1 \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    libfreetype6-dev \
    libffi-dev \
    libssl-dev \
    libgcc-s1 \
    libstdc++6 \
    libgfortran5 \
    libopenblas-dev \
    liblapack-dev \
    libatlas-base-dev \
    gfortran \
    pkg-config \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Python dependencies first using virtual environment
COPY requirements.txt .
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Install node-easyocr explicitly
RUN npm install node-easyocr@^1.0.9

# Verify installations
RUN npm list node-easyocr
RUN python3 -c "import easyocr; print('EasyOCR Python module imported successfully')"

# Copy application code
COPY . .

# Final stage - ultra-minimal runtime image
FROM node:20-slim AS runtime

# Install ALL runtime dependencies for EasyOCR
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libglib2.0-dev \
    libgomp1 \
    libcairo2 \
    libjpeg62 \
    libpango1.0-0 \
    libgif7 \
    libpixman-1-0 \
    libfreetype6 \
    libffi-dev \
    libssl-dev \
    libgcc-s1 \
    libstdc++6 \
    libgfortran5 \
    libopenblas0 \
    liblapack3 \
    libatlas3-base \
    gfortran \
    pkg-config \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app .

# Set Python environment variables for EasyOCR
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH=/opt/venv/lib/python3.11/site-packages
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

# Run as root for faster builds (less secure but functional)
# USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
