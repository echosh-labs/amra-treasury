"use client";

import React from "react";
import { Coins, ExternalLink, ShieldCheck, Youtube, Cloud, Flame } from "lucide-react";

export default function AmraFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070b13] text-xs font-mono mt-12">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <Coins className="w-4 h-4" />
              <span>AMRA Sovereign Treasury</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
              Vedic Fruition (*karma-phala*) and immutable financial audit ledger for the sovereign echosh-labs ecosystem.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-bold">
              <Youtube className="w-4 h-4" />
              <span>YouTube Sovereign Studio</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
              Resumable chunked uploader dock, analytics telemetry v2, and daily monetization accrual bridge.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Cloud className="w-4 h-4" />
              <span>Google Cloud Infrastructure</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
              Zero-idle burn rate monitoring, scale-to-zero enforcement, and monthly sovereign margin yield.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-semibold">AMRA Stack</span>
            <span>•</span>
            <span>Port 8050</span>
            <span>•</span>
            <span>Go 1.23 + bbolt &amp; Next.js 15 Static Export</span>
            <span>•</span>
            <span className="text-cyan-400">echosh-labs</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://echosh-labs.com/treasury"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-emerald-300 transition flex items-center space-x-1"
            >
              <span>echosh-labs.com/treasury</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
