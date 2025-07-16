# Use a more specific Node.js image
FROM node:20.11.1-alpine

# Set the working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Build the server code
RUN npm run build:server

# Set the user for the container
USER appuser

# Expose the port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]