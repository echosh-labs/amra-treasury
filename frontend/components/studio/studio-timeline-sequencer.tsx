"use client";

import React, { useRef } from "react";
import {
  Layers,
  Sparkles,
  Music,
  Activity,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface ObjectTrackState {
  id: string;
  name: string;
  objectType: "amra_mango" | "golden_shri_yantra" | "torus_seed";
  enabled: boolean;
  animationMode: "pulsing_prana" | "orbiting_axis" | "float_transcendence" | "harmonic_breath";
  baseScale: number;
  rotationSpeedRpm: number;
  glowIntensity: number;
}

export interface AudioTrackState {
  enabled: boolean;
  baseFreqHz: number;
  harmonicPreset: "om_108" | "anahata_432" | "solfeggio_528" | "ajna_852";
  volume: number;
  octaveModulation: boolean;
}

interface StudioTimelineSequencerProps {
  totalDurationSec: number;
  baseCycleSec: number;
  repeatCount: number;
  currentTime: number;
  onSeek: (time: number) => void;
  backdropStyle: string;
  palette: string;
  objectTrack: ObjectTrackState;
  onUpdateObjectTrack: (updater: (prev: ObjectTrackState) => ObjectTrackState) => void;
  audioTrack: AudioTrackState;
  onUpdateAudioTrack: (updater: (prev: AudioTrackState) => AudioTrackState) => void;
}

export default function StudioTimelineSequencer({
  totalDurationSec,
  baseCycleSec,
  repeatCount,
  currentTime,
  onSeek,
  backdropStyle,
  palette,
  objectTrack,
  onUpdateObjectTrack,
  audioTrack,
  onUpdateAudioTrack,
}: StudioTimelineSequencerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * totalDurationSec);
  };

  const currentPercent = totalDurationSec > 0 ? (currentTime / totalDurationSec) * 100 : 0;

  // Generate markers for each cycle
  const cycles = Array.from({ length: Math.min(repeatCount, 36) }, (_, i) => i);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
              Multi-Track Timeline Sequencer
            </h3>
            <p className="text-xs text-slate-400">
              {repeatCount} Cycles × {baseCycleSec}s = {totalDurationSec}s ({(totalDurationSec / 60).toFixed(1)} min)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            Playhead: <span className="text-emerald-400 font-bold">{currentTime.toFixed(1)}s</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
            Progress: <span className="text-amber-400 font-bold">{currentPercent.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      {/* Timeline Visual Canvas Area */}
      <div className="space-y-2">
        {/* Timeline Ruler */}
        <div
          ref={rulerRef}
          onClick={handleRulerClick}
          className="relative h-7 bg-slate-950/80 border border-slate-800 rounded-lg cursor-pointer select-none overflow-hidden"
        >
          {/* Cycle tick lines */}
          {cycles.map((c) => {
            const leftPct = (c / repeatCount) * 100;
            return (
              <div
                key={c}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 bottom-0 border-l border-slate-700/70 flex items-start pl-1"
              >
                <span className="text-[9px] font-mono text-slate-500 leading-none pt-1">
                  C{c + 1}
                </span>
              </div>
            );
          })}

          {/* Current playhead marker */}
          <div
            style={{ left: `${currentPercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-20 shadow-[0_0_8px_#34d399] pointer-events-none"
          >
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full -ml-1 -mt-0.5" />
          </div>
        </div>

        {/* Track 1: Sacred Geometry Backdrop Track */}
        <div className="flex items-stretch bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="w-48 p-3 border-r border-slate-800 flex flex-col justify-between shrink-0 bg-slate-900/50">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-200">Backdrop Geometry</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-1">
              {backdropStyle} • {palette}
            </div>
          </div>

          <div className="flex-1 relative h-14 p-1 flex items-center overflow-hidden bg-slate-950/30">
            {/* Cycle blocks representation */}
            <div className="w-full h-full flex gap-1">
              {cycles.map((c) => (
                <div
                  key={c}
                  className="flex-1 h-full rounded-md border border-purple-500/20 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-900/30 flex flex-col justify-center items-center text-[10px] text-purple-300 font-mono"
                >
                  <span className="opacity-60">Loop {c + 1}</span>
                  <span className="text-[9px] text-indigo-400/80">+{c * 15}° Hue</span>
                </div>
              ))}
            </div>

            {/* Playhead bar overlay */}
            <div
              style={{ left: `${currentPercent}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/80 z-20 pointer-events-none"
            />
          </div>
        </div>

        {/* Track 2: Smart Sacred Object Track (Āmra Rūpa Mango) */}
        <div className="flex items-stretch bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="w-48 p-3 border-r border-slate-800 flex flex-col justify-between shrink-0 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-slate-200">Sacred Object</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateObjectTrack((prev) => ({ ...prev, enabled: !prev.enabled }))
                }
                className={`p-1 rounded transition-colors ${
                  objectTrack.enabled ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-600 hover:bg-slate-800"
                }`}
                title={objectTrack.enabled ? "Disable Object" : "Enable Object"}
              >
                {objectTrack.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-1">
              {objectTrack.name} ({objectTrack.animationMode.replace("_", " ")})
            </div>
          </div>

          <div className="flex-1 relative h-14 p-1 flex items-center overflow-hidden bg-slate-950/30">
            {objectTrack.enabled ? (
              <div className="w-full h-full flex gap-1">
                {cycles.map((c) => (
                  <div
                    key={c}
                    className="flex-1 h-full rounded-md border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 flex items-center justify-center space-x-1.5 px-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-amber-200">
                      Prāna {c + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 italic">
                Sacred Object Track Bypassed / Muted
              </div>
            )}

            {/* Playhead bar overlay */}
            <div
              style={{ left: `${currentPercent}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/80 z-20 pointer-events-none"
            />
          </div>
        </div>

        {/* Track 3: Nada Anahata Harmonic Audio Track */}
        <div className="flex items-stretch bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="w-48 p-3 border-r border-slate-800 flex flex-col justify-between shrink-0 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium text-slate-200">Nāda Audio Drone</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateAudioTrack((prev) => ({ ...prev, enabled: !prev.enabled }))
                }
                className={`p-1 rounded transition-colors ${
                  audioTrack.enabled ? "text-cyan-400 hover:bg-cyan-500/10" : "text-slate-600 hover:bg-slate-800"
                }`}
                title={audioTrack.enabled ? "Mute Audio Drone" : "Unmute Audio Drone"}
              >
                {audioTrack.enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-[10px] text-cyan-300 font-mono mt-1">
              {audioTrack.baseFreqHz} Hz • {audioTrack.harmonicPreset.replace("_", " ").toUpperCase()}
            </div>
          </div>

          <div className="flex-1 relative h-14 p-1 flex items-center overflow-hidden bg-slate-950/30">
            {audioTrack.enabled ? (
              <div className="w-full h-full flex gap-1">
                {cycles.map((c) => (
                  <div
                    key={c}
                    className="flex-1 h-full rounded-md border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-teal-900/20 to-cyan-950/30 flex items-center justify-center space-x-1"
                  >
                    <div className="flex items-end space-x-0.5 h-6">
                      <div className="w-1 bg-cyan-400 rounded-t h-2" />
                      <div className="w-1 bg-cyan-400 rounded-t h-4" />
                      <div className="w-1 bg-cyan-400 rounded-t h-5" />
                      <div className="w-1 bg-cyan-400 rounded-t h-3" />
                    </div>
                    <span className="text-[9px] font-mono text-cyan-300/80">
                      {audioTrack.baseFreqHz * (audioTrack.octaveModulation && c % 2 === 1 ? 1.5 : 1)}Hz
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 italic">
                Nāda Audio Track Muted (Silent Video)
              </div>
            )}

            {/* Playhead bar overlay */}
            <div
              style={{ left: `${currentPercent}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400/80 z-20 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Track Parameters & Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
        {/* Object Track Settings */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sacred Object Motion Inspector
            </span>
            <span className="text-[11px] text-amber-400 font-mono">
              Scale: {objectTrack.baseScale.toFixed(2)}x
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Animation Style</label>
              <select
                value={objectTrack.animationMode}
                onChange={(e) =>
                  onUpdateObjectTrack((prev) => ({
                    ...prev,
                    animationMode: e.target.value as any,
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="pulsing_prana">Pulsing Prāna</option>
                <option value="harmonic_breath">Harmonic Breath</option>
                <option value="orbiting_axis">Orbiting Axis</option>
                <option value="float_transcendence">Float Transcendence</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Sacred Rūpa</label>
              <select
                value={objectTrack.objectType}
                onChange={(e) =>
                  onUpdateObjectTrack((prev) => ({
                    ...prev,
                    objectType: e.target.value as any,
                    name:
                      e.target.value === "amra_mango"
                        ? "Āmra Rūpa Mango"
                        : e.target.value === "golden_shri_yantra"
                        ? "Golden Śrī Yantra"
                        : "Torus Seed of Life",
                  }))
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="amra_mango">Āmra Rūpa Mango</option>
                <option value="golden_shri_yantra">Golden Śrī Yantra</option>
                <option value="torus_seed">Torus Seed of Life</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Rūpa Scale & Prominence</span>
              <span className="text-slate-300 font-mono">{(objectTrack.baseScale * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.8"
              step="0.05"
              value={objectTrack.baseScale}
              onChange={(e) =>
                onUpdateObjectTrack((prev) => ({
                  ...prev,
                  baseScale: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Audio Track Settings */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              Nāda Harmonic Drone Inspector
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              {audioTrack.baseFreqHz} Hz Drone
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tuning Frequency</label>
              <select
                value={audioTrack.baseFreqHz}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdateAudioTrack((prev) => ({
                    ...prev,
                    baseFreqHz: val,
                    harmonicPreset:
                      val === 108
                        ? "om_108"
                        : val === 432
                        ? "anahata_432"
                        : val === 528
                        ? "solfeggio_528"
                        : "ajna_852",
                  }));
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="108">108 Hz (Om Cosmic Root)</option>
                <option value="432">432 Hz (Anāhata Heart / Natural)</option>
                <option value="528">528 Hz (Solfeggio Transformation)</option>
                <option value="852">852 Hz (Ajña Intuition / Higher)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Cycle Modulation</label>
              <button
                type="button"
                onClick={() =>
                  onUpdateAudioTrack((prev) => ({
                    ...prev,
                    octaveModulation: !prev.octaveModulation,
                  }))
                }
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors text-left flex items-center justify-between ${
                  audioTrack.octaveModulation
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                    : "bg-slate-900 border-slate-700 text-slate-400"
                }`}
              >
                <span>Harmonic Progression</span>
                <span className="text-[10px] font-mono">
                  {audioTrack.octaveModulation ? "ON" : "OFF"}
                </span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Audio Drone Volume</span>
              <span className="text-slate-300 font-mono">{(audioTrack.volume * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioTrack.volume}
              onChange={(e) =>
                onUpdateAudioTrack((prev) => ({
                  ...prev,
                  volume: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
