FROM node:20-slim
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 10001 appgroup && useradd -u 10001 -g appgroup appuser

COPY package*.json ./
RUN npm ci --ignore-scripts
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

RUN chown -R appuser:appgroup /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

USER 10001

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
