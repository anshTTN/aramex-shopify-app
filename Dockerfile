# Use Node.js LTS version as the base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Create directory for public assets
RUN mkdir -p public/assets/css public/assets/images

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Command to run the application
CMD ["npm", "start"] 