FROM node:20-slim

WORKDIR /app

# Copiamos los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install --legacy-peer-deps

# Copiamos el resto del código
COPY . .

# Instalamos http-server globalmente
RUN npm install -g http-server

# Compilamos Angular en modo producción con script específico
RUN npm run build:prod

# Verificamos que se compiló correctamente
RUN ls -la dist/Modernize/

# Exponemos el puerto 4200
EXPOSE 4200

# Comando por defecto: servir archivos estáticos
CMD ["http-server", "dist/Modernize", "-p", "4200", "-a", "0.0.0.0", "--cors"]