# Use Node.js 18 with FFmpeg
FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN cd server && npm install
RUN cd client && npm install && npm run build

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "server/server.js"]
