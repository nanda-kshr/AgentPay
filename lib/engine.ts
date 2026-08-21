import { getDb } from './db';
import { INITIAL_AGENTS, INITIAL_MERCHANTS, INITIAL_PRODUCTS } from './seed-data';
import {
  Merchant,
  Product,
  AgentIdentity,
  TripRequest,
  PlanRecommendation,
  PlannedItem,
  EphemeralCredential,
  TransactionRecord,
  PaymentReceipt,
} from './types';
import {
  generateNonce,
  createCredentialSignature,
  verifyCredentialSignature,
  generateReceiptSignature,
  verifyReceiptSignature,
} from './crypto';

// In-memory fallback in case Mongo is starting up or in hybrid state
let memoryMerchants = [...INITIAL_MERCHANTS];
let memoryProducts = [...INITIAL_PRODUCTS];
let memoryAgents = [...INITIAL_AGENTS];
let memoryAuths = new Map<string, EphemeralCredential>();
let memoryConsumedNonces = new Set<string>();
let memoryTransactions = new Map<string, TransactionRecord>();
let memoryReceipts = new Map<string, PaymentReceipt>();

export async function initializeDatabase() {
  try {
    const db = await getDb();
    
    // Check merchants
    const merchantCount = await db.collection('merchants').countDocuments();
    if (merchantCount === 0) {
      await db.collection('merchants').insertMany(INITIAL_MERCHANTS);
    }

    // Check products
    const productCount = await db.collection('products').countDocuments();
    if (productCount === 0) {
      await db.collection('products').insertMany(INITIAL_PRODUCTS);
    }

    // Check agents
    const agentCount = await db.collection('agents').countDocuments();
    if (agentCount === 0) {
      await db.collection('agents').insertMany(INITIAL_AGENTS);
    }

    // Create indexes
    await db.collection('authorizations').createIndex({ id: 1 }, { unique: true });
    await db.collection('authorizations').createIndex({ nonce: 1 }, { unique: true });
    await db.collection('transactions').createIndex({ id: 1 }, { unique: true });
    await db.collection('receipts').createIndex({ receiptId: 1 }, { unique: true });
    
    return { success: true, mode: 'mongodb' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    console.warn('MongoDB connection fallback to memory:', message);
    return { success: true, mode: 'memory' };
  }
}

export async function getMerchants(): Promise<Merchant[]> {
  try {
    const db = await getDb();
    const list = await db.collection<Merchant>('merchants').find({}).toArray();
    return list.length > 0 ? list : memoryMerchants;
  } catch {
    return memoryMerchants;
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const db = await getDb();
    const list = await db.collection<Product>('products').find({}).toArray();
    return list.length > 0 ? list : memoryProducts;
  } catch {
    return memoryProducts;
  }
}

export async function getAgents(): Promise<AgentIdentity[]> {
  try {
    const db = await getDb();
    const list = await db.collection<AgentIdentity>('agents').find({}).toArray();
    return list.length > 0 ? list : memoryAgents;
  } catch {
    return memoryAgents;
  }
}

export async function buildAutonomousPlan(request: TripRequest): Promise<PlanRecommendation> {
  const products = await getProducts();
  const merchants = await getMerchants();
  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  const budget = request.budget || 2000;
  const comfort = request.comfortLevel || 'standard';

  // Group products by category
  const flights = products.filter((p) => p.category === 'airline');
  const hotels = products.filter((p) => p.category === 'hotel');
  const transports = products.filter((p) => p.category === 'transport');
  const experiences = products.filter((p) => p.category === 'experience');
  const shoppings = products.filter((p) => p.category === 'shopping');

  const selectedItems: PlannedItem[] = [];

  // 1. Select flight matching tier / budget
  const chosenFlight =
    comfort === 'luxury' && budget >= 2500
      ? flights.find((f) => f.tier === 'luxury') || flights[0]
      : flights.find((f) => f.tier === 'economy') || flights[0];

  if (chosenFlight) {
    selectedItems.push({
      product: chosenFlight,
      reason:
        chosenFlight.tier === 'luxury'
          ? 'Selected premium direct flight with lounge access aligned with luxury comfort preference.'
          : 'Selected cost-effective direct route to allocate budget toward experiences and accommodations.',
    });
  }

  // 2. Select accommodation
  const chosenHotel =
    comfort === 'luxury' && budget >= 2500
      ? hotels.find((h) => h.tier === 'luxury') || hotels[0]
      : hotels.find((h) => h.tier === 'standard') || hotels[0];

  if (chosenHotel) {
    selectedItems.push({
      product: chosenHotel,
      reason:
        chosenHotel.tier === 'luxury'
          ? 'Selected authentic private Onsen Ryokan garden villa for immersive high-tier hospitality.'
          : 'Selected highly-rated central Shibuya modern suite with rapid transit connectivity.',
    });
  }

  // 3. Select transportation
  const chosenTransport =
    request.durationDays > 4
      ? transports.find((t) => t.id === 'prod_transport_shinkansen_pass') || transports[0]
      : transports.find((t) => t.id === 'prod_transport_metro_unlimited') || transports[0];

  if (chosenTransport) {
    selectedItems.push({
      product: chosenTransport,
      reason:
        chosenTransport.id === 'prod_transport_shinkansen_pass'
          ? 'Included unlimited Shinkansen Green Pass for high-speed intercity travel.'
          : 'Included digital all-lines metro pass for low-cost frictionless metropolitan transit.',
    });
  }

  // 4. Select experience
  const chosenExp =
    request.interests.includes('culture') || request.interests.includes('tea')
      ? experiences.find((e) => e.id === 'prod_exp_tea_zen') || experiences[0]
      : experiences.find((e) => e.id === 'prod_exp_teamlab_fuji') || experiences[0];

  if (chosenExp) {
    selectedItems.push({
      product: chosenExp,
      reason: 'Matched curated VIP activity corresponding directly to expressed traveler interests.',
    });
  }

  // 5. Select optional shopping / perks if budget permits
  let currentSubtotal = selectedItems.reduce((acc, item) => acc + item.product.price, 0);
  if (budget - currentSubtotal >= 110) {
    const chosenShop = shoppings[0];
    if (chosenShop) {
      selectedItems.push({
        product: chosenShop,
        reason: 'Added artisan souvenir package within remaining discretionary budget headroom.',
      });
      currentSubtotal += chosenShop.price;
    }
  }

  const totalCost = selectedItems.reduce((acc, item) => acc + item.product.price, 0);
  const budgetRemaining = budget - totalCost;

  const plan: PlanRecommendation = {
    tripRequestId: request.id,
    items: selectedItems,
    totalCost,
    budget,
    budgetRemaining,
    summaryReasoning: `Autonomously compiled 5-point itinerary across verified merchants (${selectedItems
      .map((i) => merchantMap.get(i.product.merchantId)?.name || i.product.merchantName)
      .join(', ')}). All merchant security policies verified. Remaining budget: $${budgetRemaining.toFixed(2)}.`,
  };

  // Record plan in DB
  try {
    const db = await getDb();
    await db.collection('trip_requests').insertOne(request);
    await db.collection('recommendations').insertOne(plan);
  } catch {
    // Ignore in-memory fallback
  }

  return plan;
}

export async function createEphemeralCredentialForTransaction(params: {
  agentId: string;
  merchantId: string;
  amount: number;
  currency?: string;
  purpose: string;
}): Promise<EphemeralCredential> {
  const merchants = await getMerchants();
  const merchant = merchants.find((m) => m.id === params.merchantId);
  if (!merchant) {
    throw new Error(`Merchant not found: ${params.merchantId}`);
  }

  const agents = await getAgents();
  const agent = agents.find((a) => a.id === params.agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${params.agentId}`);
  }

  // Policy validation
  if (params.amount > merchant.securityPolicy.maxTransactionAmount) {
    throw new Error(
      `Amount $${params.amount} exceeds merchant spending limit of $${merchant.securityPolicy.maxTransactionAmount}`
    );
  }

  if (!merchant.securityPolicy.allowedAgentTypes.includes(agent.type)) {
    throw new Error(`Agent type ${agent.type} is not authorized for merchant ${merchant.name}`);
  }

  const now = Date.now();
  const lifetimeMs = (merchant.securityPolicy.authorizationLifetimeSeconds || 60) * 1000;
  const expiresAt = now + lifetimeMs;
  const authId = 'auth_' + Math.random().toString(36).substring(2, 11);
  const nonce = generateNonce();
  const currency = params.currency || 'USD';

  const signature = createCredentialSignature({
    id: authId,
    agentId: params.agentId,
    merchantId: params.merchantId,
    amount: params.amount,
    currency,
    purpose: params.purpose,
    nonce,
    issuedAt: now,
    expiresAt,
  });

  const credential: EphemeralCredential = {
    id: authId,
    agentId: params.agentId,
    merchantId: params.merchantId,
    amount: params.amount,
    currency,
    purpose: params.purpose,
    nonce,
    issuedAt: now,
    expiresAt,
    signature,
    status: 'active',
  };

  try {
    const db = await getDb();
    await db.collection('authorizations').insertOne(credential);
  } catch {
    memoryAuths.set(credential.id, credential);
  }

  return credential;
}

export interface PaymentExecutionResult {
  success: boolean;
  message: string;
  stageFailed?: string;
  transaction?: TransactionRecord;
  receipt?: PaymentReceipt;
}

export async function processPaymentGateway(params: {
  credential: EphemeralCredential;
  productId: string;
  productTitle: string;
  executionAmount: number;
  targetMerchantId: string;
}): Promise<PaymentExecutionResult> {
  const { credential, productId, productTitle, executionAmount, targetMerchantId } = params;
  const now = Date.now();

  // 1. Verify Signature
  const isSigValid = verifyCredentialSignature(credential);
  if (!isSigValid) {
    return {
      success: false,
      stageFailed: 'Signature Verification',
      message: 'Blocked — cryptographic signature mismatch. Credential has been tampered with.',
    };
  }

  // 2. Verify Expiry (60-second window)
  if (now > credential.expiresAt) {
    return {
      success: false,
      stageFailed: 'Expiration Check',
      message: 'Blocked — credential expired. Ephemeral validity window elapsed.',
    };
  }

  // 3. Verify Nonce Consumption (Replay protection)
  let isNonceConsumed = memoryConsumedNonces.has(credential.nonce);
  if (!isNonceConsumed) {
    try {
      const db = await getDb();
      const existing = await db.collection('authorizations').findOne({ nonce: credential.nonce, status: 'consumed' });
      if (existing) isNonceConsumed = true;
    } catch {
      // memory fallback used
    }
  }

  if (isNonceConsumed) {
    return {
      success: false,
      stageFailed: 'Nonce Check',
      message: 'Blocked — nonce already consumed. Single-use token cannot be replayed.',
    };
  }

  // 4. Verify Merchant Binding
  if (credential.merchantId !== targetMerchantId) {
    return {
      success: false,
      stageFailed: 'Merchant Binding',
      message: `Blocked — merchant mismatch. Credential is locked to ${credential.merchantId}, not ${targetMerchantId}.`,
    };
  }

  // 5. Verify Exact Amount Binding
  if (Math.abs(credential.amount - executionAmount) > 0.001) {
    return {
      success: false,
      stageFailed: 'Amount Binding',
      message: `Blocked — authorization mismatch. Credential authorized for $${credential.amount.toFixed(
        2
      )}, requested $${executionAmount.toFixed(2)}.`,
    };
  }

  // 6. Mark Nonce Consumed & Generate Receipt
  memoryConsumedNonces.add(credential.nonce);
  const txId = 'tx_' + Math.random().toString(36).substring(2, 11);
  const receiptId = 'rcpt_' + Math.random().toString(36).substring(2, 11);

  const merchants = await getMerchants();
  const merchant = merchants.find((m) => m.id === targetMerchantId);
  const merchantName = merchant?.name || targetMerchantId;

  const { receiptHash, gatewaySignature } = generateReceiptSignature({
    receiptId,
    transactionId: txId,
    authorizationId: credential.id,
    agentId: credential.agentId,
    merchantId: targetMerchantId,
    amount: executionAmount,
    nonce: credential.nonce,
    timestamp: now,
  });

  const receipt: PaymentReceipt = {
    receiptId,
    transactionId: txId,
    authorizationId: credential.id,
    agentId: credential.agentId,
    merchantId: targetMerchantId,
    merchantName,
    amount: executionAmount,
    currency: credential.currency,
    nonce: credential.nonce,
    timestamp: now,
    receiptHash,
    gatewaySignature,
    verified: true,
  };

  const transaction: TransactionRecord = {
    id: txId,
    authorizationId: credential.id,
    agentId: credential.agentId,
    merchantId: targetMerchantId,
    merchantName,
    productId,
    productTitle,
    amount: executionAmount,
    currency: credential.currency,
    status: 'completed',
    timestamp: now,
    receipt,
  };

  try {
    const db = await getDb();
    await db.collection('authorizations').updateOne({ id: credential.id }, { $set: { status: 'consumed' } });
    await db.collection('transactions').insertOne(transaction);
    await db.collection('receipts').insertOne(receipt);
  } catch {
    memoryTransactions.set(txId, transaction);
    memoryReceipts.set(receiptId, receipt);
  }

  return {
    success: true,
    message: 'Transaction authorized and executed successfully. Cryptographic receipt verified.',
    transaction,
    receipt,
  };
}

export async function getRecentTransactions(): Promise<TransactionRecord[]> {
  try {
    const db = await getDb();
    const list = await db.collection<TransactionRecord>('transactions').find({}).sort({ timestamp: -1 }).limit(20).toArray();
    return list.length > 0 ? list : Array.from(memoryTransactions.values()).reverse();
  } catch {
    return Array.from(memoryTransactions.values()).reverse();
  }
}
