# TPS Web Application
FROM oven/bun:1.1.20-debian

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy all application code first (needed for workspaces)
COPY . ./

# Install dependencies
RUN bun install --production

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Generate Prisma client (without DB connection)
RUN cd app/db && rm -f .env && bunx prisma generate --schema=prisma/schema.prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3300

# Expose port
EXPOSE 3300

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3300/ || exit 1

# Start application
CMD ["bun", "run", "prod"]
