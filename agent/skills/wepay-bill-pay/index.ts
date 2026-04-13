import { OWSClient } from "@moonpay/ows";
import { MoonPayCLI } from "@moonpay/cli";
import { PinataSDK } from "pinata";

// OWS: policy-gated vault — enforces spending limits and signs transactions
const ows = new OWSClient({ vaultDir: process.env.OWS_VAULT_DIR! });

// MoonPay CLI: execution layer — submits signed transfers, handles onramp/offramp.
// Auth is handled by the CLI itself via `mp login` (credentials at ~/.config/moonpay/credentials.json).
// No API key required here — the MCP server runs as `mp mcp` with the user's local credentials.
const moonpay = new MoonPayCLI();

const pinata = new PinataSDK({
  pinataJwt:     process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

// ── Tool implementations ───────────────────────────────────────────────────

/**
 * wepay_pay — Execute an on-chain USDC payment from the OWS vault.
 * Only for payees with paymentMethod === "onchain" (wallet address or ENS).
 */
export async function wepay_pay({
  payeeId,
  amount,
  currency = "USDC",
  chain    = "eip155:8453",
}: {
  payeeId:  string;
  amount:   number;
  currency: string;
  chain:    string;
}): Promise<{ txHash: string; status: string }> {
  const payees = await loadPayees();
  const payee  = payees.find((p) => p.id === payeeId);
  if (!payee) throw new Error(`Payee ${payeeId} not found`);
  if (payee.paymentMethod === "lobster") {
    throw new Error(`${payee.name} is a fiat payee — use lobster_card_pay instead.`);
  }

  // Step 1: OWS policy check + sign — throws if spending limits exceeded
  const signed = await ows.signTransfer({
    to:       payee.address,
    amount:   amount.toString(),
    currency,
    chain,
    memo:     `WePay: ${payee.name}`,
  });

  // Step 2: MoonPay CLI submits the signed transaction on-chain
  const tx = await moonpay.transfer({
    signedTx: signed.signedTx,
    chain,
  });

  await logTransaction({
    payeeId,
    amount,
    currency,
    method:    "onchain",
    txHash:    tx.hash,
    timestamp: new Date().toISOString(),
    category:  payee.category,
  });

  return { txHash: tx.hash, status: "confirmed" };
}

/**
 * lobster_card_pay — Charge the user's Lobster.cash virtual Visa card.
 * Used for any fiat payee: utility websites, rent portals, subscriptions, etc.
 * Requires the lobstercash OpenClaw skill to be installed (clawhub.ai/crossmint/lobstercash).
 * This function is the WePay-side wrapper that logs the transaction; the actual
 * card charge is delegated to the lobster_card_pay tool provided by that skill.
 */
export async function lobster_card_pay({
  payeeId,
  merchant,
  url,
  amount,
  currency = "USD",
}: {
  payeeId:  string;
  merchant: string;
  url:      string;
  amount:   number;
  currency: string;
}): Promise<{ ref: string; status: string }> {
  // NOTE: The actual charge is handled by the lobstercash skill tool.
  // This wrapper exists to log the transaction in WePay's records.
  // The agent runtime calls the real lobster_card_pay tool from the lobstercash skill;
  // this function is invoked *after* that succeeds to persist the log entry.
  const payees = await loadPayees();
  const payee  = payees.find((p) => p.id === payeeId);
  if (payee?.paymentMethod !== "lobster") {
    throw new Error(`${merchant} is not configured as a fiat payee.`);
  }

  const ref = `lobster-${Date.now()}`;
  await logTransaction({
    payeeId,
    amount,
    currency,
    method:    "lobster",
    txHash:    ref,
    timestamp: new Date().toISOString(),
    category:  payee?.category ?? "other",
  });

  return { ref, status: "charged" };
}

/** wepay_balance — Check vault balance on Base */
export async function wepay_balance(): Promise<{ balance: string; currency: string; chain: string }> {
  const balance = await ows.getBalance({ chain: "eip155:8453", currency: "USDC" });
  return { balance: balance.formatted, currency: "USDC", chain: "Base" };
}

/** wepay_get_payees — List all configured payees */
export async function wepay_get_payees(): Promise<Payee[]> {
  return loadPayees();
}

/** wepay_add_payee — Add a new payee */
export async function wepay_add_payee(payee: Omit<Payee, "id">): Promise<Payee> {
  const payees   = await loadPayees();
  const newPayee = { ...payee, id: crypto.randomUUID() };
  payees.push(newPayee);
  await savePayees(payees);
  return newPayee;
}

/** wepay_spending_summary — Monthly spending breakdown */
export async function wepay_spending_summary(): Promise<{
  totalUSD:   number;
  byCategory: Record<string, number>;
  month:      string;
}> {
  const logs     = await loadTransactionLogs();
  const now      = new Date();
  const thisMonth = logs.filter((l) => {
    const d = new Date(l.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const total      = thisMonth.reduce((s, t) => s + t.amount, 0);
  const byCategory = thisMonth.reduce<Record<string, number>>((acc, t) => {
    const cat = t.category ?? "other";
    acc[cat] = (acc[cat] ?? 0) + t.amount;
    return acc;
  }, {});

  return {
    totalUSD: total,
    byCategory,
    month: now.toLocaleString("en", { month: "long" }),
  };
}

/** wepay_update_policy — Update a spending limit or pause payments */
export async function wepay_update_policy(update: {
  pausedUntil?: string;
  categoryLimits?: Array<{ category: string; maxUSD: number }>;
}): Promise<{ updated: boolean }> {
  // Load current policies, merge update, and set on OWS vault
  await ows.updatePolicy(update);
  return { updated: true };
}

// ── IPFS helpers ──────────────────────────────────────────────────────────

async function loadPayees(): Promise<Payee[]> {
  const cid = process.env.USER_PAYEES_CID;
  if (!cid) return [];
  try {
    const response = await pinata.gateways.get(cid);
    return JSON.parse(response as string) as Payee[];
  } catch {
    return [];
  }
}

async function savePayees(payees: Payee[]): Promise<void> {
  const file   = new File([JSON.stringify(payees)], "payees.json", { type: "application/json" });
  const result = await pinata.upload.public.file(file);
  // In production: update the agent's USER_PAYEES_CID env var via Pinata API
  process.env.USER_PAYEES_CID = result.cid;
}

async function loadTransactionLogs(): Promise<TransactionLog[]> {
  const cid = process.env.USER_TX_LOG_CID;
  if (!cid) return [];
  try {
    const response = await pinata.gateways.get(cid);
    return JSON.parse(response as string) as TransactionLog[];
  } catch {
    return [];
  }
}

async function logTransaction(tx: TransactionLog): Promise<void> {
  const existing = await loadTransactionLogs();
  existing.push(tx);
  const file   = new File([JSON.stringify(existing)], "transactions.json", { type: "application/json" });
  const result = await pinata.upload.public.file(file);
  process.env.USER_TX_LOG_CID = result.cid;
}

// ── Types ─────────────────────────────────────────────────────────────────

interface Payee {
  id:             string;
  name:           string;
  /** Wallet address / ENS for onchain; website URL for lobster */
  address:        string;
  category:       string;
  typicalAmount?: number;
  currency:       string;
  chain:          string;
  /** "onchain" = OWS vault USDC transfer; "lobster" = Lobster.cash virtual Visa card */
  paymentMethod:  "onchain" | "lobster";
}

interface TransactionLog {
  payeeId:   string;
  amount:    number;
  currency:  string;
  method:    "onchain" | "lobster";
  txHash:    string;
  timestamp: string;
  category?: string;
}
