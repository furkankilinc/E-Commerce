FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Prisma client generate
RUN npx prisma generate

EXPOSE 5003

CMD ["npm", "run", "dev"]
