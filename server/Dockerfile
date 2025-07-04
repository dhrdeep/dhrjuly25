# Use a lightweight Node.js image as the base
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build
RUN npm run build:server

# Expose the port your app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "run", "start"]
