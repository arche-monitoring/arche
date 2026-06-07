FROM denoland/deno:alpine-2.1

WORKDIR /app

COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/
COPY deno.json ./

EXPOSE 3000

VOLUME [ "/app/data" ]

ENV DB_PATH=/app/data/arche.db
ENV PORT=3000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--allow-run", "--allow-sys", "backend/main.ts"]
