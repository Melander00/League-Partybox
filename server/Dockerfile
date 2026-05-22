# --- Build Stage ---
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json .

RUN npm ci && npm cache clean --force

COPY . .

# RUN npm run prisma:gen

RUN npm run build && npm prune --production

# --- Run Stage ---
FROM node:24-alpine AS app

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S user -u 1001

COPY --from=builder --chown=user:nodejs /app/package.json /app/package.json
COPY --from=builder --chown=user:nodejs /app/dist /app/dist
COPY --from=builder --chown=user:nodejs /app/node_modules /app/node_modules
# COPY --from=builder --chown=user:nodejs /app/entrypoint.sh /app/entrypoint.sh
# COPY --from=builder --chown=user:nodejs /app/prisma.config.ts /app/prisma.config.ts
# COPY --from=builder --chown=user:nodejs /app/prisma /app/prisma


# RUN chmod +x /app/entrypoint.sh
  
USER user

CMD [ "npm", "run", "start" ]

# ENTRYPOINT [ "/app/entrypoint.sh" ]