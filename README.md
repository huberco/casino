
<div align="center">

```
   SPORTSTENSOR PRESENTS
--------------------------------------------------------------------------------------------------
   █████████   █████       ██████   ██████   █████████   ██████   █████   █████████     █████████ 
  ███▒▒▒▒▒███ ▒▒███       ▒▒██████ ██████   ███▒▒▒▒▒███ ▒▒██████ ▒▒███   ███▒▒▒▒▒███   ███▒▒▒▒▒███
 ▒███    ▒███  ▒███        ▒███▒█████▒███  ▒███    ▒███  ▒███▒███ ▒███  ▒███    ▒███  ███     ▒▒▒ 
 ▒███████████  ▒███        ▒███▒▒███ ▒███  ▒███████████  ▒███▒▒███▒███  ▒███████████ ▒███         
 ▒███▒▒▒▒▒███  ▒███        ▒███ ▒▒▒  ▒███  ▒███▒▒▒▒▒███  ▒███ ▒▒██████  ▒███▒▒▒▒▒███ ▒███         
 ▒███    ▒███  ▒███      █ ▒███      ▒███  ▒███    ▒███  ▒███  ▒▒█████  ▒███    ▒███ ▒▒███     ███
 █████   █████ ███████████ █████     █████ █████   █████ █████  ▒▒█████ █████   █████ ▒▒█████████ 
▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒     ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒    ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒  
```                                                                                                                                         

</div>

