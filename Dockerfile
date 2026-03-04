FROM node:20-slim
WORKDIR /app

RUN groupadd -g 10001 appgroup && useradd -u 10001 -g appgroup appuser

COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

RUN chown -R appuser:appgroup /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

USER 10001

EXPOSE 3000
CMD ["npm", "start"]
