FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/storefront/package.json ./apps/storefront/
COPY apps/admin/package.json ./apps/admin/
COPY apps/vendor-panel/package.json ./apps/vendor-panel/
COPY packages/ui/package.json ./packages/ui/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/utils/package.json ./packages/utils/
COPY packages/api/package.json ./packages/api/
COPY packages/types/package.json ./packages/types/

RUN npm install

COPY . .

EXPOSE 5173 5174 5175

CMD ["npm", "run", "dev"]
