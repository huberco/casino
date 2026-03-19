import { ethers } from "ethers";
import {
  ClobClient,
  Side,
  OrderType,
  Chain,
  type ClobSigner,
} from "@polymarket/clob-client";
import type { Config } from "./config.js";

/** Create ethers Wallet from private key hex (with or without 0x) */
export function createWallet(privateKey: string): ethers.Wallet {
  const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  return new ethers.Wallet(key);
}

/**
 * @polymarket/clob-client types ClobSigner as ethers v5 (_signTypedData) or viem WalletClient.
 * ethers v6 Wallet only exposes signTypedData, so we adapt it to the expected shape.
 */
function walletToClobSigner(wallet: ethers.Wallet): ClobSigner {
  return {
    getAddress: () => wallet.getAddress(),
    _signTypedData: (domain, types, value) =>
      wallet.signTypedData(
        domain as ethers.TypedDataDomain,
        types as Record<string, ethers.TypedDataField[]>,
        value as Record<string, unknown>
      ),
  };
}

/** Build authenticated CLOB client for order placement */
export async function createClobClient(cfg: Config["polymarket"]): Promise<ClobClient> {
  const pk = cfg.private_key;
  if (!pk) throw new Error("private_key is required in config");
  const wallet = createWallet(pk);
  const signer = walletToClobSigner(wallet);
  const host = cfg.clob_api_url.replace(/\/$/, "");

  let apiCreds: { key: string; secret: string; passphrase: string } | undefined;
  if (cfg.api_key && cfg.api_secret && cfg.api_passphrase) {
    apiCreds = {
      key: cfg.api_key,
      secret: cfg.api_secret,
      passphrase: cfg.api_passphrase,
    };
  }

  const client = new ClobClient(host, Chain.POLYGON, signer, apiCreds);
  if (!apiCreds) {
    // Try derive first (restores existing key). createApiKey() often returns 400 "Could not create api key" if the account already has a key.
    let creds: { key: string; secret: string; passphrase: string } | null = null;
    try {
      const derived = await client.deriveApiKey();
      if (derived?.key && derived?.secret && derived?.passphrase) {
        creds = derived;
      }
    } catch {
      // derive failed (e.g. no existing key), fall through to create
    }
    if (!creds) {
      try {
        const created = await client.createApiKey();
        if (created?.key && created?.secret && created?.passphrase) {
          creds = created;
        }
      } catch (e) {
        throw new Error(
          "CLOB API key failed: create and derive both failed. If you already have a key, add api_key, api_secret, api_passphrase to config.json (from polymarket.com/settings?tab=builder). Error: " +
            String(e instanceof Error ? e.message : e)
        );
      }
    }
    if (!creds) {
      throw new Error("CLOB API key derivation/creation returned no credentials. Add api_key, api_secret, api_passphrase to config.json.");
    }
    return new ClobClient(host, Chain.POLYGON, signer, creds);
  }
  return client;
}

export interface PlaceLimitOrderParams {
  tokenId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  tickSize?: "0.1" | "0.01" | "0.001" | "0.0001";
  negRisk?: boolean;
}

/** Place a limit order using createAndPostOrder */
export async function placeLimitOrder(
  client: ClobClient,
  params: PlaceLimitOrderParams
): Promise<{ orderID: string; status: string }> {
  const side = params.side === "BUY" ? Side.BUY : Side.SELL;
  const tickSize = params.tickSize ?? "0.01";
  const negRisk = params.negRisk ?? false;
  const result = await client.createAndPostOrder(
    {
      tokenID: params.tokenId,
      price: params.price,
      size: params.size,
      side,
    },
    { tickSize, negRisk },
    OrderType.GTC
  );
  return {
    orderID: (result as { orderID?: string }).orderID ?? (result as { id?: string }).id ?? "",
    status: (result as { status?: string }).status ?? "unknown",
  };
}
