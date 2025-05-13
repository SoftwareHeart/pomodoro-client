# Build aşaması
FROM node:18 AS build
WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package.json package-lock.json ./
RUN npm ci

# Kaynak kodları kopyala ve build et
COPY public/ public/
COPY src/ src/
RUN npm run build

# Çalıştırma aşaması
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]