FROM node:20-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código del frontend
COPY . .

# Exponer el puerto por defecto de Vite
EXPOSE 5173

# Comando para iniciar el entorno de desarrollo y exponerlo
CMD ["npm", "run", "dev", "--", "--host"]
