# WePay — Decentralized Personal Finance Agent

WePay is a subscription-powered personal finance platform where every user gets a permanent ENS identity (`handle.wepay.eth`), a non-custodial spending vault, and a private AI agent that pays their bills — on-chain via USDC on Base or fiat via a Lobster.cash virtual Visa card.

**Live:** [wepay.eth](https://wepay.eth.limo) · **API:** [wepay-agent-production.up.railway.app](https://wepay-agent-production.up.railway.app/health)

---

## How It Works

```
User subscribes via Helio (USDC on Solana)
        │
        ▼
Backend webhook fires
  ├── OWS vault created (non-custodial, policy-gated)
  └── Pinata OpenClaw agent provisioned
        ├── WePay bill-pay skill (custom, IPFS)
        └── Lobstercash skill (ClawHub)
        │
        ▼
User claims handle.wepay.eth
  ├── EVM address → OWS vault (Base USDC)
  └── Solana address → Lobster.cash card wallet
        │
        ▼
User connects Telegram / WhatsApp
        │
        ▼
"Pay my electricity bill $120"
  ├── On-chain payee  → OWS vault signs → USDC on Base
  └── Fiat payee      → Lobster virtual Visa charged
```

---

## Core Components

### OWS — The Agent's Wallet

Every WePay user gets a **non-custodial spending vault** powered by MoonPay's Open Wallet Standard (OWS). This is the wallet the AI agent actually controls to move money on the user's behalf.

The key distinction from a regular wallet: OWS vaults are **policy-gated**. Before the agent can sign any transaction, it must pass through a rules engine the user configures during onboarding — daily limits, per-category caps (rent, utilities, food), a hard monthly ceiling, and optional pause windows. These rules are enforced cryptographically at the vault layer, not in software. That means even if the AI agent misbehaves, receives a malicious prompt, or gets compromised, it **cannot exceed the limits the user set**. The vault will simply refuse to sign.

The vault holds USDC on Base and pays on-chain payees (anyone with a wallet address or ENS name) directly. When a user says "pay Alice 50 USDC," the agent calls the OWS vault, which checks policy, signs the transfer, and submits it on Base — all without the user having to touch MetaMask or approve a transaction.

---

### ENS — One Name, Two Funding Rails

When a user claims `handle.wepay.eth`, the contract writes two address records to the ENS resolver in the same transaction:

- **Coin type 60 (EVM)** → the user's OWS vault address on Base. Anyone can send USDC, ETH, or any ERC-20 directly to `handle.wepay.eth` and it lands in the vault the agent controls.
- **Coin type 501 (Solana, ENSIP-9)** → the user's Lobster.cash card wallet on Solana. Anyone — or any protocol — can send USDC on Solana to the same ENS name and it flows directly into the funding pool for the user's virtual Visa card.

This means a user never needs to manage two separate addresses. They give out one name — `alice.wepay.eth` — and the sender's wallet resolves the correct chain automatically. The ENS subdomain is also a **forever name**: the `PARENT_CANNOT_CONTROL` fuse is burned at claim time, so WePay permanently loses the ability to reclaim or modify it. The user owns it unconditionally.

---

### MoonPay CLI — Seamless Funding and Conversion

Moving money between chains, currencies, and cards creates friction. The MoonPay CLI (`mp`) eliminates it by running as an MCP server (`mp mcp`) alongside the agent, exposing swap and transfer tools the AI can invoke directly in the conversation.

When a user's OWS vault is low, the agent can trigger a top-up via MoonPay's onramp — the user completes a one-time KYC flow and after that, buying USDC with a debit card is a single confirmed message. When a user wants to move funds from their vault to their Lobster card (to pre-load fiat spending), the CLI handles the USDC → Solana USDC bridge swap. The user never needs to visit an exchange, connect to a bridge UI, or manually copy addresses. They tell the agent "move $50 to my card" and the CLI executes the conversion path end-to-end.

Critically, the CLI authenticates via the user's locally stored credentials (`~/.config/moonpay/credentials.json`) so no API keys are held server-side for individual users. Each user's MoonPay session is isolated to their own agent container.

---

### Lobster.cash Virtual Visa — Fiat Payments, Everywhere

Not every bill accepts USDC. Rent portals, utility websites, streaming subscriptions, and most real-world merchants only accept card payments. Lobster.cash solves this by issuing each WePay user a **virtual Visa card** that is funded by USDC on Solana.

The card is accepted anywhere Visa is accepted — online or in-person via Apple Pay / Google Pay. The funding mechanism is entirely on-chain: the user holds USDC on Solana (sent to their `handle.wepay.eth` Solana address), and Lobster converts it to spendable card balance in real time.

Inside WePay, payees are tagged as either `onchain` (crypto wallet) or `lobster` (fiat). When the agent processes a fiat payee, it invokes the `lobster_card_pay` tool provided by the Lobstercash OpenClaw skill — this charges the virtual card directly without any manual steps. The agent logs the transaction and can check the remaining card balance with `lobster_card_balance`. The user never needs to open the Lobster app or manage the card manually.

---

### Pinata OpenClaw — A Secure, Isolated Agent per User

WePay does not run a shared AI agent that all users talk to. Each subscriber gets their own **dedicated OpenClaw container** provisioned on Pinata's agent infrastructure. This has significant security and privacy implications:

- **No cross-user data access.** Each agent has its own environment variables (`OWS_USER_TOKEN`, `USER_PAYEES_CID`, `USER_TX_LOG_CID`) scoped exclusively to that user. One agent cannot see another user's vault, payees, or transaction history.
- **Encrypted IPFS persistence.** Payee lists, transaction logs, and spending policies are stored on IPFS as AES-256-GCM encrypted blobs. The encryption key is derived from the user's ID and a server-side secret — Pinata stores ciphertext, never plaintext.
- **Skill isolation.** The agent's capabilities are explicitly bounded by the skills installed. It has exactly two: the WePay bill-pay skill (which defines the payment tools) and the Lobstercash skill (which provides the virtual card tools). It cannot browse the web, execute arbitrary code, or access anything outside those defined tools.
- **Prompt injection prevention.** The agent's system prompt explicitly instructs it to reject instructions embedded in forwarded messages, documents, or URLs — a common attack vector for agents that process user-generated content.
- **No private key exposure.** The OWS vault token (`OWS_USER_TOKEN`) authorizes the agent to request signatures from the vault, but the private key itself never leaves the OWS layer. Even with full access to the agent's environment, an attacker cannot extract the key.

When a new subscriber's Helio payment confirms, the backend provisions their agent automatically: creates the container, attaches the WePay skill (pinned to IPFS, identified by `WEPAY_SKILL_CID`) and installs the Lobstercash skill from ClawHub. The entire provisioning flow is non-interactive — by the time the user finishes onboarding, their agent is live and waiting on Telegram or WhatsApp.

---

### MoonPay Commerce — Subscriptions Without a Payment Processor

WePay charges $9.99/month. Instead of integrating Stripe (which requires a business bank account, KYC at the merchant level, and fiat settlement), WePay uses **MoonPay Commerce** to accept recurring USDC payments directly on Solana.

The user clicks "Subscribe" on the onboarding page, the Helio checkout widget opens (powered by MoonPay Commerce under the hood), and they pay USDC from any Solana wallet. No credit card required, no account creation, no email address — just a wallet signature. MoonPay Commerce handles the subscription state machine: it fires `SUBSCRIPTION_STARTED` when a new subscriber pays, `SUBSCRIPTION_PENDING_PAYMENT` on each monthly renewal, and `SUBSCRIPTION_ENDED` when the subscription lapses or is cancelled.

WePay's backend listens for these webhooks (verified by HMAC signature) and gates API access accordingly. The `requireAccess` middleware checks `accessExpiresAt` on every authenticated request — if a user's subscription lapses, their API access stops immediately without any manual intervention. When they renew, the webhook re-activates their access automatically. There is no manual billing management, no chargeback risk, and settlement is instant in USDC.

---

## Architecture

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (static export) · wagmi v2 · RainbowKit · Tailwind CSS |
| **Backend** | Express 5 · Prisma · Neon PostgreSQL · JWT auth |
| **Smart Contract** | Solidity 0.8.25 · ENS NameWrapper · OpenZeppelin v5 |
| **Vault** | MoonPay OWS (non-custodial, policy-gated) |
| **AI Agent** | Pinata OpenClaw (per-user isolated container) |
| **Agent Skills** | Custom WePay bill-pay (IPFS) + Lobstercash (ClawHub) |
| **Subscriptions** | Helio (USDC, Solana) — $9.99/mo |
| **Fiat Payments** | Lobster.cash virtual Visa card (funded by USDC on Solana) |
| **Messaging** | Telegram Bot API · WhatsApp Cloud API |
| **Hosting** | Frontend → Pinata IPFS → wepay.eth contenthash · Backend → Railway |

---

## Repository Structure

```
wepay/
├── frontend/                    Next.js 15 app (static export → IPFS)
│   └── src/app/
│       ├── page.tsx             Landing page
│       ├── onboard/             4-step onboarding flow
│       │   ├── page.tsx         Step 1: Connect wallet + subscribe
│       │   ├── policies/        Step 2: Set spending limits
│       │   ├── subdomain/       Step 3: Claim handle.wepay.eth
│       │   └── connect/         Step 4: Link Telegram / WhatsApp
│       └── dashboard/           User dashboard (vault, payees, settings)
│
├── backend/                     Express 5 API (deployed on Railway)
│   ├── src/
│   │   ├── index.ts             App entry point, middleware, routing
│   │   ├── routes/
│   │   │   ├── webhooks.ts      Helio · MoonPay · Telegram · WhatsApp
│   │   │   ├── vault.ts         OWS vault creation + spending policies
│   │   │   ├── ens.ts           ENS subdomain availability check
│   │   │   ├── payees.ts        CRUD for saved payees
│   │   │   ├── agents.ts        Pinata agent provisioning status
│   │   │   └── messaging.ts     Telegram link-token flow
│   │   ├── services/
│   │   │   ├── helio.service.ts     Subscription webhook verification
│   │   │   ├── moonpay.service.ts   Onramp webhook + OWS integration
│   │   │   ├── ows.service.ts       Non-custodial vault + policy management
│   │   │   ├── pinata.service.ts    OpenClaw agent provisioning + IPFS
│   │   │   ├── telegram.service.ts  Bot messaging + link-token linking
│   │   │   ├── whatsapp.service.ts  Cloud API messaging
│   │   │   └── user.service.ts      Subscription lifecycle helpers
│   │   ├── middleware/
│   │   │   ├── auth.ts          JWT Bearer token verification
│   │   │   ├── subscription.ts  requireAccess — blocks lapsed subscribers
│   │   │   └── rateLimit.ts     Global + webhook rate limits
│   │   ├── skills/
│   │   │   └── wepay-bill-pay.md    Agent skill definition (pinned to IPFS)
│   │   └── utils/
│   │       ├── ipfs.ts          Pinata SDK wrapper (upload / fetch)
│   │       ├── crypto.ts        AES-256-GCM encrypt/decrypt for user data
│   │       └── logger.ts        Pino structured logging
│   ├── prisma/schema.prisma     DB schema (User · Payee · Transaction · TelegramLinkToken)
│   └── scripts/
│       └── pin-wepay-skill.ts   One-time: pin skill.md to IPFS → get WEPAY_SKILL_CID
│
├── contracts/                   Hardhat project
│   ├── src/
│   │   └── WePaySubnameRegistrar.sol   ENS subdomain issuer
│   └── test/
│       └── WePaySubnameRegistrar.t.sol Foundry tests
│
├── agent/                       Agent reference files
│   ├── AGENTS.md                System prompt for OpenClaw agents
│   ├── skills/wepay-bill-pay/   Skill definition + tool implementations
│   ├── templates/wepay-agent.json   Agent template (name, model, channels)
│   └── mcp/mcporter.json        MCP server config (MoonPay CLI)
│
├── scripts/
│   └── deploy-frontend.ts       Pin Next.js out/ to Pinata → print CID for wepay.eth
│
└── Dockerfile                   Multi-stage build (node:24-slim, Prisma, dist/)
```

---

## Smart Contract — `WePaySubnameRegistrar`

**Mainnet:** [`0xF6ad4d9D3f62471909892D4c24E3BBDfA4c44f97`](https://etherscan.io/address/0xF6ad4d9D3f62471909892D4c24E3BBDfA4c44f97)

Issues permanent `handle.wepay.eth` subdomains via the ENS NameWrapper. Each subdomain is a **forever name** — WePay can never revoke it after it's claimed.

### Fuses burned on each subdomain

| Fuse | Value | Effect |
|---|---|---|
| `CANNOT_UNWRAP` | 1 | Stays in Locked state — cannot be unwrapped |
| `PARENT_CANNOT_CONTROL` | 65536 | WePay permanently loses control after claim |
| `CAN_EXTEND_EXPIRY` | 262144 | Owner can extend their own expiry independently |

Combined bitmask: **327681**

### ENS records set at claim time

| Record | Type | Value |
|---|---|---|
| ETH address (coin 60) | addr | User's OWS vault address on Base |
| `ows-vault` text | text | Same address as hex string |
| `url` text | text | `https://wepay.eth.limo/u/{handle}` |
| Solana address (coin 501) | addr | Lobster.cash card wallet (ENSIP-9) |

The Solana record means users can fund their Lobster virtual Visa by sending USDC on Solana directly to `handle.wepay.eth`.

### Key functions

```solidity
// Claim a new subdomain (called from frontend)
function claimSubdomain(
    string calldata handle,           // "alice" → alice.wepay.eth
    address owsVaultAddress,          // OWS vault on Base
    bytes calldata solanaCardAddress  // Lobster card Solana wallet (or empty bytes)
) external nonReentrant

// Update Solana card address (optional, for existing subdomains)
function updateSolanaAddress(string calldata handle, bytes calldata newSolanaAddress) external

// Check handle availability before claiming
function isAvailable(string calldata handle) external view returns (bool)
```

---

## Backend API

Base URL: `https://wepay-agent-production.up.railway.app`

All routes except `/webhooks/*` and `/health` require a `Authorization: Bearer <jwt>` header.

### Authentication

WePay uses SIWE (Sign-In With Ethereum). Connect wallet → sign message → backend returns a JWT.

### Routes

#### Vault (`/vault`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/vault` | Get vault address + creation date |
| `POST` | `/vault/create` | Create OWS non-custodial vault (once per user) |
| `POST` | `/vault/policies` | Set/update spending limits |

#### ENS (`/ens`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/ens/available/:handle` | Check if handle is available |

#### Payees (`/payees`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/payees` | List saved payees |
| `POST` | `/payees` | Add a payee |
| `PUT` | `/payees/:id` | Update a payee |
| `DELETE` | `/payees/:id` | Remove a payee |

#### Agents (`/agents`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/agents/status` | Check if Pinata agent is provisioned |
| `POST` | `/agents/provision` | Manually trigger agent provisioning |

#### Messaging (`/messaging`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/messaging/telegram/link` | Generate a one-time Telegram link token |

#### Webhooks (`/webhooks`) — no auth required
| Method | Path | Source |
|---|---|---|
| `POST` | `/webhooks/helio` | Helio subscription events |
| `POST` | `/webhooks/moonpay` | MoonPay onramp events |
| `POST` | `/webhooks/telegram` | Telegram Bot updates |
| `GET/POST` | `/webhooks/whatsapp` | WhatsApp Cloud API |

### Webhook lifecycle (Helio)

```
SUBSCRIPTION_STARTED
  → activateMonthlyAccess()       set subscriptionStatus = "active", accessExpiresAt = now+30d
  → OWSService.createVault()      provision non-custodial OWS vault
  → PinataAgentService.provisionAgent()
      → create OpenClaw agent
      → attach WePay bill-pay skill (WEPAY_SKILL_CID)
      → install lobstercash skill from ClawHub

SUBSCRIPTION_PENDING_PAYMENT
  → renewMonthlyAccess()          extend accessExpiresAt by 30d

SUBSCRIPTION_ENDED
  → markSubscriptionCancelled()   sets subscriptionStatus = "cancelled"
                                  access lapses naturally at accessExpiresAt
```

---

## Pinata Agent

Each subscriber gets a dedicated [OpenClaw](https://pinata.cloud/agents) agent container with two skills:

### 1. WePay Bill-Pay (custom)
Defined in `backend/src/skills/wepay-bill-pay.md` and pinned to IPFS. Handles:
- Paying bills via two routes (on-chain USDC or Lobster fiat card)
- Checking vault balance and Lobster card balance
- Managing payees (add, list, update)
- Spending summaries and monthly breakdowns
- Pausing payments / updating spending limits
- Splitting bills among contacts

### 2. Lobstercash (ClawHub)
Installed from `clawhub.ai/crossmint/lobstercash`. Provides the `lobster_card_pay` and `lobster_card_balance` tools that charge the user's Lobster.cash virtual Visa card.

### Payment routing

| Payee type | Method | Execution |
|---|---|---|
| Crypto wallet / ENS name | `onchain` | OWS vault signs → USDC on Base |
| Utility / subscription / any website | `lobster` | Lobster.cash virtual Visa card |

The agent auto-detects from the stored `paymentMethod` field. For new payees it asks: *"Does [name] accept crypto, or do they only take regular payments?"*

### Channels
Agents receive messages via **Telegram** and **WhatsApp**. Users link their account through the onboarding flow (step 4).

---

## Database Schema

```
User
  ├── subscriptionId, subscriptionStatus, accessExpiresAt   ← Helio subscription
  ├── vaultAddress, encryptedVaultBlob, owsUserToken        ← OWS vault
  ├── handle, ensClaimed                                    ← ENS subdomain
  ├── payeesCid, txLogCid, policiesCid                      ← IPFS-stored data
  ├── pinataAgentId                                         ← OpenClaw agent
  └── telegramChatId, whatsappPhoneId                       ← Messaging

Payee       — saved payment recipients per user
Transaction — payment history (on-chain + fiat)
TelegramLinkToken — one-time tokens for bot linking
```

---

## Deployment

### Backend (Railway)

The backend is deployed on Railway using the `Dockerfile` at the repo root. Railway reads `backend/railway.json` for the start command.

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://...           # Neon PostgreSQL connection string

# Auth
JWT_SECRET=                             # Random 32+ char secret

# OWS (MoonPay non-custodial vault)
OWS_API_KEY=
OWS_API_SECRET=

# Helio (subscription payments)
HELIO_API_KEY=
HELIO_WEBHOOK_SECRET=

# MoonPay (onramp)
MOONPAY_WEBHOOK_SECRET=

# Pinata (IPFS + AI agents)
PINATA_JWT=
PINATA_GATEWAY=                         # e.g. your-gateway.mypinata.cloud
WEPAY_SKILL_CID=                        # CID from: cd backend && npm run pin-skill

# Telegram Bot
TELEGRAM_BOT_TOKEN=

# WhatsApp Cloud API
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=

# Encryption
VAULT_ENCRYPTION_SECRET=               # Random 32+ char secret for AES-256-GCM

# Runtime
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://wepay.eth.limo
```

### Frontend (IPFS → wepay.eth)

```bash
# 1. Build static export
cd frontend
npm run build              # outputs to frontend/out/

# 2. Pin to Pinata
cd ../backend
npx tsx ../scripts/deploy-frontend.ts
# → prints CID: bafybei...

# 3. Set wepay.eth contenthash
# ENS Manager → wepay.eth → Content Hash → ipfs://<CID>
```

### Contract (Ethereum Mainnet)

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.js --network mainnet

# After deploy: approve as NameWrapper operator
cast send 0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401 \
  "setApprovalForAll(address,bool)" \
  <NEW_REGISTRAR_ADDRESS> true \
  --private-key $PRIVATE_KEY \
  --rpc-url https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY
```

---

## Local Development

```bash
# Clone
git clone https://github.com/RWA-ID/wepay-agent
cd wepay-agent

# Backend
cd backend
cp .env.example .env      # fill in required vars
npm install
npm run db:migrate        # apply Prisma migrations
npm run dev               # starts on http://localhost:3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev               # starts on http://localhost:3000
```

---

## Onboarding Flow

```
/onboard          Connect wallet → subscribe via Helio ($9.99/mo USDC)
      ↓
/onboard/policies  Set monthly spending limits per category
      ↓
/onboard/subdomain  Claim handle.wepay.eth + link OWS vault + Solana card address
      ↓
/onboard/connect   Link Telegram or WhatsApp to activate the AI agent
      ↓
/dashboard         Vault balance · payees · transaction history · settings
```

---

## Mainnet Deployments

| Contract | Address |
|---|---|
| `WePaySubnameRegistrar` | [`0xF6ad4d9D3f62471909892D4c24E3BBDfA4c44f97`](https://etherscan.io/address/0xF6ad4d9D3f62471909892D4c24E3BBDfA4c44f97) |
| ENS NameWrapper | [`0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401`](https://etherscan.io/address/0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401) |
| ENS Public Resolver | [`0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63`](https://etherscan.io/address/0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63) |

**`wepay.eth` node:** `0x783b76a8de513b3731a5998d7770987e5ff5aaa322aee1871ad6b16b0a561861`

---

## Security

- **Non-custodial vault** — private keys never leave the user's device. The OWS vault enforces spending limits at the cryptographic layer; the AI agent cannot override them.
- **PARENT_CANNOT_CONTROL** — once a subdomain is claimed, WePay permanently loses the ability to reclaim or modify it.
- **JWT auth** — all authenticated API routes require a short-lived JWT signed from a wallet.
- **Webhook signatures** — all inbound webhooks (Helio, MoonPay, WhatsApp) are verified via HMAC before processing.
- **AES-256-GCM** — all user data pinned to IPFS (payees, transaction logs, policies) is encrypted server-side before upload.
- **Prompt injection prevention** — agents are instructed to never process instructions embedded in documents, URLs, or forwarded messages.
- **Rate limiting** — global rate limit on all routes + stricter limit on webhook endpoints.

---

## Tech Stack Versions

| Package | Version |
|---|---|
| Next.js | 15 |
| Express | 5 |
| Prisma | 5 |
| wagmi | 2 |
| viem | 2 |
| RainbowKit | 2 |
| Pinata SDK | 2 |
| Solidity | 0.8.25 |
| OpenZeppelin | 5 |
| Node.js | 24 |

---

## License

MIT
