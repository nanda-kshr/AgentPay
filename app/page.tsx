'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Store,
  Plane,
  Building2,
  Train,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Eye,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import {
  Merchant,
  Product,
  AgentIdentity,
  PlanRecommendation,
  TransactionRecord,
  PaymentReceipt,
  EphemeralCredential,
} from '@/lib/types';

export default function AgentPayApp() {
  const [viewMode, setViewMode] = useState<'agent' | 'shopkeeper'>('agent');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('all');

  // Agent Planning State
  const [query, setQuery] = useState('I want to go to Japan');
  const [durationDays, setDurationDays] = useState(7);
  const [budget, setBudget] = useState(2400);
  const [comfortLevel, setComfortLevel] = useState<'economy' | 'standard' | 'luxury'>('standard');
  const [interests] = useState<string[]>(['culture', 'sightseeing']);

  // Planning Progress & Steps
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningStep, setPlanningStep] = useState('');
  const [currentPlan, setCurrentPlan] = useState<PlanRecommendation | null>(null);

  // Payment Execution State
  const [isPaying, setIsPaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const res = await fetch('/api/init');
      const data = await res.json();
      if (data.success) {
        setMerchants(data.merchants || []);
        setProducts(data.products || []);
        setAgents(data.agents || []);
      }
      fetchTransactions();
    } catch (err) {
      console.error('Failed to init:', err);
    }
  }

  async function fetchTransactions() {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch txs:', err);
    }
  }

  // Generate autonomous itinerary with human updates
  async function handlePlanTrip() {
    setIsPlanning(true);
    setCurrentPlan(null);
    setPaymentSuccess(false);
    setActiveStep(1);

    const steps = [
      'Finding flights...',
      'Comparing hotels & stays...',
      'Checking availability...',
      'Optimizing your budget...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setPlanningStep(steps[i]);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          destination: 'Japan',
          durationDays,
          budget,
          comfortLevel,
          interests,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPlan(data.recommendation);
        setActiveStep(2);
      }
    } catch (err) {
      console.error('Plan error:', err);
    } finally {
      setIsPlanning(false);
      setPlanningStep('');
    }
  }

  // Approve and execute payment with ephemeral single-use credential
  async function handleApproveAndPay() {
    if (!currentPlan || currentPlan.items.length === 0) return;
    setIsPaying(true);

    try {
      // Step 3: Issue Ephemeral Credential
      setActiveStep(3);
      await new Promise((r) => setTimeout(r, 500));

      // Step 4: Gateway Settlement
      setActiveStep(4);
      for (const item of currentPlan.items) {
        const authRes = await fetch('/api/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: 'agent_travel_01',
            merchantId: item.product.merchantId,
            amount: item.product.price,
            purpose: `Booking ${item.product.title}`,
          }),
        });
        const authData = await authRes.json();
        if (!authData.success) throw new Error(authData.error);

        await fetch('/api/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: authData.credential,
            productId: item.product.id,
            productTitle: item.product.title,
            executionAmount: item.product.price,
            targetMerchantId: item.product.merchantId,
          }),
        });
      }

      // Step 5: Verified Receipts
      setActiveStep(5);
      setPaymentSuccess(true);
      await fetchTransactions();
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setIsPaying(false);
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'airline':
        return <Plane className="w-4 h-4 text-sky-600" />;
      case 'hotel':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'transport':
        return <Train className="w-4 h-4 text-emerald-600" />;
      case 'experience':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'shopping':
        return <ShoppingBag className="w-4 h-4 text-rose-600" />;
      default:
        return <Layers className="w-4 h-4 text-zinc-600" />;
    }
  };

  const filteredTransactions =
    selectedMerchantId === 'all'
      ? transactions
      : transactions.filter((t) => t.merchantId === selectedMerchantId);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-20">
      {/* Protocol Flow Bar (Always at top) */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { num: 1, label: '1. Agent Planning' },
              { num: 2, label: '2. Policy Check' },
              { num: 3, label: '3. 60s Ephemeral Credential' },
              { num: 4, label: '4. Gateway Settlement' },
              { num: 5, label: '5. Verified Receipt' },
            ].map((step) => {
              const isPassed = activeStep >= step.num;
              const isCurrent = activeStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                  }`}
                >
                  {isPassed && activeStep > step.num ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Header & View Selector */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-zinc-900">AgentPay</h1>
              <p className="text-xs text-zinc-500">Autonomous Machine-to-Machine Commerce Protocol</p>
            </div>
          </div>

          {/* Two Views Toggle */}
          <div className="flex p-1 rounded-lg bg-zinc-100 border border-zinc-200">
            <button
              onClick={() => setViewMode('agent')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'agent'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Agentic View</span>
            </button>
            <button
              onClick={() => {
                setViewMode('shopkeeper');
                fetchTransactions();
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'shopkeeper'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shopkeeper&apos;s View</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        {/* ================= VIEW 1: AGENTIC VIEW ================= */}
        {viewMode === 'agent' && (
          <div className="space-y-6">
            {/* Simple Travel Prompt Input */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-semibold text-zinc-800">What would you like to book?</h2>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                  Atlas AI Concierge
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. I want to go to Japan..."
                  className="flex-1 bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={handlePlanTrip}
                  disabled={isPlanning}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  {isPlanning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Planning...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Presets & Simple Budget Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-zinc-500 font-medium">Presets:</span>
                <button
                  onClick={() => {
                    setQuery('I want to go to Japan');
                    setDurationDays(7);
                    setBudget(2200);
                    setComfortLevel('standard');
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors"
                >
                  7-Day Classic Japan ($2,200)
                </button>
                <button
                  onClick={() => {
                    setQuery('Luxury Tokyo & Kyoto Ryokan Getaway');
                    setDurationDays(5);
                    setBudget(3400);
                    setComfortLevel('luxury');
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors"
                >
                  Luxury Ryokan ($3,400)
                </button>
                <button
                  onClick={() => {
                    setQuery('Budget Explorer Tokyo & Gion');
                    setDurationDays(4);
                    setBudget(1600);
                    setComfortLevel('economy');
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors"
                >
                  Budget Explorer ($1,600)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-100 text-xs">
                <div>
                  <label className="block text-zinc-500 mb-1">Duration</label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-md px-3 py-1.5 text-zinc-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Budget ($ USD)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-md px-3 py-1.5 text-zinc-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Comfort Level</label>
                  <select
                    value={comfortLevel}
                    onChange={(e) => setComfortLevel(e.target.value as any)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-md px-3 py-1.5 text-zinc-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="economy">Economy</option>
                    <option value="standard">Standard</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Human-Readable Status Updates */}
            {isPlanning && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-xs font-semibold text-indigo-900">{planningStep}</span>
              </div>
            )}

            {/* Itinerary Summary */}
            {currentPlan && (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs space-y-0">
                <div className="p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/60">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Itinerary Ready
                    </span>
                    <h3 className="text-base font-bold text-zinc-900 mt-1.5">Selected Itinerary Summary</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{currentPlan.summaryReasoning}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-zinc-400 font-medium">TOTAL COST</div>
                      <div className="text-lg font-bold text-zinc-900">
                        ${currentPlan.totalCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-emerald-600 font-medium">
                        Remaining: ${currentPlan.budgetRemaining.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={handleApproveAndPay}
                      disabled={isPaying || paymentSuccess}
                      className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
                        paymentSuccess
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isPaying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Settling Transactions...</span>
                        </>
                      ) : paymentSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Settlement Verified</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Approve & Pay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-zinc-100 p-5">
                  {currentPlan.items.map((item, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-200">
                          {getCategoryIcon(item.product.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900">{item.product.title}</span>
                            <span className="text-xs text-zinc-500">({item.product.merchantName})</span>
                          </div>
                          <p className="text-xs text-zinc-600 mt-0.5">{item.product.description}</p>
                          <p className="text-xs text-indigo-600 mt-1 italic">Reason: {item.reason}</p>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-sm font-bold text-zinc-900">${item.product.price.toFixed(2)}</div>
                        <span className="text-xs text-zinc-400 capitalize">{item.product.tier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: SHOPKEEPER'S VIEW ================= */}
        {viewMode === 'shopkeeper' && (
          <div className="space-y-6">
            {/* Merchant Selector & Policy Overview */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-semibold text-zinc-900">Merchant Terminal & Settlement Orders</h2>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-500 font-medium">Select Merchant:</label>
                  <select
                    value={selectedMerchantId}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    className="bg-zinc-50 border border-zinc-300 rounded-md px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Merchants ({merchants.length})</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Merchant Security Policy Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {merchants
                  .filter((m) => selectedMerchantId === 'all' || m.id === selectedMerchantId)
                  .map((m) => (
                    <div key={m.id} className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 truncate">{m.name}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-medium">
                          {m.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-600 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Max Limit:</span>
                          <span className="font-semibold text-emerald-700">${m.securityPolicy.maxTransactionAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">TTL Window:</span>
                          <span>{m.securityPolicy.authorizationLifetimeSeconds}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Auth Policy:</span>
                          <span className="text-indigo-700 font-medium">Single-use Ephemeral</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Orders & Verified Receipts List */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Incoming Settled Payments ({filteredTransactions.length})
                  </h3>
                </div>
                <button
                  onClick={fetchTransactions}
                  className="px-3 py-1 text-xs rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-10 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-lg">
                  No settled orders yet for this merchant. Place an order in the Agentic View to see live settlements.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-3 hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                          <span className="font-semibold text-sm text-zinc-900">{tx.productTitle}</span>
                          <span className="text-xs text-zinc-500">via {tx.agentId}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-zinc-900">
                            ${tx.amount.toFixed(2)} {tx.currency}
                          </span>
                          {tx.receipt && (
                            <button
                              onClick={() =>
                                setSelectedReceipt(
                                  selectedReceipt?.receiptId === tx.receipt?.receiptId ? null : tx.receipt!
                                )
                              }
                              className="text-xs px-2.5 py-1 rounded bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-medium flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Receipt</span>
                              {selectedReceipt?.receiptId === tx.receipt?.receiptId ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Technical Cryptographic Receipt Drawer */}
                      {selectedReceipt?.receiptId === tx.receipt?.receiptId && tx.receipt && (
                        <div className="p-3.5 rounded-lg bg-white border border-zinc-200 text-xs space-y-2 text-zinc-700 font-mono">
                          <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-100 pb-2">
                            <span className="text-indigo-700 font-semibold">Receipt: {tx.receipt.receiptId}</span>
                            <span className="text-emerald-700">HMAC-SHA256 Signature Validated</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-zinc-400">Tx ID: </span>
                              <span className="text-zinc-800">{tx.receipt.transactionId}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Auth ID: </span>
                              <span className="text-zinc-800">{tx.receipt.authorizationId}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Nonce: </span>
                              <span className="text-zinc-800">{tx.receipt.nonce}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400">Time: </span>
                              <span className="text-zinc-800">{new Date(tx.receipt.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-zinc-100 space-y-1 text-[11px]">
                            <div className="text-zinc-400">Receipt SHA-256 Hash:</div>
                            <div className="p-1.5 rounded bg-zinc-50 text-zinc-700 break-all text-[10px]">
                              {tx.receipt.receiptHash}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
