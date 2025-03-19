# Use a lightweight Node.js image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Install required system dependencies
RUN apk add --no-cache curl

# Copy the rest of the frontend app
COPY . .

# Expose port 3000 for the frontend
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]
