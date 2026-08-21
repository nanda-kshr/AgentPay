# AgentPay ⚡

> **Autonomous Machine Commerce & Ephemeral Payment Protocol Simulator**  
> Built with Next.js, TypeScript, Tailwind CSS, and MongoDB.

---

## 📌 Overview

**AgentPay** is an autonomous-commerce protocol simulator demonstrating how AI agents can safely perform financial transactions without relying on legacy OTP/human-in-the-loop payment flows.

Instead of granting an AI agent persistent access to funds or credit cards, AgentPay uses **bounded, short-lived ephemeral credentials (60s TTL)** that are cryptographically locked to a specific merchant, amount, purpose, transaction ID, and single-use nonce.

Travel is used as the initial intuitive scenario (flights, hotels, transport, experiences, shopping), but the underlying protocol applies to cloud compute, API micropayments, SaaS procurement, and M2M autonomous settlements.

---

## 🔒 The 7-Step Payment Execution Pipeline

```
Agent Verified ➔ Merchant Verified ➔ Policy Checked ➔ Ephemeral Credential Issued ➔ Tx Authorized ➔ Payment Executed ➔ Receipt Verified
```

1. **Agent Verified**: Validates the agent identity, reputation score, and public key.
2. **Merchant Verified**: Confirms the merchant's cryptographic identity and destination registry.
3. **Policy Checked**: Enforces merchant-defined security constraints (max transaction limit, currency, agent whitelist).
4. **Ephemeral Credential Issued**: Generates a single-use token valid for 60 seconds with an HMAC-SHA256 signature and cryptographic nonce.
5. **Transaction Authorized**: Binds token strictly to the target transaction and amount.
6. **Payment Executed**: Mock payment gateway verifies signature, nonce freshness, and authorization boundaries before updating ledger.
7. **Receipt Verified**: Produces an immutable, machine-readable cryptographic receipt containing a SHA-256 state hash.

---

## 🛡️ Security Simulator (Attack Vectors)

AgentPay includes a dedicated interactive security playground demonstrating protection against compromised or intercepted tokens:

| Attack Vector | Simulated Behavior | Gateway Decision |
| :--- | :--- | :--- |
| **Amount Tampering** | Attacker attempts to charge \$999 on a \$260 authorization | `Blocked — authorization mismatch` |
| **Merchant Redirection** | Diverts funds to rogue merchant (`merch_rogue_shadow_corp`) | `Blocked — merchant mismatch` |
| **Nonce Replay** | Replays an already consumed token | `Blocked — nonce already consumed` |
| **Credential Expiry** | Submits valid token after 60s lifetime has elapsed | `Blocked — credential expired` |
| **Signature Forgery** | Submits tampered HMAC signature | `Blocked — cryptographic signature mismatch` |

---

## 🗄️ MongoDB Collections

The system stores and manages state across 8 MongoDB collections:

- `merchants`: Merchant identity, category, destination, public key, and security policy rules.
- `products`: Catalog items, price tiers, inventory, and category tags.
- `agents`: Autonomous agent profiles, public keys, and reputation scores.
- `trip_requests`: User prompts, budget, comfort level, and constraint records.
- `recommendations`: Agent-optimized multi-merchant itineraries and selection reasoning.
- `authorizations`: Short-lived single-use ephemeral credentials with status (`active` / `consumed`).
- `transactions`: Completed settlement logs.
- `receipts`: Signed machine-readable cryptographic receipts.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB instance (Atlas or local `mongod`)

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb://localhost:27017/agentpay
AGENTPAY_SECRET_KEY=your-secure-cryptographic-signing-key
```

### 3. Install & Run
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── app/
│   ├── api/
│   │   ├── init/          # Initializes DB collections & seeds marketplace
│   │   ├── plan/          # Autonomous itinerary planner & constraint solver
│   │   ├── authorize/     # Ephemeral credential generator (HMAC-SHA256)
│   │   ├── pay/           # Mock gateway processor & receipt signer
│   │   ├── attack/        # Security attack test bench
│   │   └── transactions/  # Ledger of verified receipts
│   ├── globals.css        # Tailwind CSS styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Interactive UI (Simulator, Attacks, Policies, Ledger)
├── lib/
│   ├── crypto.ts          # HMAC-SHA256, nonce generator, and verification helpers
│   ├── db.ts              # MongoDB connection client singleton
│   ├── engine.ts          # Planning engine & payment gateway validation logic
│   ├── seed-data.ts       # Predefined merchants, catalog products, and policies
│   └── types.ts           # Core TypeScript interfaces
└── package.json
```
