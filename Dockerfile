FROM denoland/deno:alpine AS builder

WORKDIR /app

# Install backend dependencies
COPY deno.json deno.lock ./
RUN deno ci

# Install frontend dependencies
COPY frontend/deno.json frontend/deno.lock ./frontend/
RUN cd frontend && deno ci

# Copy frontend source and build
COPY frontend/index.html frontend/vite.config.ts frontend/tailwind.config.ts frontend/postcss.config.js frontend/tsconfig.json frontend/components.json ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
RUN cd frontend && deno task build

# Copy backend source
COPY backend/ ./backend/

FROM denoland/deno:alpine

RUN apk add --no-cache iputils

WORKDIR /app

# Copy backend runtime deps and source
COPY --from=builder /app/deno.json /app/deno.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend

# Copy only the built frontend (no source or dev deps)
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

VOLUME [ "/app/data" ]

ENV DB_PATH=/app/data/arche.db
ENV PORT=3000

CMD ["deno", "run", "start"]
