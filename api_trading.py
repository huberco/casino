#!/usr/bin/env python3
"""
Almanac API Interactive Trading Client (almanac_sdk-based)

Thin CLI wrapper around the reusable `almanac_sdk` package. This is a lighter,
maintainable version of the original `api_trading.py` script.

Features:
- Load credential sets from api_trading.env
- Start an Almanac trading session
- Search events/markets and place orders
- View positions and orders
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import requests
from tabulate import tabulate
from almanac_sdk import (
    ALMANAC_API_URL,
    AlmanacClient,
    extract_event_list,
    extract_outcomes_summary,
    format_price,
    format_timestamp,
    load_credential_sets,
    get_credential_getter,
    normalize_search_results,
    position_to_market_dict,
    update_markets_prices_from_clob,
)

ENV_PATH = Path("api_trading.env")
DEFAULT_POSITIONS_LIMIT = 25


def _select_credential_set() -> tuple[dict[str, dict[str, str]], str | None]:
    """Load env credential sets and prompt the user to choose one."""
    sets = load_credential_sets(ENV_PATH)
    if not sets:
        print("\nNo credential sets found in api_trading.env.")
        print("Please configure credentials first.")
        return {}, None

    names = sorted(sets.keys())
    print("\nAvailable credential sets:")
    for idx, name in enumerate(names, start=1):
        print(f"  {idx}) {name}")
    print(f"  {len(names) + 1}) Cancel")

    choice = input(f"\nSelect credential set (1-{len(names)+1}): ").strip()
    try:
        n = int(choice)
    except ValueError:
        print("Invalid input.")
        return sets, None
    if n == len(names) + 1:
        print("Cancelled.")
        return sets, None
    if not (1 <= n <= len(names)):
        print("Out of range.")
        return sets, None
    selected = names[n - 1]
    print(f"\nUsing credential set: {selected}")
    return sets, selected


def _build_client(sets: dict[str, dict[str, str]], name: str | None) -> AlmanacClient | None:
    if not sets or not name:
        return None
    get_cred = get_credential_getter(sets, name)
    client = AlmanacClient(get_credential=get_cred)
    return client


def _display_positions_table(positions_data: dict[str, Any] | None) -> None:
    if not positions_data:
        print("No positions data.")
        return
    positions = positions_data.get("data") or []
    if not isinstance(positions, list) or not positions:
        print("\nNo positions found.")
        return

    rows = []
    for idx, pos in enumerate(positions, start=1):
        title = pos.get("title") or "Unknown Market"
        outcome = pos.get("outcome") or "-"
        size = pos.get("size") or "0"
        avg_price = pos.get("avg_price") or "0"
        initial_value = pos.get("initial_value") or "0"
        current_value = pos.get("current_value") or "0"
        cash_pnl = pos.get("cash_pnl") or "0"
        percent_pnl = pos.get("percent_pnl") or "0"
        is_completed = pos.get("is_completed", False)
        status = "Completed" if is_completed else "Open"
        completed_at = pos.get("completed_at")
        rows.append(
            [
                str(idx),
                title[:35],
                outcome,
                f"{float(size):.2f}",
                format_price(avg_price),
                format_price(initial_value),
                format_price(current_value),
                f"{float(cash_pnl):+,.2f}",
                f"{float(percent_pnl):+.1f}%",
                status,
                format_timestamp(completed_at) if completed_at else "-",
            ]
        )

    headers = [
        "#",
        "Market",
        "Outcome",
        "Size",
        "Avg Price",
        "Initial Value",
        "Current Value",
        "P&L",
        "ROI",
        "Status",
        "Completed At",
    ]
    print("\nPositions:")
    print(tabulate(rows, headers=headers, tablefmt="grid", stralign="left"))


def _display_orders_table(orders_data: dict[str, Any] | None) -> None:
    if not orders_data:
        print("No orders data.")
        return
    orders = orders_data.get("data") or []
    if not isinstance(orders, list) or not orders:
        print("\nNo orders found.")
        return

    rows = []
    for idx, order in enumerate(orders, start=1):
        market_question = (
            order.get("marketQuestion")
            or order.get("title")
            or order.get("marketTitle")
            or "Unknown Market"
        )
        outcome = order.get("outcome") or "-"
        side = (order.get("side") or order.get("orderSide") or "-") or "-"
        if isinstance(side, str):
            side = side.upper()
        size_val = order.get("size") or order.get("quantity") or 0
        price_val = order.get("price") or 0
        filled_val = order.get("filledSize") or order.get("filled_size") or order.get("filled") or 0
        order_type = order.get("orderType") or order.get("order_type") or order.get("type") or "GTC"
        status = order.get("status") or order.get("orderStatus") or "unknown"
        created_at = order.get("createdAt") or order.get("created_at") or order.get("timestamp")
        completed_at = order.get("completedAt") or order.get("completed_at")
        try:
            size = float(size_val)
        except Exception:
            size = 0.0
        try:
            price = float(price_val)
        except Exception:
            price = 0.0
        try:
            filled = float(filled_val)
        except Exception:
            filled = 0.0
        rows.append(
            [
                str(idx),
                market_question[:35],
                outcome,
                side,
                f"{size:.2f}",
                format_price(price),
                f"{filled:.2f}" if filled > 0 else "-",
                order_type,
                status.capitalize() if isinstance(status, str) else status,
                format_timestamp(created_at),
                format_timestamp(completed_at) if completed_at else "-",
            ]
        )

    headers = [
        "#",
        "Market",
        "Outcome",
        "Side",
        "Size",
        "Price",
        "Filled",
        "Type",
        "Status",
        "Created",
        "Completed At",
    ]
    print("\nOrders:")
    print(tabulate(rows, headers=headers, tablefmt="grid", stralign="left"))


def _search_and_trade(client: AlmanacClient) -> None:
    query = input("\nEnter market search query: ").strip()
    if not query:
        print("Empty query. Cancelled.")
        return
    try:
        resp = requests.get(
            f"{ALMANAC_API_URL}/markets/search",
            params={"q": query, "limit": 10},
            timeout=30,
        )
        if resp.status_code != 200:
            print("Search failed:")
            try:
                print(json.dumps(resp.json(), indent=2))
            except Exception:
                print(resp.text)
            return
        payload = resp.json() or []
        results = normalize_search_results(payload)
        events = extract_event_list(results)
        if not events:
            print("No events found.")
            return

        print("\nSearch results (Events):")
        for idx, ev in enumerate(events, start=1):
            title = ev.get("title") or ev.get("question") or ev.get("name") or "Untitled Event"
            ev_id = ev.get("id") or ev.get("eventId") or ev.get("_id") or "unknown"
            print(f"  {idx}) {title} [{ev_id}]")

        sel = input("\nChoose an event by number (or Enter to cancel): ").strip()
        if not sel:
            print("Cancelled.")
            return
        try:
            ei = int(sel)
        except ValueError:
            print("Invalid selection.")
            return
        if not (1 <= ei <= len(events)):
            print("Out of range.")
            return
        chosen_event = events[ei - 1]

        # Fetch full event details (markets, etc.)
        event_id = chosen_event.get("id") or chosen_event.get("eventId") or chosen_event.get("_id")
        if event_id:
            try:
                event_resp = requests.get(f"{ALMANAC_API_URL}/markets/events/{event_id}", timeout=30)
                if event_resp.status_code == 200:
                    event_data = event_resp.json()
                    if isinstance(event_data, dict):
                        chosen_event = event_data.get("data") or event_data
            except Exception:
                pass

        markets = chosen_event.get("markets") or []
        if not isinstance(markets, list) or not markets:
            print("No markets found for this event.")
            return

        print("\nFetching latest prices from CLOB API for all markets...")
        markets = update_markets_prices_from_clob(markets)

        # Display simple markets table
        rows = []
        for idx, m in enumerate(markets, start=1):
            title = m.get("title") or m.get("question") or m.get("name") or "Untitled"
            m_id = m.get("id") or m.get("marketId") or m.get("_id") or "unknown"
            summary = extract_outcomes_summary(m)
            rows.append([str(idx), title[:50], summary, m_id])
        print("\nMarkets:")
        print(tabulate(rows, headers=["#", "Market", "Outcomes", "Market ID"], tablefmt="grid", stralign="left"))

        sel_m = input("\nChoose a market by number (or Enter to cancel): ").strip()
        if not sel_m:
            print("Cancelled.")
            return
        try:
            mi = int(sel_m)
        except ValueError:
            print("Invalid selection.")
            return
        if not (1 <= mi <= len(markets)):
            print("Out of range.")
            return
        market = markets[mi - 1]

        market_id = market.get("id") or market.get("marketId") or market.get("_id")
        if not market_id:
            print("Selected market missing id.")
            return

        # Prompt outcome / token id
        outcomes = market.get("outcomes") or []
        clob_token_ids = market.get("clob_token_ids") or []
        chosen_token_id = None
        if isinstance(outcomes, list) and outcomes:
            print("\nOutcomes:")
            for idx, o in enumerate(outcomes, start=1):
                name = o if isinstance(o, str) else (o.get("name") if isinstance(o, dict) else str(o))
                price = None
                prices = market.get("outcome_prices") or []
                if isinstance(prices, list) and idx - 1 < len(prices):
                    price = prices[idx - 1]
                print(f"  {idx}) {name} {format_price(price) if price is not None else ''}")
            sel_o = input("\nSelect outcome (or Enter to cancel): ").strip()
            if not sel_o:
                print("Cancelled.")
                return
            try:
                oi = int(sel_o)
            except ValueError:
                print("Invalid selection.")
                return
            if not (1 <= oi <= len(outcomes)):
                print("Out of range.")
                return
            if isinstance(clob_token_ids, list) and oi - 1 < len(clob_token_ids):
                chosen_token_id = clob_token_ids[oi - 1]

        # Order params
        side = input("Side (buy/sell) [buy]: ").strip().lower() or "buy"
        side_upper = "BUY" if side in ("buy", "b") else "SELL"
        size_str = input("Size (shares) [1]: ").strip() or "1"
        price_str = input("Price (0-1) [0.5]: ").strip() or "0.5"
        try:
            size = float(size_str)
            price = float(price_str)
        except ValueError:
            print("Invalid size or price.")
            return

        print(f"\nPlacing order: {side_upper} {size} @ {price} on {market_id}")
        resp = client.place_order(
            market_id=market_id,
            side_upper=side_upper,
            size=size,
            price=price,
            chosen_token_id=str(chosen_token_id) if chosen_token_id is not None else None,
        )
        if not resp:
            print("Order failed.")
        else:
            print("Order response:")
            print(json.dumps(resp, indent=2))

    except Exception as exc:
        print(f"Search error: {exc}")


def _trading_menu(client: AlmanacClient) -> None:
    while True:
        print("\nTrading Menu:")
        print("  1) Search and Trade Markets")
        print("  2) See Positions")
        print("  3) See Orders")
        print("  4) Back to Main Menu")
        choice = input("\nEnter choice: ").strip()
        if choice == "1":
            _search_and_trade(client)
        elif choice == "2":
            data = client.fetch_positions(filter_type="all", limit=DEFAULT_POSITIONS_LIMIT, offset=0)
            _display_positions_table(data)
        elif choice == "3":
            data = client.fetch_orders(status=None, limit=DEFAULT_POSITIONS_LIMIT, offset=0)
            _display_orders_table(data)
        elif choice == "4":
            break
        else:
            print("Invalid choice.")


def interactive_setup() -> None:
    """
    Entry point: choose credential set, start session, and open trading menu.
    """
    print(
        """
 __  __       _                        _      
|  \\/  | __ _| |__  _ __   __ _  __ _| | ___ 
| |\\/| |/ _` | '_ \\| '_ \\ / _` |/ _` | |/ _ \\
| |  | | (_| | |_) | |_) | (_| | (_| | |  __/
|_|  |_|\\__,_|_.__/| .__/ \\__,_|\\__, |_|\\___|
                    |_|            |___/      
Using reusable almanac_sdk module.
"""
    )

    sets, selected = _select_credential_set()
    client = _build_client(sets, selected)
    if not client:
        return

    print("\nCreating trading session...")
    session = client.create_trading_session()
    if not session:
        print("Failed to create trading session.")
        return
    print("Trading session created.")
    _trading_menu(client)


if __name__ == "__main__":
    interactive_setup()

