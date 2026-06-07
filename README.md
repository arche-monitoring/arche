<h1 align="center">Arche</h1>

<p align="center">
  <a href="https://github.com/arche-monitoring/arche">
    <img src="https://img.shields.io/badge/arche-Modern%20and%20Beautiful-2ea44f?style=for-the-badge" alt="Arche">
  </a>

<img src="https://img.shields.io/github/actions/workflow/status/arche-monitoring/arche/ci.yml?branch=main&label=CI%20Status&style=for-the-badge&logo=github&logoColor=white&color=2ea44f" alt="CI Status">

<a href="https://deps.rs/repo/github/arche-monitoring/arche">
    <img src="https://img.shields.io/badge/dependencies-up%20to%20date-2ea44f?style=for-the-badge&logo=typescript&logoColor=white" alt="Dependency Status">
  </a>

<img src="https://img.shields.io/github/stars/arche-monitoring/arche?style=for-the-badge&logo=github&logoColor=white&color=dfb317" alt="stars">
</p>

## What is Arche?

Arche is a modern, beautiful and lightweight self-hosted monitoring tool.

## Features

- **8 check types** — HTTP(S), Ping, TCP, Port scan, DNS resolution, IMAP login,
  SMTP handshake
- **Configurable intervals** — per-monitor check interval and timeout
- **Status pages** — public pages with a custom slug
- **Alerts** — Telegram bot and Discord webhook notifications on status changes
- **Uptime Stats** — 24h, 7d, and 30d uptime percentages per monitor

## Install

Aperio runs on Linux (x64 & arm64) and macOS (x64 & Apple Silicon).

```bash
docker pull ghcr.io/arche-monitoring/arche
docker run -p 3000:3000 -v arche_data:/app/data --restart=always ghcr.io/arche-monitoring/arche
```

Just open your browser at http://localhost:3000 and you are good to go.

## Docs

- [Commands & conventions](AGENTS.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT
