# Stage 1: Build the application
FROM node:lts as builder

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm ci

# Copy the entire project
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Prepare production environment
FROM node:lts-slim

# Install OpenSSL 1.1.x (Prisma required)
RUN apt-get update && apt-get install -y openssl

# Create app directory
WORKDIR /app

# Copy the package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the built files and Prisma client files from the builder stage
COPY --from=builder /app/dist /app
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/package*.json ./

# Expose necessary ports
EXPOSE 1234
EXPOSE 7777

# Start the application
CMD [ "node", "index.js" ]
