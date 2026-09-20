"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Coins,
  DollarSign,
  Video,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  History,
  Sparkles,
  Cloud,
  ArrowUpRight,
  Circle,
  ExternalLink,
} from "lucide-react";
import { useYouTubeStudio } from "@/lib/youtube-context";
import { useToast } from "@/lib/toast-context";
import {
  FinancialMetrics,
  AMRAPlan,
  LedgerTransaction,
  FinancialReport,
  EsotericPhilosophy,
  GCloudBillingResponse,
} from "@/lib/types/treasury";
import { fetchAmraPhilosophy } from "@/lib/esoteric";
import TreasuryMetricCards from "./treasury/treasury-metric-cards";
import GCloudBurnRateCard from "./treasury/gcloud-burn-rate-card";
import YouTubeRevenueCard from "./treasury/youtube-revenue-card";
import AMRALedgerTable from "./treasury/amra-ledger-table";
import AMRASubscriptionGrid from "./treasury/amra-subscription-grid";

export default function AMRATreasuryStudio() {
  const { status: ytStatus } = useYouTubeStudio();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "youtube_finance" | "ledger" | "plans" | "gcloud_billing"
  >("overview");

  // Core Treasury State
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [plans, setPlans] = useState<AMRAPlan[]>([]);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
  const [finance, setFinance] = useState<FinancialReport | null>(null);
  const [philosophy, setPhilosophy] = useState<EsotericPhilosophy | null>(null);

  // Google Cloud Infrastructure State
  const [gcloudBilling, setGcloudBilling] = useState<GCloudBillingResponse | null>(null);
  const [loadingGCloud, setLoadingGCloud] = useState(false);
  const [syncingGCloud, setSyncingGCloud] = useState(false);

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [syncingAMRA, setSyncingAMRA] = useState(false);

  // Fetch AMRA financial metrics, plan catalog, and esoteric philosophy
  const loadAMRAMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const [mRes, pRes, philData] = await Promise.all([
        fetch("/api/v1/amra/metrics"),
        fetch("/api/v1/amra/plans"),
        fetchAmraPhilosophy(),
      ]);
      if (mRes.ok) {
        setMetrics(await mRes.json());
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPlans(pData.plans || []);
      }
      if (philData) {
        setPhilosophy(philData);
      }
    } catch (err) {
      console.error("Failed to load AMRA metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // Fetch AMRA immutable ledger
  const loadLedger = useCallback(async () => {
    setLoadingLedger(true);
    try {
      const res = await fetch("/api/v1/amra/ledger?limit=50");
      if (res.ok) {
        const data = await res.json();
        setLedger(data.ledger || []);
      }
    } catch (err) {
      console.error("Failed to load AMRA ledger:", err);
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  // Fetch YouTube Financial Reports if authenticated
  const loadYouTubeFinance = useCallback(async () => {
    if (!ytStatus?.authenticated) return;
    try {
      const res = await fetch("/api/v1/youtube/finance");
      if (res.ok) {
        setFinance(await res.json());
      }
    } catch (err) {
      console.error("Failed to load YouTube financial report:", err);
    }
  }, [ytStatus?.authenticated]);

  // Fetch Google Cloud Billing telemetry
  const loadGCloudBilling = useCallback(async () => {
    setLoadingGCloud(true);
    try {
      const res = await fetch("/api/v1/amra/gcloud/billing");
      if (res.ok) {
        setGcloudBilling(await res.json());
      }
    } catch (err) {
      console.error("Failed to load Google Cloud billing data:", err);
    } finally {
      setLoadingGCloud(false);
    }
  }, []);

  useEffect(() => {
    loadAMRAMetrics();
    loadLedger();
    loadGCloudBilling();
  }, [loadAMRAMetrics, loadLedger, loadGCloudBilling]);

  useEffect(() => {
    loadYouTubeFinance();
  }, [loadYouTubeFinance]);

  // Sync GCloud expense to BoltDB Ledger
  const handleSyncGCloudExpense = async () => {
    setSyncingGCloud(true);
    try {
      const res = await fetch("/api/v1/amra/gcloud/sync-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_days: 30,
          description: "Google Cloud Infrastructure Auto-Reconciliation",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toastSuccess(`Reconciled $${(data.recorded_amount || 0).toFixed(2)} to audit ledger`);
        await loadAMRAMetrics();
        await loadLedger();
        await loadGCloudBilling();
      } else {
        const err = await res.json();
        toastError(`Sync failed: ${err.error || "Unknown error"}`);
      }
    } catch (err: any) {
      toastError(`Sync error: ${err.message}`);
    } finally {
      setSyncingGCloud(false);
    }
  };

  // Sync YouTube Partner Revenue to BoltDB Ledger
  const handleSyncToAMRA = async (month?: string) => {
    setSyncingAMRA(true);
    try {
      const res = await fetch("/api/v1/youtube/finance/sync-amra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (res.ok) {
        const data = await res.json();
        toastSuccess(
          `Synced ${data.synced_count} entries ($${(data.total_dollars || 0).toFixed(2)}) to ledger`
        );
        await loadAMRAMetrics();
        await loadLedger();
      } else {
        const err = await res.json();
        toastError(`Sync failed: ${err.error || "Unknown error"}`);
      }
    } catch (err: any) {
      toastError(`Sync error: ${err.message}`);
    } finally {
      setSyncingAMRA(false);
    }
  };

  // Checkout simulation handler
  const handleCheckout = async (planId: string) => {
    try {
      const res = await fetch("/api/v1/amra/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          customer_id: "cust_sovereign_dev",
          customer_email: "justin@echosh-labs.com",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toastSuccess(`Checkout initiated: ${data.session_id}`);
        await loadAMRAMetrics();
        await loadLedger();
      } else {
        const err = await res.json();
        toastError(`Checkout failed: ${err.error || "Unknown error"}`);
      }
    } catch (err: any) {
      toastError(`Checkout error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Sovereign Financial Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 p-6 rounded-2xl border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Coins className="w-6 h-6" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight font-serif">
                    AMRA Sovereign Treasury
                  </h2>
                  <span
                    className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-serif px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 cursor-help transition hover:bg-amber-500/20 shadow-sm"
                    title="Āmra (आम्र): The Vedic emblem of auspicious fruition (karma-phala) and abundance, crowning the sacred Pūrṇa Kumbha."
                  >
                    <span className="font-semibold text-amber-400">आम्र</span>
                    <span className="text-[10px] font-sans tracking-wide uppercase text-amber-300/80">
                      Sacred Fruition
                    </span>
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ACID LEDGER ACTIVE</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vedic Karma-Phala Ledger &amp; Unified Treasury: Harmonizing SaaS Subscriptions with Sovereign YouTube Creator Monetization.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                loadAMRAMetrics();
                loadLedger();
                loadYouTubeFinance();
                loadGCloudBilling();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1.5 border border-slate-700 transition"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/foundations/"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/40 text-slate-300 hover:text-red-300 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 hover:border-red-500/30 transition"
              title="Open Foundations Creator Studio"
            >
              <Video className="w-3.5 h-3.5 text-red-400" />
              <span>Foundations Studio</span>
              <ArrowUpRight className="w-3 h-3 text-red-400" />
            </Link>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <TreasuryMetricCards metrics={metrics} finance={finance} ledger={ledger} />
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 text-xs font-mono font-medium overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`px-4 py-2 rounded-lg transition ${
            activeSubTab === "overview"
              ? "bg-slate-800 text-emerald-400 border border-slate-700 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Treasury Overview
        </button>

        <button
          onClick={() => setActiveSubTab("youtube_finance")}
          className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
            activeSubTab === "youtube_finance"
              ? "bg-slate-800 text-red-400 border border-slate-700 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-red-400" />
          <span>YouTube Partner Revenue</span>
        </button>

        <button
          onClick={() => setActiveSubTab("ledger")}
          className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
            activeSubTab === "ledger"
              ? "bg-slate-800 text-purple-400 border border-slate-700 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>Audit Ledger ({ledger.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("plans")}
          className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
            activeSubTab === "plans"
              ? "bg-slate-800 text-cyan-400 border border-slate-700 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
          <span>Subscription Plans ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("gcloud_billing")}
          className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
            activeSubTab === "gcloud_billing"
              ? "bg-slate-800 text-blue-400 border border-slate-700 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          <span>Google Cloud &amp; Billing</span>
        </button>
      </div>

      {/* 3. Sub-View: Overview */}
      {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Source Synergy */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Dual Sovereign Revenue Model</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400">AMRA Correlation</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-semibold">Tier 1: Software Subscriptions (AMRA SaaS)</div>
                  <div className="text-[11px] text-slate-400">Adept, Magus, &amp; Enterprise recurring memberships</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-cyan-300">
                    ${(metrics?.saas_mrr || 0).toFixed(2)}/mo
                  </div>
                  <div className="text-[10px] text-slate-500">Stripe / Webhook Idempotent</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-semibold">Tier 2: YouTube Partner Ad Revenue</div>
                  <div className="text-[11px] text-slate-400">Autonomous creator channel video monetization</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-300">
                    ${(finance?.total_estimated_revenue || 0).toFixed(2)}
                  </div>
                    <div className="text-[10px] text-slate-500">
                      {finance?.monetized ? "Monetized Partner Channel" : "Autonomous Estimates"}
                    </div>
                  </div>
                </div>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-slate-300 flex items-center justify-between">
              <span className="text-emerald-400 font-mono">Consolidated Gross Ecosystem:</span>
              <span className="font-bold text-emerald-300 font-mono">
                ${((metrics?.total_gross_ecosystem || 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* YouTube Studio Integration Health */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Video className="w-4 h-4 text-red-400" />
                  <span>Foundations YouTube Channel</span>
                </h3>
                <span className="text-xs font-mono text-red-400">OAuth Substrate</span>
              </div>

              <div className="space-y-3 font-mono text-xs mt-3">
                <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        ytStatus?.authenticated ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                      }`}
                    />
                    <span className="text-slate-200">
                      {ytStatus?.channel?.title || "Unauthenticated Channel"}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded border ${
                      ytStatus?.authenticated
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : "bg-red-950 text-red-400 border-red-800"
                    }`}
                  >
                    {ytStatus?.authenticated ? "CONNECTED" : "DISCONNECTED"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <span className="text-slate-400 uppercase text-[10px] block">Subscriber Reach</span>
                    <span className="font-semibold text-xs text-white">
                      {ytStatus?.channel?.subscriber_count?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                    <span className="text-slate-400 uppercase text-[10px] block">Daily Quota</span>
                    <span className="font-semibold text-xs text-cyan-300">
                      {ytStatus?.quota?.used_today.toLocaleString() || "0"} / {ytStatus?.quota?.daily_limit.toLocaleString() || "10,000"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/foundations/"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-lg shadow-red-900/20"
            >
              <Video className="w-4 h-4" />
              <span>Launch Foundations Studio Workspace</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Sacred Artwork Atelier Bridges */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-cyan-950/20 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-serif text-white font-semibold text-sm">
                  {philosophy?.title || "Vedic Philosophy of Āmra (आम्र)"}
                  {philosophy?.subtitle ? ` • ${philosophy.subtitle}` : ""}
                </span>
              </div>
              <span className="font-mono text-[10px] text-amber-400/80 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 self-start sm:self-auto">
                Sovereign Fruition Substrate
              </span>
            </div>

            <div className="text-slate-400 text-xs leading-relaxed font-sans">
              {philosophy?.karma_phala ? (
                <p className="space-y-1">
                  <span className="text-slate-300 font-medium block">{philosophy.karma_phala}</span>
                  {philosophy.purna_kumbha && (
                    <span className="text-emerald-300/90 block">{philosophy.purna_kumbha}</span>
                  )}
                </p>
              ) : (
                <span className="text-slate-500 italic">
                  Hydrating sovereign Vedic philosophy from storehouse...
                </span>
              )}
            </div>

            {/* Quick Navigation Cards into Dedicated Artwork Pages */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                href="/sacred-geometry"
                className="p-3.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Circle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      Sacred Geometrical Backgrounds
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Toroidal Harmonics • 25 Multivariate Facets
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-cyan-400/70 group-hover:text-cyan-300 transition-colors" />
              </Link>

              <Link
                href="/sacred-objects"
                className="p-3.5 rounded-xl bg-amber-950/30 hover:bg-amber-950/60 border border-amber-500/30 hover:border-amber-400/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                      Sacred Graphical Objects
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Āmra Rūpa Mango • Living Prānic Expressions
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-amber-400/70 group-hover:text-amber-300 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-View: YouTube Partner Revenue */}
      {activeSubTab === "youtube_finance" && (
        <YouTubeRevenueCard
          finance={finance}
          syncingAMRA={syncingAMRA}
          authenticated={!!ytStatus?.authenticated}
          onSyncAMRA={handleSyncToAMRA}
        />
      )}

      {/* 5. Sub-View: AMRA Financial Audit Ledger */}
      {activeSubTab === "ledger" && (
        <AMRALedgerTable
          ledger={ledger}
          loadingLedger={loadingLedger}
          onRefresh={loadLedger}
        />
      )}

      {/* 6. Sub-View: Subscription Plans */}
      {activeSubTab === "plans" && (
        <AMRASubscriptionGrid plans={plans} onCheckout={handleCheckout} />
      )}

      {/* 7. Sub-View: Google Cloud Infrastructure & Billing */}
      {activeSubTab === "gcloud_billing" && (
        <GCloudBurnRateCard
          gcloudBilling={gcloudBilling}
          loadingGCloud={loadingGCloud}
          syncingGCloud={syncingGCloud}
          onRefresh={loadGCloudBilling}
          onSyncExpense={handleSyncGCloudExpense}
        />
      )}
    </div>
  );
}
