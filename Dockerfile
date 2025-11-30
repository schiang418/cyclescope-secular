# Use Microsoft Playwright base image (includes Node.js, Chromium, and all system deps)
FROM mcr.microsoft.com/playwright:v1.49.1-jammy

# Create app directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install Node dependencies (Playwright is already preinstalled in this base image)
RUN npm install --omit=dev

# Copy everything else
COPY . .

# Set environment variable for data directory
ENV DATA_DIR=/data

# Expose port
EXPOSE 3000

# Set the default command
CMD ["npm", "start"]
