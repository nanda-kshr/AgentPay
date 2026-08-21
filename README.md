# AgentPay ⚡

> **Autonomous Machine Commerce & Ephemeral Payment Protocol Simulator**  
> Built with Next.js, TypeScript, Tailwind CSS, and MongoDB.

---

## 📌 Overview

**AgentPay** is an autonomous-commerce protocol simulator demonstrating how AI agents can safely perform financial transactions without relying on legacy OTP/human-in-the-loop payment flows.

The interface offers two primary views:
- **🤖 Agentic View**: Autonomous planning (e.g. *“I want to go to Japan”*), budget constraint satisfaction, concise status updates, and one-click *Approve & Pay*.
- **🏪 Shopkeeper's View**: Merchant terminal displaying incoming settled orders, merchant identity and spending policies, inventory, and machine-readable cryptographic receipts.

---

## 🔒 The Protocol Execution Flow

```
1. Agent Planning ➔ 2. Policy Check ➔ 3. 60s Ephemeral Credential ➔ 4. Gateway Settlement ➔ 5. Verified Receipt
```

---

# AgentPay Security Model

AgentPay is designed around a simple principle: **an AI agent should never receive permanent, unrestricted authority to spend money**. Instead of giving the agent a reusable API key, banking credential, card credential, or OTP, AgentPay uses a combination of **persistent agent identity, short-lived ephemeral payment credentials, transaction binding, policy enforcement, replay protection, and cryptographic receipts**. The permanent identity establishes who the agent is, but it does not itself grant spending authority. When an agent wants to make a purchase, AgentPay evaluates the requested transaction against the user's and merchant's policies, including the amount, merchant, purpose, currency, expiration window, spending limits, and other applicable constraints. If the transaction is permitted, AgentPay generates a short-lived **ephemeral payment credential** that is valid only for a limited period, such as 60 seconds, and is bound to the exact transaction. The credential contains or cryptographically commits to the **agent identity, merchant identity, amount, currency, purpose, timestamp, expiry time, and unique nonce/transaction identifier**, so changing any important parameter invalidates the authorization. The credential is also intended to be **single-use**, meaning that after a successful payment or explicit consumption, it cannot be reused for another transaction.

The permanent agent identity key is therefore separated from transaction-level payment authority. Even if the long-lived identity key were compromised, possession of that key should not automatically provide unlimited spending access because the payment service still requires a valid transaction-specific authorization that satisfies the current policy. AgentPay can additionally support key rotation, agent revocation, and secure key storage for the long-lived identity. For every payment request, the payment service independently verifies the agent identity, the cryptographic signature, the validity and expiration of the authorization, the transaction parameters, the merchant, the nonce, and whether the authorization has already been consumed. The agent is never trusted simply because it claims that it is authorized.

A critical part of the model is **transaction binding**. Suppose an agent is authorized to spend ₹58,000 at a specific hotel. An attacker who intercepts that authorization cannot simply modify the amount to ₹1,58,000 or redirect the payment to another merchant, because those fields are cryptographically bound to the authorization. Any modification results in a signature or authorization mismatch and the transaction is rejected. Similarly, an attacker cannot replay an old successful authorization because each authorization contains a unique nonce or transaction identifier and the system records whether that authorization has already been consumed. A payment attempted after the credential's expiration time is also rejected, even if the credential was originally legitimate.

AgentPay also uses **policy-based authorization** rather than relying solely on cryptographic identity. Policies can define limits such as maximum transaction value, cumulative spending limits, permitted merchants, permitted purposes, allowed agent categories, authorization lifetime, transaction frequency, and other risk constraints. This means a valid agent with a valid cryptographic identity can still be denied if the requested transaction falls outside its current spending policy. For example, an agent may be allowed to spend ₹500 on approved travel services but be prevented from spending ₹50,000 or paying an untrusted merchant. The policy engine therefore acts as a second security boundary between agent identity and financial authorization.

The system is also designed around **human control without requiring OTP for every normal transaction**. The user gives the agent permission to operate within defined boundaries and reviews the final proposed purchase or trip before execution. Once approved, individual transactions can be authorized automatically through the AgentPay protocol. For exceptional or high-risk transactions, the simulator can demonstrate additional controls such as stricter limits, risk-based rejection, delayed execution, or renewed human approval. This allows autonomous operation for routine transactions while maintaining stronger protection for unusual or high-value actions.

After a payment is executed, AgentPay generates a **cryptographically verifiable receipt** containing information such as the transaction identifier, authorization identifier, merchant, amount, timestamp, status, and cryptographic proof/signature. The receipt allows the agent and the simulator to independently verify that the payment result corresponds to the original authorization. This creates an auditable chain from **agent request → policy decision → authorization → payment execution → verified receipt**.

For the prototype, the payment rail is simulated rather than connected directly to a production banking or UPI infrastructure. The mock payment gateway intentionally reproduces the security checks that a real payment processor would perform: authorization validation, signature verification, expiry verification, transaction binding, nonce/replay detection, merchant validation, policy validation, and transaction recording. This allows AgentPay to demonstrate the security protocol independently of whether a commercial payment gateway natively supports the proposed mechanism.

The simulator also includes an **attack simulation layer** to demonstrate the security properties of the protocol. Test scenarios include stealing and reusing an ephemeral credential, modifying the authorized amount, changing the merchant, attempting a replay of a completed transaction, and attempting to use an expired credential. Each attack should be rejected by a specific security control rather than simply returning a generic failure. This makes the security model observable and demonstrates that the protection comes from cryptographic binding and policy enforcement rather than from the user manually entering an OTP.

### Core Security Principles

- **No permanent payment authority:** The agent never receives unrestricted access to the user's funds.
- **Persistent identity, temporary authority:** A long-lived key identifies the agent, while actual spending permission is granted through short-lived transaction credentials.
- **60-second-style ephemeral authorization:** Payment credentials expire quickly and are designed for a narrow execution window.
- **Transaction-bound authorization:** The credential is tied to the exact merchant, amount, currency, purpose, and transaction.
- **Single-use credentials:** Successful or consumed authorizations cannot be replayed.
- **Cryptographic verification:** The payment service verifies signatures and authorization independently instead of trusting agent-provided claims.
- **Policy enforcement:** Identity alone is insufficient; every transaction must satisfy spending and merchant policies.
- **Replay protection:** Nonces and transaction identifiers prevent reuse of previously valid authorizations.
- **Merchant verification:** The authorized counterparty is part of the payment authorization and cannot be silently replaced.
- **Human-controlled boundaries:** The user defines or approves the operating boundaries, while routine transactions can execute without repeated OTP interaction.
- **Auditable receipts:** Every completed payment produces a verifiable machine-readable receipt.
- **Fail closed:** If a credential is expired, modified, replayed, malformed, or outside policy, the payment is rejected rather than executed.

---

## 🗄️ MongoDB Collections

The simulator persists data across 8 MongoDB collections:

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
│   ├── layout.tsx         # Root layout (Light mode)
│   └── page.tsx           # Interactive UI (Agentic & Shopkeeper views)
├── lib/
│   ├── crypto.ts          # HMAC-SHA256, nonce generator, and verification helpers
│   ├── db.ts              # MongoDB connection client singleton
│   ├── engine.ts          # Planning engine & payment gateway validation logic
│   ├── seed-data.ts       # Predefined merchants, catalog products, and policies
│   └── types.ts           # Core TypeScript interfaces
└── package.json
```
