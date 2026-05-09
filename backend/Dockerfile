# === ENTERPRISE NODE.JS ENGINE ===
# Using Alpine Linux for an ultra-lightweight, high-speed container
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (This optimizes Docker's cache so rebuilds are instant)
COPY package*.json ./

# Install dependencies strictly based on the lockfile
RUN npm ci --only=production

# Copy the rest of your backend source code
COPY . .

# Expose the API Port
EXPOSE 5000

# Ignite the Engine
CMD ["npm", "start"]