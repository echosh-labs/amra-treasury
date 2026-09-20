"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Film,
  Sparkles,
  Play,
  RotateCw,
  Radio,
  Layers,
  Youtube,
  ShieldCheck,
  Zap,
  Sliders,
  Tv,
  CheckCircle,
} from "lucide-react";
import LiveBroadcastMonitor from "@/components/studio/live-broadcast-monitor";
import PatternLoopControls from "@/components/studio/pattern-loop-controls";
import StudioTimelineSequencer, {
  ObjectTrackState,
  AudioTrackState,
} from "@/components/studio/studio-timeline-sequencer";
import YouTubeDispatchModal from "@/components/studio/youtube-dispatch-modal";

export default function StudioPage() {
  // Timeline and Pattern Loop State
  const [baseCycleSec, setBaseCycleSec] = useState<number>(108);
  const [repeatCount, setRepeatCount] = useState<number>(10);
  const [hueShiftDegPerCycle, setHueShiftDegPerCycle] = useState<number>(15);
  const [pranaHeatIncrement, setPranaHeatIncrement] = useState<number>(0.05);
  const [octaveModulation, setOctaveModulation] = useState<boolean>(true);

  // Geometry Backdrop State
  const [backdropStyle, setBackdropStyle] = useState<string>("torus_flower_of_life");
  const [palette, setPalette] = useState<string>("amra_multivariate");
  const [availablePresets, setAvailablePresets] = useState<any[]>([
    { id: "torus_flower_of_life", name: "Flower Torus" },
    { id: "singularity_vortex", name: "Singularity Vortex" },
    { id: "metatron_cube", name: "Metatron Cube" },
  ]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch("/api/v1/amra/artwork");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.catalog) && data.catalog.length > 0) {
            setAvailablePresets(data.catalog);
          }
        }
      } catch (err) {
        console.warn("Could not fetch dynamic artwork presets:", err);
      }
    };
    fetchCatalog();
  }, []);

  // Track States
  const [objectTrack, setObjectTrack] = useState<ObjectTrackState>({
    id: "obj-amra-mango",
    name: "Āmra Rūpa Mango",
    objectType: "amra_mango",
    enabled: true,
    animationMode: "pulsing_prana",
    baseScale: 1.0,
    rotationSpeedRpm: 2.0,
    glowIntensity: 0.8,
  });

  const [audioTrack, setAudioTrack] = useState<AudioTrackState>({
    enabled: true,
    baseFreqHz: 432,
    harmonicPreset: "anahata_432",
    volume: 0.75,
    octaveModulation: true,
  });

  // Current playhead scrubber
  const [currentTime, setCurrentTime] = useState<number>(0);

  // YouTube Dispatch Modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);

  const totalDurationSec = baseCycleSec * repeatCount;

  // Build manifest
  const manifest = useMemo(() => {
    return {
      id: "manifest-studio-interactive",
      title: "Āmra Anāhata Long-Form Meditation",
      canvas: {
        width: 1920,
        height: 1080,
        fps: 30,
      },
      patternLoop: {
        baseCycleSeconds: baseCycleSec,
        repeatCount: repeatCount,
        cycleHueRotationDeg: hueShiftDegPerCycle,
        harmonicOctaveProgression: octaveModulation,
        pranaHeatIncrement: pranaHeatIncrement,
      },
      backgroundTrack: {
        geometryStyle: backdropStyle,
        palette: palette,
        rotationRateRpm: 1.5,
        layerCount: 8,
        zoomOscillation: true,
      },
      objectTracks: objectTrack.enabled
        ? [
            {
              id: objectTrack.id,
              objectType: objectTrack.objectType,
              name: objectTrack.name,
              anchorX: 0.5,
              anchorY: 0.5,
              baseScale: objectTrack.baseScale,
              glowColor: "#f59e0b",
              glowRadius: 32,
              animationMode: objectTrack.animationMode,
              keyframes: [
                {
                  timeSec: 0,
                  opacity: 0.3,
                  scale: objectTrack.baseScale * 0.9,
                  rotationDeg: 0,
                },
                {
                  timeSec: baseCycleSec / 2,
                  opacity: 1.0,
                  scale: objectTrack.baseScale * 1.1,
                  rotationDeg: 180,
                },
                {
                  timeSec: baseCycleSec,
                  opacity: 0.3,
                  scale: objectTrack.baseScale * 0.9,
                  rotationDeg: 360,
                },
              ],
            },
          ]
        : [],
      audioTrack: audioTrack.enabled
        ? {
            enabled: true,
            baseFrequencyHz: audioTrack.baseFreqHz,
            harmonicPreset: audioTrack.harmonicPreset,
            binauralBeatHz: 4.5,
            octaveModulation: audioTrack.octaveModulation,
            volume: audioTrack.volume,
          }
        : null,
    };
  }, [
    baseCycleSec,
    repeatCount,
    hueShiftDegPerCycle,
    octaveModulation,
    pranaHeatIncrement,
    backdropStyle,
    palette,
    objectTrack,
    audioTrack,
  ]);

  // Sync manifest with backend store for live streaming engine
  useEffect(() => {
    const syncManifest = async () => {
      try {
        await fetch("/api/v1/studio/manifests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manifest),
        });
      } catch (err) {
        console.warn("Studio manifest background sync error:", err);
      }
    };
    syncManifest();
  }, [manifest]);

  const handleApplyDurationPreset = useCallback(
    (cycleSec: number, repeats: number) => {
      setBaseCycleSec(cycleSec);
      setRepeatCount(repeats);
      setCurrentTime(0);
    },
    []
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Studio Header & Ephemeral Live Stream Verification Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40 p-6 rounded-2xl border border-amber-500/30 shadow-2xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
                <Film className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight font-serif">
                Creative Studio
              </h1>
            </div>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>LONG-FORM VIDEO SUITE</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
            Programmable pattern-loop timeline engine for extended sacred geometry meditations (10m to 1+ hour). Seamlessly blends continuous toroidal spacetime backgrounds with smart Āmra Rūpa objects, harmonic Nāda drones, and real-time zero-commit ephemeral live streaming.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDispatchModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-red-900/30 transition-all cursor-pointer"
          >
            <Youtube className="w-4 h-4" />
            <span>Export &amp; YouTube Dispatch</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Broadcast & Player Monitor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <LiveBroadcastMonitor
            manifestId="manifest-studio-interactive"
            totalDurationSec={totalDurationSec}
            baseCycleSec={baseCycleSec}
            repeatCount={repeatCount}
            backdropStyle={backdropStyle}
            palette={palette}
            primaryFreqHz={audioTrack.baseFreqHz}
          />
        </div>

        {/* Right: Pattern-Loop & Temporal Modulation Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <PatternLoopControls
            baseCycleSec={baseCycleSec}
            repeatCount={repeatCount}
            octaveModulation={octaveModulation}
            hueShiftDegPerCycle={hueShiftDegPerCycle}
            pranaHeatIncrement={pranaHeatIncrement}
            onBaseCycleChange={setBaseCycleSec}
            onRepeatCountChange={setRepeatCount}
            onOctaveToggle={setOctaveModulation}
            onHueShiftChange={setHueShiftDegPerCycle}
            onHeatIncrementChange={setPranaHeatIncrement}
            onApplyDurationPreset={handleApplyDurationPreset}
          />

          {/* Quick Backdrop Style Switcher */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Geometry Style Preset
              </span>
              <span className="text-[10px] font-mono text-purple-400 uppercase">
                {backdropStyle.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {availablePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setBackdropStyle(preset.id)}
                  className={`p-2 rounded-xl border text-center transition-all truncate ${
                    backdropStyle === preset.id
                      ? "bg-purple-500/20 border-purple-500 text-purple-200 font-semibold shadow-inner"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                  title={preset.name}
                >
                  {preset.name.split(" ")[0]} {preset.name.split(" ")[1] || ""}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Multi-Track Timeline Sequencer */}
      <div>
        <StudioTimelineSequencer
          totalDurationSec={totalDurationSec}
          baseCycleSec={baseCycleSec}
          repeatCount={repeatCount}
          currentTime={currentTime}
          onSeek={setCurrentTime}
          backdropStyle={backdropStyle}
          palette={palette}
          objectTrack={objectTrack}
          onUpdateObjectTrack={setObjectTrack}
          audioTrack={audioTrack}
          onUpdateAudioTrack={setAudioTrack}
        />
      </div>

      {/* YouTube Dispatch & Headless Render Modal */}
      <YouTubeDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        manifest={manifest}
      />
    </div>
  );
}
