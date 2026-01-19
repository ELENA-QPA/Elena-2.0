# Usa Node.js 20 (Alpine para menor tamaño)
FROM node:20-alpine

# Instala dependencias del sistema necesarias para módulos nativos
RUN apk add --no-cache python3 make g++ libc6-compat

# Establece el directorio de trabajo
WORKDIR /app

# Copia package.json
COPY package.json ./

# Instala todas las dependencias
RUN npm install

# Copia el código de la aplicación
COPY . .

# Construye la aplicación
RUN npm run build

# Expone el puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["node", "dist/main.js"]