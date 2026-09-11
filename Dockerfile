# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Expose build args for Vite
ARG VITE_STOCK_API_BASE_URL
ARG VITE_STOCK_API_KEY
ENV VITE_STOCK_API_BASE_URL=$VITE_STOCK_API_BASE_URL
ENV VITE_STOCK_API_KEY=$VITE_STOCK_API_KEY

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
