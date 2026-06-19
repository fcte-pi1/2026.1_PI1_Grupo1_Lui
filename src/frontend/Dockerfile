# Estágio 1: Build da aplicação
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar os arquivos de dependência
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Construir a versão de produção
RUN npm run build

# Estágio 2: Servidor Web (Nginx)
FROM nginx:alpine

# Remover a configuração padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar os arquivos construídos no estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar a configuração personalizada do Nginx (para SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta 80
EXPOSE 80

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]
