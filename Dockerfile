# Steam Manifest Bot - Dockerfile
# Node.js 20 + npm-based deployment

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Environment setup
ENV NODE_ENV=production

# Start bot
CMD ["node", "manifest-bot.js"]
