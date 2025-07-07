# Dockerfile.frontend

FROM node:20-slim

WORKDIR /app

# Copiamos solo lo necesario para instalar dependencias primero (mejor caché)
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que usa Angular
EXPOSE 4200

# Comando por defecto: iniciar servidor Angular
CMD ["npm", "start"]