# WePay Bill Pay Skill

## Triggers
This skill activates when the user:
- Asks to pay a bill, send money, or make a transfer
- Asks about their balance
- Asks to add, edit, or list payees
- Asks for a spending summary or history
- Asks to pause or change spending limits
- Mentions bill names (e.g. "light bill", "rent", "Netflix")

## Payment Routing

Every payee has a `paymentMethod` field that controls how the payment is sent:

| `paymentMethod` | When to use | Execution |
|---|---|---|
| `"onchain"` | Payee has a wallet address (0x… or ENS name) | `wepay_pay` — OWS vault signs + submits on Base |
| `"lobster"` | Payee is a company/service (rent portal, utility, subscription) | `lobster_card_pay` — Lobster.cash virtual Visa card, funded by USDC |

**Never assume — if you are unsure which method to use, look at the payee's stored `paymentMethod`. If the payee is new, ask: "Is [name] a crypto wallet or a regular company?" and set accordingly.**

## Instructions

### Paying a Bill
1. Identify the payee from the user's message (fuzzy match against stored payees via `wepay_get_payees`)
2. If multiple payees match, ask for clarification
3. If no payee matches, ask if they want to add a new payee (collect name, address-or-URL, category, typical amount, and paymentMethod)
4. State the confirmation based on payment method:
   - On-chain: "I'll send $[amount] USDC to [payee name] at [address] on Base. Confirm? (yes/no)"
   - Fiat (Lobster): "I'll charge $[amount] to your Lobster virtual card for [payee name]. Confirm? (yes/no)"
5. On confirmation, call the appropriate tool:
   - On-chain: `wepay_pay` with `{ payeeId, amount, currency: "USDC", chain: "base" }`
   - Fiat: `lobster_card_pay` with `{ merchant: payee.name, url: payee.address, amount, currency: "USD" }`
6. Return success message:
   - On-chain: "✅ Paid $[amount] USDC to [payee name]. Tx: [hash]"
   - Fiat: "✅ Charged $[amount] to your Lobster card for [payee name]. Ref: [ref]"
7. If OWS policy blocks: "⚠️ This payment exceeds your [category] monthly limit of $[limit]. Reply 'update limit' to change it."
8. If Lobster card has insufficient balance: "⚠️ Your Lobster card needs more funds. Top up at lobster.cash then retry."

### Checking Balance
Call `wepay_balance`. Return: "Your WePay vault holds [amount] USDC on Base."

### Splitting a Bill
1. Ask for total amount and number of people (or names)
2. Calculate per-person amount
3. Confirm the full split: "Split $[total] → $[each] per person to [list]. Confirm?"
4. On confirmation: call `wepay_pay` once per recipient
5. Return a summary of all transactions

### Adding a Payee
Collect via conversation: name, payment address/URL/ENS, category (utilities/rent/food/subscriptions/other), typical amount.
Also ask: "Does [name] accept crypto, or do they only take regular payments?" → set `paymentMethod: "onchain"` or `"lobster"` accordingly.
Call `wepay_add_payee`. Confirm: "✅ Added [name] as a payee."

### Showing Spending Summary
Call `wepay_spending_summary`. Format:
```
This month's spending:
• Utilities: $[amount]
• Rent: $[amount]
• Food: $[amount]
• Other: $[amount]
──────────────────
Total: $[total]
```

### Pausing Payments
Call `wepay_update_policy` with `{ pausedUntil: "<ISO date>" }`.
Confirm: "⏸ Payments paused until [date]. Reply 'resume payments' to cancel the pause."

## Available Tools
- `wepay_pay` — On-chain USDC payment from the OWS vault (crypto payees only)
- `wepay_balance` — Check vault USDC balance on Base
- `wepay_get_payees` — List configured payees
- `wepay_add_payee` — Add a new payee
- `wepay_spending_summary` — Monthly spending breakdown by category
- `wepay_update_policy` — Update a spending limit or pause payments
- `lobster_card_pay` — Charge the Lobster.cash virtual Visa card (fiat payees: utilities, rent, subscriptions, any website)
- `lobster_card_balance` — Check remaining balance on the Lobster virtual card
