FROM node:20-alpine AS build

WORKDIR /app

# Git is required because @twf/contracts is installed from a GitHub commit.
RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Keep git available in the runtime install step for GitHub-based dependencies.
RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
