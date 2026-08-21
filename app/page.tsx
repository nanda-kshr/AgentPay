'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Bot,
  Plane,
  Building2,
  Train,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
  KeyRound,
  FileCheck2,
  Lock,
  ArrowRight,
  RefreshCw,
  Eye,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Server,
  Layers,
  FileCode,
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
  const [activeTab, setActiveTab] = useState<'simulator' | 'security' | 'merchants' | 'ledger'>('simulator');
  const [dbMode, setDbMode] = useState<string>('connecting');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Planning state
  const [query, setQuery] = useState('I want to go to Japan');
  const [durationDays, setDurationDays] = useState(7);
  const [budget, setBudget] = useState(2400);
  const [comfortLevel, setComfortLevel] = useState<'economy' | 'standard' | 'luxury'>('standard');
  const [interests, setInterests] = useState<string[]>(['culture', 'sightseeing']);

  // Planning Progress State
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningStep, setPlanningStep] = useState('');
  const [currentPlan, setCurrentPlan] = useState<PlanRecommendation | null>(null);

  // Payment Execution Pipeline State
  const [isExecutingPayment, setIsExecutingPayment] = useState(false);
  const [activePipelineStage, setActivePipelineStage] = useState<number>(0);
  const [activeCredentials, setActiveCredentials] = useState<EphemeralCredential[]>([]);
  const [executedReceipts, setExecutedReceipts] = useState<PaymentReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  // Security Attack Simulator State
  const [attackRunning, setAttackRunning] = useState(false);
  const [attackResult, setAttackResult] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const res = await fetch('/api/init');
      const data = await res.json();
      if (data.success) {
        setDbMode(data.mode);
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

  // Handle autonomous plan generation with minimal human-readable updates
  async function handleGeneratePlan() {
    setIsPlanning(true);
    setCurrentPlan(null);
    setExecutedReceipts([]);
    setActivePipelineStage(0);

    const steps = [
      'Finding flights...',
      'Comparing hotels & stays...',
      'Checking availability...',
      'Optimizing your budget...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setPlanningStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 550));
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
      }
    } catch (err) {
      console.error('Planning error:', err);
    } finally {
      setIsPlanning(false);
      setPlanningStep('');
    }
  }

  // Visual Multi-Stage Payment Execution Pipeline
  async function handleApproveAndPay() {
    if (!currentPlan || currentPlan.items.length === 0) return;
    setIsExecutingPayment(true);
    setActivePipelineStage(1); // 1: Agent Verified

    const generatedReceipts: PaymentReceipt[] = [];
    const issuedCreds: EphemeralCredential[] = [];

    // Stage 1: Agent Verified
    await new Promise((r) => setTimeout(r, 600));
    setActivePipelineStage(2); // 2: Merchant Verified

    // Stage 2: Merchant Verified
    await new Promise((r) => setTimeout(r, 600));
    setActivePipelineStage(3); // 3: Policy Checked

    // Stage 3: Policy Checked
    await new Promise((r) => setTimeout(r, 600));
    setActivePipelineStage(4); // 4: Ephemeral Credential Generated

    try {
      for (const item of currentPlan.items) {
        // Step A: Issue Ephemeral Credential
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
        issuedCreds.push(authData.credential);

        // Step B: Pay via Mock Gateway
        const payRes = await fetch('/api/pay', {
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
        const payData = await payRes.json();
        if (payData.success && payData.receipt) {
          generatedReceipts.push(payData.receipt);
        }
      }

      setActiveCredentials(issuedCreds);
      setActivePipelineStage(5); // 5: Transaction Authorized
      await new Promise((r) => setTimeout(r, 600));
      setActivePipelineStage(6); // 6: Payment Executed
      await new Promise((r) => setTimeout(r, 600));
      setActivePipelineStage(7); // 7: Receipt Verified
      setExecutedReceipts(generatedReceipts);

      await fetchTransactions();
    } catch (error) {
      console.error('Payment failure:', error);
    } finally {
      setIsExecutingPayment(false);
    }
  }

  // Security Simulator Attack Trigger
  async function runAttackTest(attackType: string, customAmount?: number, customMerchantId?: string) {
    setAttackRunning(true);
    setAttackResult(null);
    try {
      const res = await fetch('/api/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attackType,
          customAmount,
          customMerchantId,
        }),
      });
      const data = await res.json();
      setAttackResult(data);
    } catch (err) {
      console.error('Attack error:', err);
    } finally {
      setAttackRunning(false);
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'airline':
        return <Plane className="w-4 h-4 text-sky-500" />;
      case 'hotel':
        return <Building2 className="w-4 h-4 text-indigo-500" />;
      case 'transport':
        return <Train className="w-4 h-4 text-emerald-500" />;
      case 'experience':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'shopping':
        return <ShoppingBag className="w-4 h-4 text-rose-500" />;
      default:
        return <Layers className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white font-sans pb-20">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-base">AgentPay</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  M2M Autonomous Protocol
                </span>
              </div>
              <p className="text-xs text-zinc-400">Ephemeral Settlement & Cryptographic Receipts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>DB: {dbMode === 'mongodb' ? 'MongoDB Connected' : 'Ready'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 border-t border-zinc-800/40">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'simulator'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Autonomous Commerce Simulator
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Security Attack Simulator
          </button>
          <button
            onClick={() => setActiveTab('merchants')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'merchants'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Merchant Policies & Catalog
          </button>
          <button
            onClick={() => {
              setActiveTab('ledger');
              fetchTransactions();
            }}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Receipts Ledger ({transactions.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 pt-6">
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Input & Parameters Card */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Autonomous Travel Concierge
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tell the agent what you want (e.g. I want to go to Japan)..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={handleGeneratePlan}
                    disabled={isPlanning}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    {isPlanning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Planning...</span>
                      </>
                    ) : (
                      <>
                        <span>Plan Trip</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-zinc-500 font-mono">Presets:</span>
                  <button
                    onClick={() => {
                      setQuery('I want to go to Japan');
                      setDurationDays(7);
                      setBudget(2200);
                      setComfortLevel('standard');
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700/50 transition-colors"
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
                    className="px-2.5 py-1 rounded bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700/50 transition-colors"
                  >
                    Luxury Ryokan Suite ($3,400)
                  </button>
                  <button
                    onClick={() => {
                      setQuery('Budget Explorer Tokyo & Gion');
                      setDurationDays(4);
                      setBudget(1600);
                      setComfortLevel('economy');
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700/50 transition-colors"
                  >
                    Budget Transit Explorer ($1,600)
                  </button>
                </div>

                {/* Constraint controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/60 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono">Duration (Days)</label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono">Total Budget ($ USD)</label>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono">Comfort Level</label>
                    <select
                      value={comfortLevel}
                      onChange={(e) => setComfortLevel(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="economy">Economy</option>
                      <option value="standard">Standard</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Minimal Human-Readable Status Updates */}
            {isPlanning && (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-sm font-medium text-indigo-300 font-mono">{planningStep}</span>
              </div>
            )}

            {/* Generated Itinerary & Final Summary */}
            {currentPlan && (
              <div className="space-y-4">
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
                  {/* Top Bar Summary */}
                  <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/90">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                          Agent Itinerary Ready
                        </span>
                        <span className="text-xs text-zinc-400">
                          {currentPlan.items.length} Pre-vetted Merchant Services
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mt-1">Autonomous Travel Recommendation</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{currentPlan.summaryReasoning}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-zinc-500 font-mono">TOTAL ESTIMATE</div>
                        <div className="text-lg font-bold text-emerald-400 font-mono">
                          ${currentPlan.totalCost.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-400">
                          Remaining: ${currentPlan.budgetRemaining.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={handleApproveAndPay}
                        disabled={isExecutingPayment || activePipelineStage === 7}
                        className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                          activePipelineStage === 7
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/10'
                        }`}
                      >
                        {isExecutingPayment ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Protocol...</span>
                          </>
                        ) : activePipelineStage === 7 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Settlement Complete</span>
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

                  {/* Planned Items Grid */}
                  <div className="p-5 divide-y divide-zinc-800/60">
                    {currentPlan.items.map((item, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                            {getCategoryIcon(item.product.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-100">{item.product.title}</span>
                              <span className="text-xs text-zinc-400 font-mono">({item.product.merchantName})</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">{item.product.description}</p>
                            <p className="text-xs text-indigo-300/80 mt-1 italic">Agent Reason: {item.reason}</p>
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          <div className="text-sm font-mono font-semibold text-zinc-200">
                            ${item.product.price.toFixed(2)}
                          </div>
                          <span className="text-xs text-zinc-500 uppercase font-mono">
                            {item.product.tier}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Ephemeral Security Pipeline */}
                {activePipelineStage > 0 && (
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-200">
                          AgentPay Protocol Execution & Verification Pipeline
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20 font-mono">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>Single-Use 60s Ephemeral Window</span>
                      </div>
                    </div>

                    {/* Pipeline Steps Flow */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                      {[
                        { step: 1, label: 'Agent Verified' },
                        { step: 2, label: 'Merchant Verified' },
                        { step: 3, label: 'Policy Checked' },
                        { step: 4, label: 'Credential Generated' },
                        { step: 5, label: 'Tx Authorized' },
                        { step: 6, label: 'Payment Executed' },
                        { step: 7, label: 'Receipt Verified' },
                      ].map((s) => {
                        const isDone = activePipelineStage >= s.step;
                        const isCurrent = activePipelineStage === s.step;
                        return (
                          <div
                            key={s.step}
                            className={`p-2.5 rounded-lg border flex flex-col items-center text-center transition-all ${
                              isDone
                                ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                            } ${isCurrent ? 'ring-1 ring-emerald-500 shadow-sm shadow-emerald-500/20' : ''}`}
                          >
                            <div className="mb-1">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-zinc-600" />
                              )}
                            </div>
                            <span className="font-mono text-xs">{s.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Live Ephemeral Credentials Generated */}
                    {activeCredentials.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 space-y-2 text-xs">
                        <div className="text-zinc-400 font-mono flex items-center justify-between">
                          <span>Cryptographic Single-Use Credentials Issued ({activeCredentials.length})</span>
                          <span className="text-emerald-400">HMAC-SHA256 Signed</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {activeCredentials.map((c, i) => (
                            <div
                              key={i}
                              className="p-2 rounded bg-zinc-900/90 border border-zinc-800 font-mono text-zinc-300 flex items-center justify-between"
                            >
                              <div>
                                <div className="text-white font-semibold flex items-center gap-1.5">
                                  <KeyRound className="w-3 h-3 text-indigo-400" />
                                  <span>{c.id}</span>
                                </div>
                                <div className="text-zinc-500 text-xs">
                                  Bound: {c.merchantId} • ${c.amount}
                                </div>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                TTL: 60s
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Receipts Generated */}
                    {executedReceipts.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>All {executedReceipts.length} transactions settled with cryptographic receipts.</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('ledger')}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                        >
                          <span>View Signed Receipts</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Security Attack Simulator Playground */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Tamper & Replay Attack Playground
                </h2>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Demonstrates why AgentPay credentials cannot be stolen, tampered with, or reused. Each ephemeral credential
                is mathematically bound to a specific merchant, amount, purpose, and single-use nonce with HMAC-SHA256
                signatures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Attack 1: Amount Tampering */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-rose-400 uppercase font-semibold">Attack Vector #1</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">Amount Tampering</span>
                  </div>
                  <h3 className="text-sm font-medium text-white">Modify Transaction Amount</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Attacker intercepts token authorized for $260.00 and attempts to charge $999.00 at the gateway.
                  </p>
                </div>
                <button
                  onClick={() => runAttackTest('amount_tamper', 999)}
                  disabled={attackRunning}
                  className="mt-4 w-full py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Execute Amount Tamper ($999.00)</span>
                </button>
              </div>

              {/* Attack 2: Merchant Redirect */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-rose-400 uppercase font-semibold">Attack Vector #2</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">Merchant Swap</span>
                  </div>
                  <h3 className="text-sm font-medium text-white">Redirect Payment to Rogue Merchant</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Attacker intercepts valid credential and attempts to submit it to rogue merchant ID.
                  </p>
                </div>
                <button
                  onClick={() => runAttackTest('merchant_redirect', 260, 'merch_rogue_shadow_corp')}
                  disabled={attackRunning}
                  className="mt-4 w-full py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Execute Rogue Merchant Redirect</span>
                </button>
              </div>

              {/* Attack 3: Nonce Replay */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-rose-400 uppercase font-semibold">Attack Vector #3</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">Replay Attack</span>
                  </div>
                  <h3 className="text-sm font-medium text-white">Replay Consumed Credential</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Attacker captures a legitimately executed credential and replays it to double-spend.
                  </p>
                </div>
                <button
                  onClick={() => runAttackTest('nonce_replay')}
                  disabled={attackRunning}
                  className="mt-4 w-full py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Execute Nonce Replay Attack</span>
                </button>
              </div>

              {/* Attack 4: Expired Credential */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-rose-400 uppercase font-semibold">Attack Vector #4</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">Expiry Breach</span>
                  </div>
                  <h3 className="text-sm font-medium text-white">Use Expired Credential</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Attacker holds an unused credential and attempts to redeem it after the 60s TTL has expired.
                  </p>
                </div>
                <button
                  onClick={() => runAttackTest('token_expired')}
                  disabled={attackRunning}
                  className="mt-4 w-full py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Execute Expired Token Attack</span>
                </button>
              </div>
            </div>

            {/* Attack Evaluation Trace */}
            {attackResult && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-mono font-semibold text-zinc-200 uppercase">
                      Payment Gateway Security Evaluation Log
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-mono font-semibold ${
                      !attackResult.gatewayResult.success
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {!attackResult.gatewayResult.success ? 'ATTACK BLOCKED' : 'EXECUTED'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 font-mono">
                  <span className="font-bold text-rose-400">Gateway Decision: </span>
                  {attackResult.gatewayResult.message}
                </div>

                <div className="text-xs font-mono text-zinc-400">
                  <span className="text-zinc-500">Validation Stage Failed: </span>
                  <span className="text-zinc-200">{attackResult.gatewayResult.stageFailed || 'None'}</span>
                </div>

                <div className="bg-zinc-900/80 rounded-lg p-3 border border-zinc-800 font-mono text-xs overflow-x-auto text-zinc-300">
                  <div className="text-zinc-500 mb-1">// Attacker Submitted Payload</div>
                  <pre>{JSON.stringify(attackResult.attackAttempt, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Merchant Catalog & Policies */}
        {activeTab === 'merchants' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Simulated Merchant Ecosystem & Policies
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Autonomous payments are governed by strict merchant security policies stored in MongoDB.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {merchants.map((m) => (
                <div key={m.id} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(m.category)}
                        <h3 className="text-sm font-semibold text-white">{m.name}</h3>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">ID: {m.id}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono uppercase">
                      {m.category}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1 text-xs font-mono">
                    <div className="text-zinc-400 font-semibold mb-1">Security Policy Constraints:</div>
                    <div className="text-zinc-300 flex justify-between">
                      <span className="text-zinc-500">Max Tx Amount:</span>
                      <span className="text-emerald-400 font-semibold">${m.securityPolicy.maxTransactionAmount}</span>
                    </div>
                    <div className="text-zinc-300 flex justify-between">
                      <span className="text-zinc-500">TTL Lifetime:</span>
                      <span>{m.securityPolicy.authorizationLifetimeSeconds} seconds</span>
                    </div>
                    <div className="text-zinc-300 flex justify-between">
                      <span className="text-zinc-500">Allowed Agent Types:</span>
                      <span className="text-indigo-300">{m.securityPolicy.allowedAgentTypes.join(', ')}</span>
                    </div>
                    <div className="text-zinc-300 flex justify-between">
                      <span className="text-zinc-500">Fresh Auth Required:</span>
                      <span>{m.securityPolicy.requireFreshAuthorization ? 'Yes (Single-use)' : 'No'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipts & Audit Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                    Cryptographic Receipt Ledger
                  </h2>
                </div>
                <p className="text-xs text-zinc-400">
                  Immutable, machine-readable settlement receipts signed by the simulated payment gateway.
                </p>
              </div>
              <button
                onClick={fetchTransactions}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg font-mono flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
                No verified transactions yet. Run an autonomous plan and approve payments to populate the ledger.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                        <span className="font-semibold text-sm text-white">{tx.productTitle}</span>
                        <span className="text-xs text-zinc-400 font-mono">({tx.merchantName})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-emerald-400">
                          ${tx.amount.toFixed(2)} {tx.currency}
                        </span>
                        {tx.receipt && (
                          <button
                            onClick={() =>
                              setSelectedReceipt(selectedReceipt?.receiptId === tx.receipt?.receiptId ? null : tx.receipt!)
                            }
                            className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono flex items-center gap-1 transition-colors"
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

                    {/* Expandable Technical Receipt Card */}
                    {selectedReceipt?.receiptId === tx.receipt?.receiptId && tx.receipt && (
                      <div className="mt-3 p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2 text-zinc-300">
                        <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-2">
                          <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5" />
                            Receipt Payload: {tx.receipt.receiptId}
                          </span>
                          <span className="text-emerald-400">Status: Signature Validated</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-zinc-500">Transaction ID: </span>
                            <span className="text-zinc-200">{tx.receipt.transactionId}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Authorization ID: </span>
                            <span className="text-zinc-200">{tx.receipt.authorizationId}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Nonce: </span>
                            <span className="text-zinc-200 truncate">{tx.receipt.nonce}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Timestamp: </span>
                            <span className="text-zinc-200">
                              {new Date(tx.receipt.timestamp).toISOString()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/60 space-y-1">
                          <div className="text-zinc-500">SHA-256 Receipt Hash:</div>
                          <div className="p-1.5 rounded bg-zinc-900 text-zinc-300 break-all text-xs">
                            {tx.receipt.receiptHash}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-zinc-500">Gateway HMAC Signature:</div>
                          <div className="p-1.5 rounded bg-zinc-900 text-zinc-300 break-all text-xs">
                            {tx.receipt.gatewaySignature}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
