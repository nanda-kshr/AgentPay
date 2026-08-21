import crypto from 'node:crypto';
import { EphemeralCredential, PaymentReceipt } from './types';

const SECRET_SIGNING_KEY = process.env.AGENTPAY_SECRET_KEY || 'agentpay-autonomous-settlement-secret-2026';

export function generateNonce(): string {
  return 'nonce_' + crypto.randomBytes(16).toString('hex');
}

export function hashString(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function createCredentialSignature(payload: {
  id: string;
  agentId: string;
  merchantId: string;
  amount: number;
  currency: string;
  purpose: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}): string {
  const canonicalString = `${payload.id}|${payload.agentId}|${payload.merchantId}|${payload.amount.toFixed(2)}|${payload.currency}|${payload.purpose}|${payload.nonce}|${payload.issuedAt}|${payload.expiresAt}`;
  return crypto.createHmac('sha256', SECRET_SIGNING_KEY).update(canonicalString).digest('hex');
}

export function verifyCredentialSignature(credential: EphemeralCredential): boolean {
  const expectedSig = createCredentialSignature({
    id: credential.id,
    agentId: credential.agentId,
    merchantId: credential.merchantId,
    amount: credential.amount,
    currency: credential.currency,
    purpose: credential.purpose,
    nonce: credential.nonce,
    issuedAt: credential.issuedAt,
    expiresAt: credential.expiresAt,
  });
  return crypto.timingSafeEqual(Buffer.from(credential.signature), Buffer.from(expectedSig));
}

export function generateReceiptSignature(payload: {
  receiptId: string;
  transactionId: string;
  authorizationId: string;
  agentId: string;
  merchantId: string;
  amount: number;
  nonce: string;
  timestamp: number;
}): { receiptHash: string; gatewaySignature: string } {
  const canonicalReceipt = `${payload.receiptId}|${payload.transactionId}|${payload.authorizationId}|${payload.agentId}|${payload.merchantId}|${payload.amount.toFixed(2)}|${payload.nonce}|${payload.timestamp}`;
  const receiptHash = crypto.createHash('sha256').update(canonicalReceipt).digest('hex');
  const gatewaySignature = crypto.createHmac('sha256', SECRET_SIGNING_KEY).update(receiptHash).digest('hex');
  return { receiptHash, gatewaySignature };
}

export function verifyReceiptSignature(receipt: PaymentReceipt): boolean {
  const { receiptHash, gatewaySignature } = generateReceiptSignature({
    receiptId: receipt.receiptId,
    transactionId: receipt.transactionId,
    authorizationId: receipt.authorizationId,
    agentId: receipt.agentId,
    merchantId: receipt.merchantId,
    amount: receipt.amount,
    nonce: receipt.nonce,
    timestamp: receipt.timestamp,
  });

  const hashMatches = receipt.receiptHash === receiptHash;
  const sigMatches = crypto.timingSafeEqual(Buffer.from(receipt.gatewaySignature), Buffer.from(gatewaySignature));
  return hashMatches && sigMatches;
}
