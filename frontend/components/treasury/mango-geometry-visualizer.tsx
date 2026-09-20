"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  Copy,
  Download,
  Check,
  Flame,
  Wind,
  Layers,
  Circle,
  Eye,
  Activity,
} from "lucide-react";
import { AmraGeometryData } from "@/lib/types/treasury";
import EsotericShadowAlchemy from "./esoteric-shadow-alchemy";
import { useToast } from "@/lib/toast-context";

interface MangoGeometryVisualizerProps {
  geoBelly: number;
  geoHook: number;
  geoShadow: number;
  geoHeat: number;
  geoData: AmraGeometryData | null;
  loadingGeo: boolean;
  onBellyChange: (val: number) => void;
  onHookChange: (val: number) => void;
  onShadowChange: (val: number) => void;
  onHeatChange: (val: number) => void;
  onPreset: (belly: number, hook: number, shadow: number, heat: number) => void;
  onReload: () => void;
}

export type ExpressionPaletteId =
  | "pakva_gold"
  | "aama_emerald"
  | "samudra_churning"
  | "surya_agni"
  | "amara_pearl";

interface ColorTheme {
  id: ExpressionPaletteId;
  name: string;
  tag: string;
  bodyStops: [string, string, string, string];
  strokeColor: string;
  leafFill: string;
  leafStroke: string;
  bijaStops: [string, string, string, string];
  bijaStroke: string;
  auraGlow: string;
}

const EXPRESSION_PALETTES: ColorTheme[] = [
  {
    id: "pakva_gold",
    name: "Pakva (Ripe Nectar)",
    tag: "Saffron & Honey Gold",
    bodyStops: ["#fef08a", "#f59e0b", "#b45309", "#451a03"],
    strokeColor: "#f59e0b",
    leafFill: "#065f46",
    leafStroke: "#34d399",
    bijaStops: ["#ffffff", "#fef3c7", "#d97706", "#78350f"],
    bijaStroke: "#fbbf24",
    auraGlow: "rgba(245, 158, 11, 0.25)",
  },
  {
    id: "aama_emerald",
    name: "Āma (Raw Vitality)",
    tag: "Verdant Lime & Jade",
    bodyStops: ["#ecfdf5", "#10b981", "#047857", "#064e3b"],
    strokeColor: "#34d399",
    leafFill: "#022c22",
    leafStroke: "#10b981",
    bijaStops: ["#ffffff", "#d1fae5", "#059669", "#064e3b"],
    bijaStroke: "#6ee7b7",
    auraGlow: "rgba(16, 185, 129, 0.25)",
  },
  {
    id: "samudra_churning",
    name: "Samudra (Alchemical Ocean)",
    tag: "Electric Violet & Indigo",
    bodyStops: ["#f5f3ff", "#8b5cf6", "#4c1d95", "#0f172a"],
    strokeColor: "#c084fc",
    leafFill: "#1e1b4b",
    leafStroke: "#6366f1",
    bijaStops: ["#ffffff", "#ede9fe", "#7c3aed", "#2e1065"],
    bijaStroke: "#a855f7",
    auraGlow: "rgba(139, 92, 246, 0.25)",
  },
  {
    id: "surya_agni",
    name: "Sūrya Agni (Solar Fire)",
    tag: "Incandescent Crimson",
    bodyStops: ["#fff1f2", "#f43f5e", "#be123c", "#4c0519"],
    strokeColor: "#fb7185",
    leafFill: "#78350f",
    leafStroke: "#f59e0b",
    bijaStops: ["#ffffff", "#fff7ed", "#ea580c", "#7c2d12"],
    bijaStroke: "#fdba74",
    auraGlow: "rgba(244, 63, 94, 0.25)",
  },
  {
    id: "amara_pearl",
    name: "Amara (Transcendent Pearl)",
    tag: "Ethereal Platinum Light",
    bodyStops: ["#ffffff", "#f1f5f9", "#cbd5e1", "#334155"],
    strokeColor: "#e2e8f0",
    leafFill: "#0f172a",
    leafStroke: "#94a3b8",
    bijaStops: ["#ffffff", "#ffffff", "#e2e8f0", "#64748b"],
    bijaStroke: "#f8fafc",
    auraGlow: "rgba(255, 255, 255, 0.2)",
  },
];

