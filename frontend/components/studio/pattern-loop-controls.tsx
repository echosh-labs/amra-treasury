"use client";

import React from "react";
import { Sparkles, RotateCw, Clock, Flame, Music, Layers } from "lucide-react";

interface PatternLoopControlsProps {
  baseCycleSec: number;
  repeatCount: number;
  octaveModulation: boolean;
  hueShiftDegPerCycle: number;
  pranaHeatIncrement: number;
  onBaseCycleChange: (val: number) => void;
  onRepeatCountChange: (val: number) => void;
  onOctaveToggle: (val: boolean) => void;
  onHueShiftChange: (val: number) => void;
  onHeatIncrementChange: (val: number) => void;
  onApplyDurationPreset: (baseCycle: number, repeats: number) => void;
}

export default function PatternLoopControls({
  baseCycleSec,
  repeatCount,
  octaveModulation,
  hueShiftDegPerCycle,
  pranaHeatIncrement,
  onBaseCycleChange,
  onRepeatCountChange,
  onOctaveToggle,
  onHueShiftChange,
  onHeatIncrementChange,
  onApplyDurationPreset,
}: PatternLoopControlsProps) {
  const totalSeconds = baseCycleSec * repeatCount;
  const minutes = (totalSeconds / 60).toFixed(1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <RotateCw className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-white font-mono">
              Pattern-Loop &amp; Repetition Engine
            </h4>
            <p className="text-[11px] text-slate-400">
              Rhythmic cycle recurrence with progressive harmonic modulation.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-amber-300 font-mono">
            {minutes} Minutes
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Total Video Length ({totalSeconds.toFixed(0)}s)
          </div>
        </div>
      </div>

      {/* Quick Duration Presets */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {[
          { label: "108s Cycle (1x)", base: 108, count: 1 },
          { label: "15-Min Meditation (8x)", base: 108, count: 8 },
          { label: "30-Min Deep Dive (17x)", base: 108, count: 17 },
          { label: "1-Hour Chronicle (34x)", base: 108, count: 34 },
        ].map((p) => (
          <button
            key={p.label}
            onClick={() => onApplyDurationPreset(p.base, p.count)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px]"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Base Cycle Duration */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex justify-between font-mono">
            <span className="text-slate-300">Base Cycle Duration</span>
            <span className="text-amber-400 font-semibold">{baseCycleSec}s</span>
          </div>
          <input
            type="range"
            min="30"
            max="300"
            step="6"
            value={baseCycleSec}
            onChange={(e) => onBaseCycleChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
          <p className="text-[10px] text-slate-500">Duration of one single unbroken energetic movement.</p>
        </div>

        {/* Repeat Count */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex justify-between font-mono">
            <span className="text-slate-300">Pattern Repetitions</span>
            <span className="text-purple-400 font-semibold">{repeatCount} Cycles</span>
          </div>
          <input
            type="range"
            min="1"
            max="48"
            step="1"
            value={repeatCount}
            onChange={(e) => onRepeatCountChange(parseInt(e.target.value, 10))}
            className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
          <p className="text-[10px] text-slate-500">Repeats the macro-cycle along the timeline.</p>
        </div>

        {/* Hue Shift Per Cycle */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex justify-between font-mono">
            <span className="text-slate-300">Cycle Hue Rotation</span>
            <span className="text-cyan-400 font-semibold">+{hueShiftDegPerCycle}°/cycle</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={hueShiftDegPerCycle}
            onChange={(e) => onHueShiftChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
          <p className="text-[10px] text-slate-500">Rotates color spectrum progression per repeat.</p>
        </div>

        {/* Octave Modulation Toggle */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-slate-300 block font-mono">Harmonic Octave Progression</span>
            <span className="text-[10px] text-slate-500">Elevates Solfeggio frequency intervals per cycle</span>
          </div>
          <button
            onClick={() => onOctaveToggle(!octaveModulation)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition border ${
              octaveModulation
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/50 font-semibold"
                : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
            }`}
          >
            {octaveModulation ? "Active" : "Static"}
          </button>
        </div>
      </div>
    </div>
  );
}
