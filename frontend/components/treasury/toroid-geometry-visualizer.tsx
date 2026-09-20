"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  Copy,
  Download,
  Check,
  BookmarkPlus,
  Sliders,
  Maximize2,
} from "lucide-react";
import {
  ToroidParams,
  ToroidGeometryResult,
  ToroidPreset,
  ToroidApiResponse,
} from "@/lib/types/treasury";
import { useToast } from "@/lib/toast-context";

interface ToroidGeometryVisualizerProps {
  onPresetSelect?: (preset: ToroidPreset) => void;
}

type ColorTheme = "monochrome" | "golden" | "ultraviolet" | "cyan";

export default function ToroidGeometryVisualizer({
  onPresetSelect,
}: ToroidGeometryVisualizerProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // Mathematical Parameters State
  const [majorR, setMajorR] = useState<number>(130);
  const [minorR, setMinorR] = useState<number>(95);
  const [lineCount, setLineCount] = useState<number>(108);
  const [missMargin, setMissMargin] = useState<number>(7.5);
  const [tiltAngle, setTiltAngle] = useState<number>(0);
  const [mode, setMode] = useState<"discrete_rings" | "continuous" | "chords">("discrete_rings");
  const [strokeWidth, setStrokeWidth] = useState<number>(1.0);
  const [strokeOpacity, setStrokeOpacity] = useState<number>(0.65);

  // Visualizer Experience State
  const [theme, setTheme] = useState<ColorTheme>("monochrome");
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.25);
  const [copied, setCopied] = useState<boolean>(false);
  const [savingPreset, setSavingPreset] = useState<boolean>(false);

  // API Data State
  const [toroidData, setToroidData] = useState<ToroidGeometryResult | null>(null);
  const [presets, setPresets] = useState<ToroidPreset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const animRef = useRef<number | null>(null);

  // Fetch Toroid geometry from backend
  const fetchGeometry = useCallback(
    async (
      rMaj = majorR,
      rMin = minorR,
      lines = lineCount,
      miss = missMargin,
      tilt = tiltAngle,
      m = mode
    ) => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          r_major: rMaj.toString(),
          r_minor: rMin.toString(),
          lines: lines.toString(),
          miss: miss.toString(),
          tilt: tilt.toString(),
          mode: m,
        });
        const res = await fetch(`/api/v1/amra/geometry/toroid?${query.toString()}`);
        if (res.ok) {
          const data: ToroidApiResponse = await res.json();
          setToroidData(data.geometry);
          if (data.presets && data.presets.length > 0) {
            setPresets(data.presets);
          }
        }
      } catch (err) {
        console.error("Failed to load toroid geometry:", err);
      } finally {
        setLoading(false);
      }
    },
    [majorR, minorR, lineCount, missMargin, tiltAngle, mode]
  );

  useEffect(() => {
    fetchGeometry();
  }, [fetchGeometry]);

  // Live Continuous Rotation Loop
  useEffect(() => {
    if (!isRotating) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const rotate = () => {
      setRotationAngle((prev) => (prev + rotationSpeed) % 360);
      animRef.current = requestAnimationFrame(rotate);
    };

    animRef.current = requestAnimationFrame(rotate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRotating, rotationSpeed]);

  // Apply Preset
  const handleApplyPreset = (preset: ToroidPreset) => {
    setMajorR(preset.major_radius);
    setMinorR(preset.minor_radius);
    setLineCount(preset.line_count);
    setMissMargin(preset.miss_margin);
    setTiltAngle(preset.tilt_angle);
    setMode(preset.mode);
    fetchGeometry(
      preset.major_radius,
      preset.minor_radius,
      preset.line_count,
      preset.miss_margin,
      preset.tilt_angle,
      preset.mode
    );
    if (onPresetSelect) onPresetSelect(preset);
    toastSuccess(`Loaded preset: ${preset.name}`);
  };

  // Copy SVG Path to Clipboard
  const handleCopyPath = () => {
    if (!toroidData?.svg_path) return;
    navigator.clipboard.writeText(toroidData.svg_path);
    setCopied(true);
    toastSuccess("Copied Toroid SVG vector path to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Download SVG File
  const handleDownloadSVG = () => {
    if (!toroidData) return;
    const strokeColor =
      theme === "monochrome"
        ? "#e2e8f0"
        : theme === "golden"
        ? "#f59e0b"
        : theme === "ultraviolet"
        ? "#c084fc"
        : "#22d3ee";

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-250 -250 500 500" width="1000" height="1000" style="background:#020617">
  <defs>
    <radialGradient id="eventHorizon" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="1" />
      <stop offset="85%" stop-color="#020617" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>
  </defs>
  <!-- Background Event Horizon Void -->
  <circle cx="0" cy="0" r="${toroidData.inner_hole_radius}" fill="url(#eventHorizon)" />
  <!-- Sacred Toroid Filaments (Miss Margin: ${missMargin}°) -->
  <g transform="rotate(${rotationAngle} 0 0)">
    <path d="${toroidData.svg_path}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" />
  </g>
</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toroid-singularity-${lineCount}lines-${missMargin}deg.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastSuccess("Downloaded Toroid vector artwork (.svg)");
  };

  // Save Preset to BoltDB Storehouse
  const handleSavePreset = async () => {
    setSavingPreset(true);
    try {
      const presetName = prompt("Enter a name for this custom Sacred Torus preset:", "My Toroidal Singularity");
      if (!presetName) {
        setSavingPreset(false);
        return;
      }

      const res = await fetch("/api/v1/amra/artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          description: `Custom Toroid with ${lineCount} lines, miss margin ${missMargin}°, tilt ${tiltAngle}° (${mode}).`,
          major_radius: majorR,
          minor_radius: minorR,
          line_count: lineCount,
          miss_margin: missMargin,
          tilt_angle: tiltAngle,
          mode: mode,
        }),
      });

      if (res.ok) {
        toastSuccess(`Saved "${presetName}" to Treasury Artwork Storehouse`);
        fetchGeometry();
      } else {
        toastError("Failed to save preset to storehouse");
      }
    } catch (err: any) {
      toastError(`Save error: ${err.message}`);
    } finally {
      setSavingPreset(false);
    }
  };

  // Palette styling resolver
  const getThemeColors = () => {
    switch (theme) {
      case "golden":
        return {
          stroke: "#f59e0b",
          glow: "rgba(245, 158, 11, 0.15)",
          border: "border-amber-500/30",
          text: "text-amber-400",
          core: "#1e1304",
        };
      case "ultraviolet":
        return {
          stroke: "#c084fc",
          glow: "rgba(192, 132, 252, 0.15)",
          border: "border-purple-500/30",
          text: "text-purple-400",
          core: "#150824",
        };
      case "cyan":
        return {
          stroke: "#22d3ee",
          glow: "rgba(34, 211, 238, 0.15)",
          border: "border-cyan-500/30",
          text: "text-cyan-400",
          core: "#041724",
        };
      case "monochrome":
      default:
        return {
          stroke: "#e2e8f0",
          glow: "rgba(226, 232, 240, 0.10)",
          border: "border-slate-700",
          text: "text-slate-300",
          core: "#000000",
        };
    }
  };

  const themeColors = getThemeColors();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Toroidal Singularity &amp; Akasha Vortex</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-normal">
                  Circumscribed Plain Lines • Sacred Geometry
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {toroidData?.sacred_philosophy ||
                  "A toroidal circle of circumscribed lines intentionally missing their start points to form a uniform vortex with an event horizon black hole."}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center flex-wrap gap-2">
          {presets.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 transition"
              title={p.description}
            >
              {p.name.split(" ")[0]}
            </button>
          ))}
          <button
            onClick={() => fetchGeometry()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Reload from API"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: SVG Canvas + Control Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: SVG Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {/* Canvas Header & Stats */}
          <div className="w-full flex justify-between items-center mb-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Toroidal Field [/api/v1/amra/geometry/toroid]</span>
            </span>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Filaments: <strong className="text-white">{toroidData?.total_filaments || lineCount}</strong></span>
              <span>Hole Radius: <strong className="text-white">{toroidData?.inner_hole_radius?.toFixed(1) || (majorR - minorR)}px</strong></span>
            </div>
          </div>

          {/* SVG Vector Canvas */}
          <div className="w-full aspect-square max-w-[480px] relative flex items-center justify-center p-2 rounded-2xl bg-black border border-slate-900 shadow-inner">
            <svg
              viewBox="-250 -250 500 500"
              className="w-full h-full drop-shadow-2xl select-none"
            >
              <defs>
                {/* Event Horizon Pitch-Black Radial Falloff */}
                <radialGradient id="blackHoleCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={themeColors.core} stopOpacity="1" />
                  <stop offset="70%" stopColor="#000000" stopOpacity="0.98" />
                  <stop offset="95%" stopColor="#020617" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>

                <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer Alignment Coordinate Marks */}
              <circle cx="0" cy="0" r="235" fill="none" stroke="#1e293b" strokeDasharray="3 6" opacity="0.35" />
              <circle cx="0" cy="0" r="180" fill="none" stroke="#1e293b" strokeDasharray="2 4" opacity="0.25" />
              <line x1="-240" y1="0" x2="240" y2="0" stroke="#1e293b" opacity="0.2" strokeDasharray="2 4" />
              <line x1="0" y1="-240" x2="0" y2="240" stroke="#1e293b" opacity="0.2" strokeDasharray="2 4" />

              {/* The Sacred Toroid Precessing Filaments */}
              <g
                transform={`rotate(${rotationAngle} 0 0)`}
                filter={theme !== "monochrome" ? "url(#subtleGlow)" : undefined}
              >
                {toroidData?.svg_path && (
                  <path
                    d={toroidData.svg_path}
                    fill="none"
                    stroke={themeColors.stroke}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>

              {/* Central Black Hole Event Horizon Void (Masks center with true black) */}
              {toroidData && toroidData.inner_hole_radius > 5 && (
                <g pointerEvents="none">
                  <circle
                    cx="0"
                    cy="0"
                    r={toroidData.inner_hole_radius}
                    fill="url(#blackHoleCore)"
                  />
                  {/* Subtle Boundary Horizon Ring */}
                  <circle
                    cx="0"
                    cy="0"
                    r={toroidData.inner_hole_radius}
                    fill="none"
                    stroke={themeColors.stroke}
                    strokeWidth={0.75}
                    strokeDasharray="2 3"
                    strokeOpacity={0.4}
                  />
                  {/* Central Singularity Point (Bindu) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="1.8"
                    fill={themeColors.stroke}
                    opacity="0.8"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Canvas Bottom Action Bar */}
          <div className="w-full mt-4 pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Theme Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-mono text-[11px] mr-1">THEME:</span>
              <button
                onClick={() => setTheme("monochrome")}
                className={`px-2 py-1 rounded text-[11px] font-mono transition border ${
                  theme === "monochrome"
                    ? "bg-slate-800 text-white border-slate-600"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                Plain Ink
              </button>
              <button
                onClick={() => setTheme("golden")}
                className={`px-2 py-1 rounded text-[11px] font-mono transition border ${
                  theme === "golden"
                    ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-200"
                }`}
              >
                Golden Akasha
              </button>
              <button
                onClick={() => setTheme("ultraviolet")}
                className={`px-2 py-1 rounded text-[11px] font-mono transition border ${
                  theme === "ultraviolet"
                    ? "bg-purple-950/60 text-purple-300 border-purple-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-purple-200"
                }`}
              >
                Ultraviolet
              </button>
              <button
                onClick={() => setTheme("cyan")}
                className={`px-2 py-1 rounded text-[11px] font-mono transition border ${
                  theme === "cyan"
                    ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-cyan-200"
                }`}
              >
                Cyan
              </button>
            </div>

            {/* Animation & Export Actions */}
            <div className="flex items-center space-x-2">
              {/* Rotation Toggle */}
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition ${
                  isRotating
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/50"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                }`}
                title={isRotating ? "Pause continuous rotation" : "Play continuous rotation"}
              >
                {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRotating ? "Rotating" : "Flow"}</span>
              </button>

              {/* Copy SVG Path */}
              <button
                onClick={handleCopyPath}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                title="Copy SVG Vector Path"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Download SVG */}
              <button
                onClick={handleDownloadSVG}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                title="Download Standalone SVG File"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Save Preset to Storehouse */}
              <button
                onClick={handleSavePreset}
                disabled={savingPreset}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-amber-950/40 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/30 transition flex items-center space-x-1 text-xs font-mono"
                title="Save this configuration into BoltDB Storehouse"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="w-full mt-4 pt-3 border-t border-slate-900 grid grid-cols-4 gap-2 text-center text-[11px] font-mono">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block text-[9px]">MISS MARGIN (δ)</span>
              <span className="text-amber-400 font-semibold">{missMargin}°</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block text-[9px]">CLOSURE GAP</span>
              <span className="text-cyan-400 font-semibold">{toroidData?.closure_gap?.toFixed(2) || "0.00"}px</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block text-[9px]">ASPECT RATIO (R/r)</span>
              <span className="text-purple-400 font-semibold">{(majorR / (minorR || 1)).toFixed(3)}</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block text-[9px]">TOTAL RADIUS</span>
              <span className="text-emerald-400 font-semibold">{toroidData?.outer_radius?.toFixed(0) || (majorR + minorR)}px</span>
            </div>
          </div>
        </div>

        {/* Right: Parametric Sliders & Mode Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h4 className="text-sm font-semibold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Parametric Toroid Controls</span>
              </span>
              <span className="text-xs font-mono text-cyan-400">Live Synthesis</span>
            </h4>

            {/* Slider 1: Miss Margin (The core concept!) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-200 font-medium flex items-center gap-1.5">
                  <span>Precession Miss Margin (δ)</span>
                  <span className="text-[10px] text-amber-400 font-mono px-1.5 py-0.2 rounded bg-amber-500/10">
                    Non-closure Angle
                  </span>
                </label>
                <span className="font-mono text-amber-400 font-semibold">{missMargin}°</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="45.0"
                step="0.1"
                value={missMargin}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMissMargin(val);
                  fetchGeometry(majorR, minorR, lineCount, val, tiltAngle, mode);
                }}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[11px] text-slate-500">
                Determines how far each circumscribed line intentionally misses its starting point, weaving the moiré vortex.
              </p>
            </div>

            {/* Slider 2: Line Density (Line Count) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-200 font-medium">Circumscribed Filaments (N)</label>
                <span className="font-mono text-cyan-400 font-semibold">{lineCount} lines</span>
              </div>
              <input
                type="range"
                min="24"
                max="360"
                step="4"
                value={lineCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setLineCount(val);
                  fetchGeometry(majorR, minorR, val, missMargin, tiltAngle, mode);
                }}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              {/* Quick count chips */}
              <div className="flex gap-1.5 pt-1">
                {[48, 72, 108, 144, 216].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => {
                      setLineCount(cnt);
                      fetchGeometry(majorR, minorR, cnt, missMargin, tiltAngle, mode);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                      lineCount === cnt
                        ? "bg-cyan-950 text-cyan-300 border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 3: Central Void (Black Hole Event Horizon Aperture) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-200 font-medium">Major Orbit Radius (R)</label>
                <span className="font-mono text-purple-400 font-semibold">{majorR}px</span>
              </div>
              <input
                type="range"
                min="70"
                max="180"
                step="1"
                value={majorR}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMajorR(val);
                  fetchGeometry(val, minorR, lineCount, missMargin, tiltAngle, mode);
                }}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[11px] text-slate-500">
                Distance from singularity center to filament orbit center (Void = |R - r| = {Math.abs(majorR - minorR)}px).
              </p>
            </div>

            {/* Slider 4: Minor Filament Radius */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-200 font-medium">Filament Ring Radius (r)</label>
                <span className="font-mono text-purple-400 font-semibold">{minorR}px</span>
              </div>
              <input
                type="range"
                min="40"
                max="150"
                step="1"
                value={minorR}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMinorR(val);
                  fetchGeometry(majorR, val, lineCount, missMargin, tiltAngle, mode);
                }}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Slider 5: 3D Projection Tilt */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-200 font-medium">3D Perspective Tilt (α)</label>
                <span className="font-mono text-emerald-400 font-semibold">{tiltAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={tiltAngle}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTiltAngle(val);
                  fetchGeometry(majorR, minorR, lineCount, missMargin, val, mode);
                }}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[11px] text-slate-500">
                Tilts the projection from top-down flat plane (0°) to 3D isometric toroidal donut depth (60°).
              </p>
            </div>

            {/* Mode & Stroke Width Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Filament Mode</label>
                <select
                  value={mode}
                  onChange={(e) => {
                    const m = e.target.value as any;
                    setMode(m);
                    fetchGeometry(majorR, minorR, lineCount, missMargin, tiltAngle, m);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-slate-600"
                >
                  <option value="discrete_rings">Precessing Rings</option>
                  <option value="continuous">Unbroken Spiral</option>
                  <option value="chords">String-Art Chords</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Line Width: {strokeWidth}px</label>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                  className="w-full accent-slate-400 bg-slate-800 rounded-lg cursor-pointer h-1.5 mt-2"
                />
              </div>
            </div>
          </div>

          {/* Stored Storehouse Presets List */}
          {presets.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h5 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Treasury Storehouse Presets</span>
                <span className="text-slate-500 text-[10px]">{presets.length} Presets Available</span>
              </h5>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {presets.map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => handleApplyPreset(pr)}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition">
                        {pr.name}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{pr.description}</div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-slate-500">
                      <div>{pr.line_count}L • {pr.miss_margin}°</div>
                      <div className="capitalize text-slate-600">{pr.mode.replace("_", " ")}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mathematical Formulations Card */}
      {toroidData?.formulas && Object.keys(toroidData.formulas).length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h4 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Mathematical Formulations of the Toroidal Singularity</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            {Object.entries(toroidData.formulas).map(([formulaKey, formulaVal]) => {
              const label = formulaKey.replace(/_/g, " ").toUpperCase();
              return (
                <div key={formulaKey} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-amber-400 text-[11px] font-semibold block">{label}</span>
                  <div className="text-slate-300 break-all text-[11px] font-mono">
                    {formulaVal}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