export default function MangoGeometryVisualizer({
  geoBelly,
  geoHook,
  geoShadow,
  geoHeat,
  geoData,
  loadingGeo,
  onBellyChange,
  onHookChange,
  onShadowChange,
  onHeatChange,
  onPreset,
  onReload,
}: MangoGeometryVisualizerProps) {
  const { success: toastSuccess } = useToast();

  // Mode: Static Blueprint vs Animated Living Object
  const [displayMode, setDisplayMode] = useState<"living_animation" | "static_blueprint">("living_animation");
  const [activePaletteId, setActivePaletteId] = useState<ExpressionPaletteId>("pakva_gold");
  const [isLivingPlaying, setIsLivingPlaying] = useState<boolean>(true);
  const [breathingRate, setBreathingRate] = useState<number>(1.0);
  const [copied, setCopied] = useState<boolean>(false);

  // Living animation state (continuous monotonic phase)
  const [livingTime, setLivingTime] = useState<number>(0);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const activeTheme =
    EXPRESSION_PALETTES.find((p) => p.id === activePaletteId) || EXPRESSION_PALETTES[0];

  useEffect(() => {
    if (!isLivingPlaying || displayMode !== "living_animation") {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const animateLiving = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setLivingTime((prev) => prev + dt * breathingRate);
      animRef.current = requestAnimationFrame(animateLiving);
    };

    animRef.current = requestAnimationFrame(animateLiving);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isLivingPlaying, displayMode, breathingRate]);

  // Derived living animation values
  const t = livingTime;
  const pranaScaleX = 1 + Math.sin(t * 1.8) * 0.038 * (geoHeat * 0.8 + 0.2);
  const pranaScaleY = 1 + Math.cos(t * 1.8) * 0.025 * (geoHeat * 0.8 + 0.2);
  const rippleRadius = 15 + ((t * 24) % 45);
  const rippleOpacity = Math.max(0, 0.7 - rippleRadius / 60);

  // Copy SVG Path
  const handleCopySvgPath = () => {
    if (!geoData?.body?.svg_path) return;
    navigator.clipboard.writeText(geoData.body.svg_path);
    setCopied(true);
    toastSuccess("Copied Āmra Rūpa SVG path to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Standalone SVG
  const handleDownloadSvg = () => {
    const svgEl = document.getElementById("amra-fruit-svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `amra_rupa_${activePaletteId}_${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toastSuccess("Downloaded Āmra Rūpa vector SVG");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Bar: Object Title & Mode Controls */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Āmra Rūpa • Sacred Graphical Object</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-normal">
                  Vedic Fruition &amp; Kairi Calculus
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {geoData?.philosophy?.summary ||
                  "Parametric Kairi teardrop curve, indestructible Amara Bīja seed, and shadow alchemy."}
              </p>
            </div>
          </div>
        </div>

        {/* Display Mode Switcher & Presets */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setDisplayMode("living_animation")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                displayMode === "living_animation"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Living Object</span>
            </button>
            <button
              onClick={() => setDisplayMode("static_blueprint")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                displayMode === "static_blueprint"
                  ? "bg-slate-800 text-cyan-300 border border-slate-700 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Static Blueprint</span>
            </button>
          </div>

          <button
            onClick={() => onPreset(125, 35, 0.25, 0.85)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
          >
            Canonical Core
          </button>
          <button
            onClick={() => onPreset(140, 45, 0.85, 0.45)}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-mono border border-indigo-700/50 transition"
          >
            Manthan
          </button>
          <button
            onClick={() => onPreset(130, 40, 0.4, 1.0)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-mono border border-emerald-700/50 transition"
          >
            Pakva
          </button>
          <button
            onClick={onReload}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Reload from API"
          >
            <RefreshCw className={`w-4 h-4 ${loadingGeo ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Visualizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: SVG Living Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/95 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {/* Top Telemetry & Arc Length Bar */}
          <div className="w-full flex justify-between items-center mb-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  displayMode === "living_animation" && isLivingPlaying
                    ? "bg-amber-400 animate-pulse"
                    : "bg-slate-600"
                }`}
              ></span>
              <span className="text-slate-200">
                {displayMode === "living_animation" ? "Prānic Resonance Active" : "Geometric Blueprint"}
              </span>
            </span>
            <span className="text-slate-400">
              Arc Length: <strong className="text-amber-300">{geoData?.body?.arc_length || 0}px</strong>
            </span>
          </div>

          {/* Responsive SVG Container */}
          <div
            className="w-full aspect-square max-w-[480px] relative flex items-center justify-center p-2 rounded-2xl bg-black border border-slate-900 shadow-2xl overflow-hidden"
            style={{
              boxShadow:
                displayMode === "living_animation"
                  ? `0 0 50px ${activeTheme.auraGlow}`
                  : "0 0 25px rgba(0,0,0,0.5)",
            }}
          >
            <svg
              id="amra-fruit-svg"
              viewBox="-250 -250 500 500"
              className="w-full h-full select-none"
            >
              <defs>
                {/* Dynamic Fruit Body Radial Gradient */}
                <radialGradient
                  id="livingAmraBodyGlow"
                  cx="45%"
                  cy="55%"
                  r="65%"
                >
                  <stop offset="0%" stopColor={activeTheme.bodyStops[0]} stopOpacity="0.98" />
                  <stop offset="40%" stopColor={activeTheme.bodyStops[1]} stopOpacity="0.92" />
                  <stop offset="78%" stopColor={activeTheme.bodyStops[2]} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={activeTheme.bodyStops[3]} stopOpacity="0.96" />
                </radialGradient>

                {/* Asuric Shadow Gradient */}
                <radialGradient id="amraShadowVortex" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.75" />
                  <stop offset="60%" stopColor="#3730a3" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>

                {/* Indestructible Seed Glow */}
                <radialGradient id="livingBijaGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={activeTheme.bijaStops[0]} stopOpacity="0.98" />
                  <stop offset="35%" stopColor={activeTheme.bijaStops[1]} stopOpacity="0.90" />
                  <stop offset="75%" stopColor={activeTheme.bijaStops[2]} stopOpacity="0.75" />
                  <stop offset="100%" stopColor={activeTheme.bijaStops[3]} stopOpacity="0.2" />
                </radialGradient>
              </defs>

              {/* 1. Blueprint Grid & Coordinate Axes (Visible in Static mode, subtle in living mode) */}
              <circle
                cx="0"
                cy="0"
                r="220"
                fill="none"
                stroke="#334155"
                strokeDasharray="4 6"
                opacity={displayMode === "static_blueprint" ? 0.45 : 0.15}
              />
              <circle
                cx="0"
                cy="0"
                r="160"
                fill="none"
                stroke="#334155"
                strokeDasharray="2 4"
                opacity={displayMode === "static_blueprint" ? 0.35 : 0.1}
              />
              <circle
                cx="0"
                cy="0"
                r="80"
                fill="none"
                stroke="#334155"
                strokeDasharray="2 2"
                opacity={displayMode === "static_blueprint" ? 0.3 : 0.08}
              />
              <line
                x1="-230"
                y1="0"
                x2="230"
                y2="0"
                stroke="#334155"
                opacity={displayMode === "static_blueprint" ? 0.35 : 0.1}
                strokeDasharray="2 4"
              />
              <line
                x1="0"
                y1="-230"
                x2="0"
                y2="230"
                stroke="#334155"
                opacity={displayMode === "static_blueprint" ? 0.35 : 0.1}
                strokeDasharray="2 4"
              />

              {/* 2. Asuric Shadow Field & 6 Demons */}
              <g opacity={Math.min(1.0, geoShadow * 1.2)}>
                <circle cx="-60" cy="70" r="90" fill="url(#amraShadowVortex)" />
                <circle cx="80" cy="-30" r="80" fill="url(#amraShadowVortex)" />

                {/* 6 Arishadvarga Vectors */}
                {geoData?.transmutation?.demons?.map((demon) => (
                  <g key={demon.index}>
                    <line
                      x1="0"
                      y1="20"
                      x2={demon.coord.x}
                      y2={demon.coord.y}
                      stroke="#818cf8"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.6"
                    />
                    <circle
                      cx={demon.coord.x}
                      cy={demon.coord.y}
                      r="3.5"
                      fill="#818cf8"
                      stroke="#c7d2fe"
                      strokeWidth="1"
                    />
                  </g>
                ))}
              </g>

              {/* 3. 5 Mango Leaves (Āmra-Pallava) with wind resonance */}
              {geoData?.leaves?.map((leaf, idx) => {
                const windOffset =
                  displayMode === "living_animation"
                    ? Math.sin(t * 2.2 + idx * 0.9) * 2.8
                    : 0;
                return (
                  <g
                    key={leaf.index}
                    transform={`rotate(${windOffset}, 0, ${-175 * 0.82 + 30})`}
                  >
                    <path
                      d={leaf.svg_path}
                      fill={activeTheme.leafFill}
                      stroke={activeTheme.leafStroke}
                      strokeWidth="1.4"
                      opacity="0.85"
                    />
                  </g>
                );
              })}

              {/* 4. The Living Mango Body with Prānic Pulsation */}
              <g
                transform={
                  displayMode === "living_animation"
                    ? `scale(${pranaScaleX}, ${pranaScaleY}) translate(0, ${Math.sin(t * 1.8) * 2})`
                    : undefined
                }
                style={{ transformOrigin: "0px 20px" }}
              >
                {/* Body Path */}
                {geoData?.body?.svg_path && (
                  <path
                    d={geoData.body.svg_path}
                    fill="url(#livingAmraBodyGlow)"
                    stroke={activeTheme.strokeColor}
                    strokeWidth={displayMode === "static_blueprint" ? "2.5" : "2.0"}
                  />
                )}

                {/* Indestructible Seed (Amara Bīja) */}
                {geoData?.bija?.svg_path && (
                  <path
                    d={geoData.bija.svg_path}
                    fill="url(#livingBijaGlow)"
                    stroke={activeTheme.bijaStroke}
                    strokeWidth="1.5"
                    strokeDasharray={displayMode === "static_blueprint" ? "3 2" : "none"}
                  />
                )}

                {/* Living Radiant Energy Rings from Seed */}
                {displayMode === "living_animation" && (
                  <>
                    <circle
                      cx="0"
                      cy="20"
                      r={rippleRadius}
                      fill="none"
                      stroke={activeTheme.bijaStroke}
                      strokeWidth="1"
                      opacity={rippleOpacity}
                    />
                    <circle
                      cx="0"
                      cy="20"
                      r={Math.max(5, rippleRadius * 0.6)}
                      fill="none"
                      stroke={activeTheme.strokeColor}
                      strokeWidth="0.8"
                      opacity={rippleOpacity * 0.8}
                    />
                  </>
                )}
              </g>

              {/* 5. Apex Bindu */}
              <circle
                cx="0"
                cy={-175 * 0.82 + 30}
                r="4.5"
                fill="#fef08a"
                stroke={activeTheme.strokeColor}
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Playback & Export Transport Bar */}
          <div className="w-full mt-4 pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            {displayMode === "living_animation" ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLivingPlaying(!isLivingPlaying)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition ${
                    isLivingPlaying
                      ? "bg-amber-950/60 text-amber-300 border-amber-700/50"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  {isLivingPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{isLivingPlaying ? "Breathing" : "Frozen"}</span>
                </button>

                <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 px-2 py-1 space-x-1.5 text-slate-400 font-mono text-[11px]">
                  <Wind className="w-3 h-3 text-amber-400" />
                  <span>Rate: {breathingRate.toFixed(1)}x</span>
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.1"
                    value={breathingRate}
                    onChange={(e) => setBreathingRate(parseFloat(e.target.value))}
                    className="w-16 accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Static Parametric Analysis Mode</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopySvgPath}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1 font-mono text-xs transition"
                title="Copy SVG path"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "Copied" : "Path"}</span>
              </button>

              <button
                onClick={handleDownloadSvg}
                className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800 flex items-center space-x-1.5 font-mono text-xs transition"
                title="Download Standalone SVG"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download SVG</span>
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="w-full mt-3 pt-3 border-t border-slate-900 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <span className="block text-slate-500 text-[10px] font-mono">GOLDEN RATIO Φ</span>
              <span className="font-mono text-amber-300 font-semibold">
                {geoData?.body?.golden_ratio_phi?.toFixed(6) || "1.618033"}
              </span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <span className="block text-slate-500 text-[10px] font-mono">CHURNING BALANCE</span>
              <span className="font-mono text-indigo-300 font-semibold">
                {geoData?.transmutation?.devic_ratio?.toFixed(0) || "50"}% Light /{" "}
                {geoData?.transmutation?.asuric_ratio?.toFixed(0) || "50"}% Shadow
              </span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <span className="block text-slate-500 text-[10px] font-mono">ALCHEMICAL STATE</span>
              <span
                className={`font-mono font-semibold ${
                  geoData?.transmutation?.state === "pakva"
                    ? "text-emerald-300"
                    : geoData?.transmutation?.state === "manthan"
                    ? "text-amber-300"
                    : "text-rose-300"
                }`}
              >
                {geoData?.transmutation?.state === "pakva"
                  ? "Pakva (Ripe Nectar)"
                  : geoData?.transmutation?.state === "manthan"
                  ? "Manthan (Churning)"
                  : "Āma (Raw Acid)"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Studio Sliders & Expression Palettes (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Expression Palettes Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3.5">
            <h4 className="text-sm font-semibold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span>Sacred Color Expressions</span>
              <span className="text-xs font-mono text-amber-400">Object Palettes</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXPRESSION_PALETTES.map((theme) => {
                const isActive = activePaletteId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setActivePaletteId(theme.id);
                      toastSuccess(`Activated expression: ${theme.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isActive
                        ? "bg-slate-800 border-amber-500/50 shadow-md"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${theme.bodyStops[0]}, ${theme.bodyStops[1]})`,
                        }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {theme.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {theme.tag}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parametric Calculus Sliders */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h4 className="text-sm font-semibold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span>Parametric Calculus</span>
              <span className="text-xs font-mono text-amber-400">Real-Time Synthesis</span>
            </h4>

            {/* Slider 1: Belly Fullness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">
                  Belly Fullness (Garbha • Receptivity)
                </label>
                <span className="font-mono text-amber-400">{geoBelly}</span>
              </div>
              <input
                type="range"
                min="80"
                max="170"
                value={geoBelly}
                onChange={(e) => onBellyChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[11px] text-slate-500">
                Governs lateral capacity to store digested experience and creative harvest.
              </p>
            </div>

            {/* Slider 2: Apex Crest Hook */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">
                  Crest Hook Deflection (Pratyāhāra • Inward Bow)
                </label>
                <span className="font-mono text-amber-400">{geoHook}</span>
              </div>
              <input
                type="range"
                min="10"
                max="65"
                step="1"
                value={geoHook}
                onChange={(e) => onHookChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[11px] text-slate-500">
                The sacred inflection: bowing inward towards the source rather than egoic expansion.
              </p>
            </div>

            {/* Slider 3: Shadow Churning */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">
                  Inner Shadow Integration (Asuric Tension)
                </label>
                <span className="font-mono text-indigo-400">{geoShadow.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={geoShadow}
                onChange={(e) => onShadowChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[11px] text-slate-500">
                The counter-weight torque of unresolved shadow required to churn the ocean.
              </p>
            </div>

            {/* Slider 4: Ripening Heat */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">
                  Ripening Fire (Sūrya Agni • Solar Awareness)
                </label>
                <span className="font-mono text-emerald-400">{geoHeat.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={geoHeat}
                onChange={(e) => onHeatChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[11px] text-slate-500">
                Transmutes caustic acids into sweet golden nectar without destroying the essence.
              </p>
            </div>
          </div>

          {/* Arishadvarga Subcomponent */}
          <EsotericShadowAlchemy
            demons={geoData?.transmutation?.demons}
            philosophy={geoData?.philosophy || null}
          />
        </div>
      </div>

      {/* 3. Mathematical Equations Card */}
      {geoData?.mathematical_formulas && Object.keys(geoData.mathematical_formulas).length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h4 className="text-sm font-semibold text-amber-300 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Mathematical Formulations of the Esoteric (Storehouse Engine)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {Object.entries(geoData.mathematical_formulas).map(([formulaKey, formulaVal]) => {
              const label = formulaKey.replace(/_/g, " ").toUpperCase();
              return (
                <div
                  key={formulaKey}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1"
                >
                  <span className="text-amber-400 text-[11px] font-semibold block">{label}</span>
                  <div className="text-slate-300 break-all text-[11px]">{formulaVal}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
