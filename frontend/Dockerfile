# Use a lightweight Node.js image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy the rest of the frontend app
COPY . .

# Build the React app
RUN npm run build

# Install a static file server
RUN npm install -g serve

# Expose port 3000 for the frontend
EXPOSE 3000

# Serve the built frontend using "serve"
CMD ["serve", "-s", "build", "-l", "3000"]
