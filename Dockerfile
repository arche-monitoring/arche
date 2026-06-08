FROM denoland/deno:debian

RUN apt-get update && apt-get install -y --no-install-recommends iputils-ping && rm -rf /var/lib/apt/lists/*

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

EXPOSE 3000

VOLUME [ "/app/data" ]

ENV DB_PATH=/app/data/arche.db
ENV PORT=3000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--allow-run", "--allow-sys", "backend/main.ts"]