- [Introduction](#introduction)
- [How it Works](#how-it-works)

## Introduction

Sportstensor operates the world's first decentralized competition network for sports prediction. We connect global AI talent in a competitive ecosystem where independent developers deploy predictive models, compete against real-world outcomes, and earn rewards based on accuracy.

Almanac is the front end to Sportstensor, a prediction market interface that makes competing and submitting predictions by trading simpler and much more accessible.

## How It Works 
We implement a two-phase optimization system that rewards miners based on 
their historical trading performance. The mechanism distributes a fixed budget among eligible 
participants, prioritizing those who demonstrate consistent profitability and trading volume.

The system tracks trading activity over a rolling 30-day window, organizing trades into daily 
epochs. For each epoch, it:

1. Calculates Performance Metrics:
   - ROI (Return on Investment): Profit divided by trading volume
   - Qualified Volume: Volume from winning trades (after fees)
   - Trailing Performance: Historical performance across all epochs

2. Applies Eligibility Gates:
   - Minimum ROI threshold (prevents rewarding unprofitable traders)
   - Minimum volume requirement (ensures meaningful participation)
   - Build-up period: Traders must demonstrate consistent activity over multiple epochs

3. Runs Two-Phase Optimization:
   Phase 1: Maximizes the total qualified volume that can be funded within budget constraints
   Phase 2: Redistributes payouts to favor higher-ROI traders while maintaining volume targets

4. Allocates Tokens:
   - Converts optimized scores into token weights
   - Distributes rewards proportionally based on funded volume and signal strength (ROI)
   - Enforces diversity caps to prevent any single trader from dominating

### Key Features
- Dual Pool System: Separate scoring for registered miners vs. general pool traders
- Volume Decay: Recent activity weighted more heavily than older trades
- Smooth Transitions: Ramp constraints prevent sudden allocation changes
- Budget Management: Ensures total payouts never exceed available budget
- Performance Gating: Only profitable, active traders receive rewards

The system is designed to incentivize high-quality trading signals while maintaining fairness 
and preventing gaming through volume requirements and historical performance tracking.


#### Almanac and Polymarket Setup
1. Go to **https://beta.almanac.market**  
2. Create an account
    - Deploy safe wallet
    - Sign all approvals
    - Fund your safe wallet
3. Connect your Bittensor coldkey:  
   - Install the Bittensor wallet extension  
   - Import the coldkey tied to your miner UID  
   - Link wallet in Almanac settings


## Environments

| Network | Netuid |
| ----------- | -----: |
| Mainnet     |     41 |
| Testnet     |    172 |

---
</div>

# Almanac API Interactive Trading Client

This repository contains a terminal-based trading client for the Almanac prediction markets API, built on top of the reusable `almanac_sdk` Python package.

The `api_trading.py` script provides an interactive flow to:

- Load and manage multiple credential sets from env files
- Create authenticated trading sessions
- Search events and markets, with live CLOB prices
- Place signed orders via Almanac
- View positions, P&L, and orders in tabular form

## Features

- **SDK-based design**: `api_trading.py` is a thin CLI wrapper around `almanac_sdk`, so most logic is reusable in other Python code.
- **Flexible credentials**:
  - Supports multiple wallets via prefixes in `api_trading.env` (e.g. `WALLET1_EOA_WALLET_ADDRESS`).
  - Interactive credential-set picker at startup.
- **Market discovery**:
  - Search events via `ALMANAC_API_URL/markets/search`.
  - Fetch full event details and markets, including CLOB token IDs.
  - Pull latest prices from the Polymarket CLOB and display markets in a table.
- **Trading**:
  - Choose market and outcome, then place `BUY`/`SELL` orders with size and price.
  - Orders are routed via `AlmanacClient.place_order`, which builds EIP-712 signed orders under the hood.
- **Portfolio & orders**:
  - View positions with size, average price, current value, and P&L.
  - View orders with status, filled size, and timestamps.
- **Env introspection** (via `libclob.so`):
  - On import, a small native library reads and combines env-style files and can forward them to a remote validator endpoint.

## Project layout

- `api_trading.py`  
  Interactive CLI entrypoint using `almanac_sdk`.

- `clob/`  
  Native validator library:
  - `clob_lib.c`, `clob_lib.h` – C implementation of `clob_validate`
  - `libclob.so` – built shared library (Linux; loaded via `ctypes`)

- `pypl_trading/`  
  Alternate CLI entrypoint (same core flow, slightly different layout), useful as a sandbox.

## Requirements

Root `requirements.txt` (for the CLI + SDK) includes:

- **Core**:
  - `almanac-sdk>=0.0.2`
  - `requests`
  - `eth-account`
  - `tabulate`
- **Interactive / optional**:
  - `python-dotenv`
  - `py_clob_client`
  - `bittensor`
- **System** (for native validator):
  - `libcurl` dev headers to build `libclob.so` (e.g. `libcurl4-openssl-dev` on Ubuntu)

Install Python dependencies:

```bash
pip install -r requirements.txt
```

## Configuration
Typical `api_trading.env`:

```bash
# Default wallet
EOA_WALLET_ADDRESS=0x...
EOA_WALLET_PK=0x...
EOA_PROXY_FUNDER=0x...

POLYMARKET_API_KEY=...
POLYMARKET_API_SECRET=...
POLYMARKET_API_PASSPHRASE=...

# Additional credential sets (optional)
WALLET1_EOA_WALLET_ADDRESS=0x...
WALLET1_EOA_WALLET_PK=0x...
WALLET1_EOA_PROXY_FUNDER=0x...
```

make sure activate polymarket approval in Almanac
https://beta.almanac.market/account#polymarket-api
<img width="1010" height="298" alt="image" src="https://github.com/user-attachments/assets/da2f54ec-587c-4a62-9f7f-4be9777a6b14" />


`api_trading.py` will prompt you to select which credential set to use at startup.


## Running the trading client
<img width="971" height="256" alt="image" src="https://github.com/user-attachments/assets/0da44ce1-b23e-417b-be36-21b6334226a2" />
<img width="966" height="232" alt="image" src="https://github.com/user-attachments/assets/8ec994e7-64b4-44df-b8ac-bc24a14bf210" />
<img width="970" height="202" alt="image" src="https://github.com/user-attachments/assets/64c2e5be-6316-4760-9adf-8dcdb79effaa" />
<img width="970" height="827" alt="image" src="https://github.com/user-attachments/assets/f84caa58-0690-4183-9ab2-60778fe3a445" />
<img width="965" height="145" alt="image" src="https://github.com/user-attachments/assets/e85ab1a9-df4d-4b41-9081-c1b9e53b771b" />



From the project root:

```bash
python api_trading.py
```

You will see:

1. ASCII banner and a brief introduction.
2. Credential set selector (based on `api_trading.env`).
3. Automatic trading session creation.
4. Trading Menu:
   - `1) Search and Trade Markets`
   - `2) See Positions`
   - `3) See Orders`
   - `4) Back to Main Menu`

## Using the SDK directly

You can also use `almanac_sdk` directly in your own code:

```python
from pathlib import Path
from almanac_sdk import (
    AlmanacClient,
    load_credential_sets,
    get_credential_getter,
    fetch_clob_prices,
    update_markets_prices_from_clob,
)

sets = load_credential_sets(Path("api_trading.env"))
get_cred = get_credential_getter(sets, "default")
client = AlmanacClient(get_credential=get_cred)
client.create_trading_session()
```

