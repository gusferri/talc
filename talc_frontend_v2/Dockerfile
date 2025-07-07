# Dockerfile.frontend

FROM node:20-slim

WORKDIR /app

# Copiamos los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install --legacy-peer-deps

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que usa Angular
EXPOSE 4200

# Compilamos Angular (opcional, útil si usás `ng build`)
# RUN npm run build

# Comando por defecto: iniciar servidor Angular en modo desarrollo
CMD ["npx", "ng", "serve", "--host", "0.0.0.0"]
