<h1 align="center">Arche</h1>

## What is Arche?

Arche is a modern, beautiful and lightweight self-hosted monitoring tool.

## Features

- **8 check types** — HTTP(S), Ping, TCP, Port scan, DNS resolution, IMAP
  login, SMTP handshake
- **Configurable intervals** — per-monitor check interval and timeout
- **Status pages** — public pages with a custom slug
- **Alerts** — Telegram bot and Discord webhook notifications on status changes
- **Uptime Stats** — 24h, 7d, and 30d uptime percentages per monitor

## Install

Aperio runs on Linux (x64 & arm64) and macOS (x64 & Apple Silicon).

### Docker

```bash
docker pull ghcr.io/arche-monitoring/arche
docker run -p 5173:5173 ghcr.io/arche-monitoring/arche
```

Just open your browser at http://localhost:5173 and you are good to go.

## Docs

- [Commands & conventions](AGENTS.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT
