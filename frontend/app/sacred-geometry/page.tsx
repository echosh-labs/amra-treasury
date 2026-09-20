"use client";

import React from "react";
import { Circle, ShieldCheck, Sparkles, ExternalLink, Radio, Cpu } from "lucide-react";
import ToroidGeometryVisualizer from "@/components/treasury/toroid-geometry-visualizer";

export default function SacredGeometryPage() {
  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/50 via-slate-900 to-slate-950 p-6 rounded-2xl border border-cyan-500/30 shadow-2xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Circle className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight font-serif">
                Sacred Geometrical Backgrounds
              </h1>
            </div>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>PORT 8050 ATELIER</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
            Toroidal Singularity (Akasha Spanda) Harmonic Visualizer &amp; Multivariate Coloration Engine. High-performance, zero-allocation continuous flow with 25 sacred facets across Chakras, Alchemical metals, and Singularity states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero-Allocation Engine</span>
          </div>
          <a
            href="/api/v1/amra/geometry/toroid/stream?palette=multivariate_facets&fps=30"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 hover:bg-cyan-900/60 transition flex items-center space-x-1"
          >
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>SSE Stream</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Standalone Toroidal & Multivariate Background Visualizer */}
      <ToroidGeometryVisualizer />
    </div>
  );
}
