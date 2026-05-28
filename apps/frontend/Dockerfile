FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install -g pnpm

RUN pnpm install

RUN pnpm prisma generate

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/main"]
