# Polymarket Trading Bot (TypeScript)
<img width="1538" height="969" alt="Screenshot_8" src="https://github.com/user-attachments/assets/cd774665-ae54-4645-beec-c4a495d23607" />
At each 15-minute market start, places limit buys for BTC (and optionally ETH, Solana, XRP) Up/Down at a fixed price (default $0.45).

## Requirements

- Node.js >= 18
- `config.json` with Polymarket `private_key` (and optional API creds)

## Setup

```bash
npm install
cp config.json.example config.json   # or copy from Rust project
# Edit config.json: set polymarket.private_key (hex, with or without 0x)
```

## Usage

- **Simulation (default)** – no real orders, logs what would be placed:
  ```bash
  npm run dev
  # or
  npx tsx src/main-dual-limit-045.ts
  ```

- **Production** – place real limit orders:
  ```bash
  npx tsx src/main-dual-limit-045.ts --no-simulation
  ```

- **Config path**:
  ```bash
  npx tsx src/main-dual-limit-045.ts -c /path/to/config.json
  ```

## Logging 

- **Console**: colored in development, JSON lines when `NODE_ENV=production`.
- **Levels**: `LOG_LEVEL=debug|info|warn|error` (default `info`). Use `LOG_DEBUG=true` to force debug.
- **File** (optional): set `LOG_FILE=true`, optional `LOG_FILE_PATH=logs/bot.log`, `LOG_ROTATION=1H|1D|1W`, `LOG_MAX_FILES=7`.
- **Slack / Discord / Telegram** (optional): set `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, or `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`. Hook minimum level: `MB_LOG_HOOK_LEVEL` (default `error`).

`.env` is loaded automatically via `dotenv`. See `.env.logging.example`.

In code: `import log from "./logger.js"` then `log.info()`, `log.warn()`, `log.error()`, `log.debug()`, or `import { tag } from "./logger.js"` for scoped loggers.

## Config

Same shape as the Rust bot:

- `polymarket.gamma_api_url`, `polymarket.clob_api_url` – API base URLs
- `polymarket.private_key` – EOA private key (hex)
- `polymarket.proxy_wallet_address` – optional proxy/Magic wallet
- `trading.dual_limit_price` – limit price (default 0.45)
- `trading.dual_limit_shares` – optional fixed shares per order
- `trading.enable_eth_trading`, `enable_solana_trading`, `enable_xrp_trading` – enable extra markets

## Project layout

- `src/config.ts` – load config, parse CLI args
- `src/types.ts` – Market, Token, BuyOpportunity, MarketSnapshot
- `src/api.ts` – Gamma API (market by slug), CLOB order book
- `src/clob.ts` – CLOB client (ethers + @polymarket/clob-client), place limit order
- `src/monitor.ts` – fetch snapshot (prices, time remaining)
- `src/logger.ts` – @slackgram/logger setup (env, file, webhooks)
- `src/trader.ts` – hasActivePosition, executeLimitBuy
- `src/main-dual-limit-045.ts` – discover markets, monitor loop, place limit orders at period start

## Build

```bash
npm run build
node dist/main-dual-limit-045.js
```
