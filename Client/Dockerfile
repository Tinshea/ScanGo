# Étape 1 : Builder l'application Vite
FROM node:18 AS builder

WORKDIR /app

# Copier les fichiers du projet
COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Build du projet Vite
RUN npm run build --legacy-peer-deps

# Étape 2 : Servir via Nginx
FROM nginx:alpine

# Copier les fichiers générés vers Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx si nécessaire
COPY nginx.conf /etc/nginx/nginx.conf

# Exposer le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
