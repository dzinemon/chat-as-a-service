FROM node:22.14.0-slim

# Install dependencies required for workerd
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

EXPOSE 3000

CMD ["npm", "start"]