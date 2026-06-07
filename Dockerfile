FROM denoland/deno:alpine-2.1

WORKDIR /app

COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/
COPY deno.json ./

EXPOSE 3001

VOLUME [ "/app/data" ]

ENV DB_PATH=/app/data/arche.db
ENV PORT=3001

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--allow-run", "--allow-sys", "backend/main.ts"]
