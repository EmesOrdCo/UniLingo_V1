# Railway-optimized EasyOCR Docker build
FROM node:20-slim AS builder

# Install system dependencies for EasyOCR
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libgomp1 \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    libfreetype6-dev \
    libffi-dev \
    libssl-dev \
    libgfortran5 \
    libopenblas-dev \
    liblapack-dev \
    gfortran \
    pkg-config \
    wget \
    curl \
    git \
    cmake \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Python environment setup
COPY requirements.txt .
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV VIRTUAL_ENV="/opt/venv"

# Upgrade pip and install build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install Python dependencies in order for compatibility
RUN pip install --no-cache-dir numpy==1.24.3
RUN pip install --no-cache-dir Pillow==9.5.0
RUN pip install --no-cache-dir opencv-python==4.8.1.78

# Install PyTorch CPU-only version (most compatible)
RUN pip install --no-cache-dir torch==2.1.0+cpu torchvision==0.16.0+cpu --index-url https://download.pytorch.org/whl/cpu

# Install EasyOCR with specific version
RUN pip install --no-cache-dir easyocr==1.7.0

# Verify all imports work
RUN python3 -c "import torch; print('PyTorch:', torch.__version__)"
RUN python3 -c "import cv2; print('OpenCV:', cv2.__version__)"
RUN python3 -c "import numpy; print('NumPy:', numpy.__version__)"
RUN python3 -c "from PIL import Image; print('Pillow: OK')"
RUN python3 -c "import easyocr; print('EasyOCR: OK')"

# Install Node.js dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Install node-easyocr explicitly
RUN npm install node-easyocr@^1.0.9

# Verify installations
RUN npm list node-easyocr
RUN python3 -c "import easyocr; print('EasyOCR Python module imported successfully')"
RUN python3 -c "import torch; print('PyTorch version:', torch.__version__)"
RUN python3 -c "import cv2; print('OpenCV version:', cv2.__version__)"
RUN python3 -c "import numpy; print('NumPy version:', numpy.__version__)"
RUN python3 -c "from PIL import Image; print('Pillow imported successfully')"

# Test EasyOCR functionality
COPY test-easyocr.js .
RUN node test-easyocr.js

# Copy application code
COPY . .

# Final stage - optimized runtime image
FROM node:20-slim AS runtime

# Install runtime dependencies for EasyOCR
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libgomp1 \
    libcairo2 \
    libjpeg62 \
    libpango1.0-0 \
    libgif7 \
    libpixman-1-0 \
    libfreetype6 \
    libgfortran5 \
    libopenblas0 \
    liblapack3 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app .

# Set Python environment variables for EasyOCR
ENV PATH="/opt/venv/bin:$PATH"
ENV VIRTUAL_ENV="/opt/venv"
ENV PYTHONPATH=/opt/venv/lib/python3.11/site-packages
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
