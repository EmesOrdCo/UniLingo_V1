# UniLingo Load Testing Docker Image
FROM grafana/k6:latest

# Install additional tools for analysis
RUN apk add --no-cache \
    jq \
    curl \
    bash

# Set working directory
WORKDIR /app

# Copy test files
COPY k6/ ./k6/
COPY run_k6.sh ./
COPY report_template.md ./
COPY README.md ./

# Make scripts executable
RUN chmod +x run_k6.sh

# Create results directory
RUN mkdir -p results

# Set default environment variables
ENV STAGING_BASE_URL="http://localhost:3001"
ENV VU_COUNT=50
ENV RAMP_UP_DURATION="1m"
ENV STEADY_STATE_DURATION="2m"
ENV RAMP_DOWN_DURATION="30s"
ENV MAX_JOBS_PER_USER=3
ENV QUEUE_DEPTH_THRESHOLD=500
ENV JOB_TIMEOUT_SECONDS=30
ENV DRY_RUN=false

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f "$STAGING_BASE_URL/api/health" || exit 1

# Default command
CMD ["./run_k6.sh", "--smoke-test"]
