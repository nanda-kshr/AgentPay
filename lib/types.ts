export type MerchantCategory = 'airline' | 'hotel' | 'transport' | 'experience' | 'shopping' | 'cloud_compute';

export interface SecurityPolicy {
  maxTransactionAmount: number;
  authorizationLifetimeSeconds: number; // e.g., 60
  allowedAgentTypes: string[];
  requireFreshAuthorization: boolean;
  allowedCurrencies: string[];
}

export interface Merchant {
  id: string;
  name: string;
  category: MerchantCategory;
  destination: string;
  identityHash: string;
  publicKey: string;
  securityPolicy: SecurityPolicy;
}

export interface Product {
  id: string;
  merchantId: string;
  merchantName: string;
  category: MerchantCategory;
  destination: string;
  title: string;
  description: string;
  price: number;
  tier: 'economy' | 'standard' | 'luxury';
  inventory: number;
  tags: string[];
}

export interface AgentIdentity {
  id: string;
  name: string;
  type: string;
  publicKey: string;
  reputationScore: number;
  status: 'active' | 'suspended';
}

export interface EphemeralCredential {
  id: string; // auth_xxx
  agentId: string;
  merchantId: string;
  amount: number;
  currency: string;
  purpose: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  signature: string; // HMAC-SHA256 of payload
  status: 'active' | 'consumed' | 'expired' | 'revoked';
}

export interface PaymentReceipt {
  receiptId: string;
  transactionId: string;
  authorizationId: string;
  agentId: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  nonce: string;
  timestamp: number;
  receiptHash: string;
  gatewaySignature: string;
  verified: boolean;
}

export interface TransactionRecord {
  id: string;
  authorizationId: string;
  agentId: string;
  merchantId: string;
  merchantName: string;
  productId: string;
  productTitle: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'rejected';
  failureReason?: string;
  timestamp: number;
  receipt?: PaymentReceipt;
}

export interface TripRequest {
  id: string;
  query: string;
  destination: string;
  durationDays: number;
  budget: number;
  comfortLevel: 'economy' | 'standard' | 'luxury';
  interests: string[];
}

export interface PlannedItem {
  product: Product;
  reason: string;
}

export interface PlanRecommendation {
  tripRequestId: string;
  items: PlannedItem[];
  totalCost: number;
  budget: number;
  budgetRemaining: number;
  summaryReasoning: string;
}
