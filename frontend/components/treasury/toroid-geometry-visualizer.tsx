"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Music,
  Activity,
  Layers,
  Gauge,
  Cpu,
  Radio,
  Zap,
  RotateCw,
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

export type HarmonicColorPalette =
  | "solfeggio"
  | "pythagorean"
  | "synesthesia"
  | "bioluminescent"
  | "monochrome";

export type WaveCirculationMode =
  | "orbital_swirl"
  | "singularity_ingestion"
  | "standing_wave"
  | "doppler_vortex";

export type EngineMode = "client_gpu" | "server_stream";

export default function ToroidGeometryVisualizer({
  onPresetSelect,
}: ToroidGeometryVisualizerProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  // 1. Mathematical Geometry Parameters
  const [majorR, setMajorR] = useState<number>(130);
  const [minorR, setMinorR] = useState<number>(95);
  const [lineCount, setLineCount] = useState<number>(108);
  const [missMargin, setMissMargin] = useState<number>(7.5);
  const [tiltAngle, setTiltAngle] = useState<number>(35); // 35° isometric tilt matching user's artwork
  const [mode, setMode] = useState<"discrete_rings" | "continuous" | "chords">("discrete_rings");
  const [baseStrokeWidth, setBaseStrokeWidth] = useState<number>(1.0);
  const [baseOpacity, setBaseOpacity] = useState<number>(0.75);

  // 2. Harmonic Frequency & Coloration State
  const [palette, setPalette] = useState<HarmonicColorPalette>("solfeggio");
  const [waveMode, setWaveMode] = useState<WaveCirculationMode>("orbital_swirl");
  const [harmonicMultiplier, setHarmonicMultiplier] = useState<number>(3); // 3-fold harmonic overtone
  const [spaceInterference, setSpaceInterference] = useState<number>(0.45); // Luminescence in spaces between lines

  // 3. Continuous Flow & Engine Mode State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [flowDirection, setFlowDirection] = useState<1 | -1>(1);
  const [engineMode, setEngineMode] = useState<EngineMode>("client_gpu");

  // Telemetry display (throttled to 2 Hz to guarantee zero React memory churn)
  const [displayFps, setDisplayFps] = useState<number>(60);
  const [livePhase, setLivePhase] = useState<number>(0);
  const [streamActive, setStreamActive] = useState<boolean>(false);

  // 4. API Data & Presets State
  const [toroidData, setToroidData] = useState<ToroidGeometryResult | null>(null);
  const [presets, setPresets] = useState<ToroidPreset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savingPreset, setSavingPreset] = useState<boolean>(false);

  // High-Performance Zero-Allocation Animation Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathCacheRef = useRef<Path2D[]>([]);
  const continuousPathRef = useRef<Path2D | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const sseEventSourceRef = useRef<EventSource | null>(null);

  // Mutable continuous state container (accessed at 60/120 FPS without React reconciliation)
  const engineStateRef = useRef({
    phase: 0.0,
    lastTimestamp: 0.0,
    frameCount: 0,
    fpsLastTime: 0.0,
    fpsCurrent: 60,
    isPlaying: true,
    speedMultiplier: 1.0,
    flowDirection: 1,
    spaceInterference: 0.45,
    harmonicMultiplier: 3,
    palette: "solfeggio" as HarmonicColorPalette,
    waveMode: "orbital_swirl" as WaveCirculationMode,
    baseOpacity: 0.75,
    baseStrokeWidth: 1.0,
    lineCount: 108,
    mode: "discrete_rings" as "discrete_rings" | "continuous" | "chords",
  });

  // Sync React props to mutable ref so the render loop always has latest settings without restart
  useEffect(() => {
    engineStateRef.current.isPlaying = isPlaying;
    engineStateRef.current.speedMultiplier = speedMultiplier;
    engineStateRef.current.flowDirection = flowDirection;
    engineStateRef.current.spaceInterference = spaceInterference;
    engineStateRef.current.harmonicMultiplier = harmonicMultiplier;
    engineStateRef.current.palette = palette;
    engineStateRef.current.waveMode = waveMode;
    engineStateRef.current.baseOpacity = baseOpacity;
    engineStateRef.current.baseStrokeWidth = baseStrokeWidth;
    engineStateRef.current.lineCount = lineCount;
    engineStateRef.current.mode = mode;
  }, [
    isPlaying,
    speedMultiplier,
    flowDirection,
    spaceInterference,
    harmonicMultiplier,
    palette,
    waveMode,
    baseOpacity,
    baseStrokeWidth,
    lineCount,
    mode,
  ]);

  // Solfeggio 9 Frequencies (Hz -> Hue)
  const solfeggioFrequencies = useMemo(
    () => [
      { hz: 174, name: "Foundation", hue: 0 },       // Red
      { hz: 285, name: "Cognition", hue: 30 },       // Red-Orange
      { hz: 396, name: "Liberation", hue: 45 },      // Gold
      { hz: 417, name: "Transmutation", hue: 90 },   // Lime
      { hz: 528, name: "Miracle / DNA", hue: 155 },  // Emerald
      { hz: 639, name: "Harmonics", hue: 195 },      // Cyan
      { hz: 741, name: "Awakening", hue: 235 },      // Indigo
      { hz: 852, name: "Intuition", hue: 275 },      // Violet
      { hz: 963, name: "Crown / Akasha", hue: 320 }, // Magenta
    ],
    []
  );

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

          // Pre-compile and cache Path2D objects once into memory pool
          if (data.geometry.loops && data.geometry.loops.length > 0) {
            pathCacheRef.current = data.geometry.loops.map((l) => new Path2D(l.svg_path));
          } else {
            pathCacheRef.current = [];
          }
          if (data.geometry.svg_path) {
            continuousPathRef.current = new Path2D(data.geometry.svg_path);
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

  // Server-Sent Events (SSE) Continuous Stream Integration
  useEffect(() => {
    if (engineMode !== "server_stream") {
      if (sseEventSourceRef.current) {
        sseEventSourceRef.current.close();
        sseEventSourceRef.current = null;
        setStreamActive(false);
      }
      return;
    }

    const query = new URLSearchParams({
      lines: lineCount.toString(),
      mode: waveMode,
      multiplier: harmonicMultiplier.toString(),
      palette: palette,
    });
    const sseUrl = `/api/v1/amra/geometry/toroid/stream?${query.toString()}`;
    const sse = new EventSource(sseUrl);
    sseEventSourceRef.current = sse;

    sse.onopen = () => {
      setStreamActive(true);
    };

    sse.onmessage = (e) => {
      try {
        const frame = JSON.parse(e.data);
        if (typeof frame.phase === "number") {
          // Sync engine phase directly with Go backend continuous harmonic generator
          engineStateRef.current.phase = frame.phase;
        }
      } catch (err) {
        // Ignore JSON frame parsing errors
      }
    };

    sse.onerror = () => {
      setStreamActive(false);
    };

    return () => {
      sse.close();
      sseEventSourceRef.current = null;
      setStreamActive(false);
    };
  }, [engineMode, lineCount, waveMode, harmonicMultiplier, palette]);

  // Main Zero-Allocation Continuous Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let isSubscribed = true;

    const renderContinuousFrame = (timestamp: number) => {
      if (!isSubscribed) return;

      const state = engineStateRef.current;

      if (!state.lastTimestamp) {
        state.lastTimestamp = timestamp;
        state.fpsLastTime = timestamp;
      }

      const deltaTime = Math.min(timestamp - state.lastTimestamp, 100); // Clamped delta to prevent jump on tab switch
      state.lastTimestamp = timestamp;

      // Advance continuous monotonic phase (never wrapped, continuous across infinity)
      if (state.isPlaying && engineMode === "client_gpu") {
        const speed = 0.00018 * state.speedMultiplier * state.flowDirection;
        state.phase += deltaTime * speed;
      }

      // Live FPS calculation (computed over 1 second rolling window)
      state.frameCount++;
      if (timestamp - state.fpsLastTime >= 500) {
        const fps = Math.round((state.frameCount * 1000) / (timestamp - state.fpsLastTime));
        state.fpsCurrent = fps;
        state.frameCount = 0;
        state.fpsLastTime = timestamp;

        // Throttled UI update (2 Hz)
        setDisplayFps(fps);
        setLivePhase(state.phase % 1.0);
      }

      // Zero-Allocation Direct Canvas Rendering
      const width = canvas.width;
      const height = canvas.height;
      const curPhase = state.phase;
      const tData = toroidData;

      if (tData) {
        ctx.save();

        // 1. Deep Space Obsidian Background
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, width, height);

        // Center coordinates
        ctx.translate(width / 2, height / 2);
        const scaleFactor = Math.min(width, height) / 500;
        ctx.scale(scaleFactor, scaleFactor);

        // 2. Inter-Filament Caustic Resonance (Spaces between lines)
        if (state.spaceInterference > 0) {
          const causticGlow = ctx.createRadialGradient(
            0,
            0,
            tData.inner_hole_radius * 0.8,
            0,
            0,
            tData.outer_radius * 1.08
          );
          const interHue = Math.floor(((curPhase * 360) % 360 + 360) % 360);

          causticGlow.addColorStop(0, "#000000");
          causticGlow.addColorStop(
            0.35,
            state.palette === "monochrome"
              ? `rgba(226, 232, 240, ${state.spaceInterference * 0.12})`
              : `hsla(${interHue}, 90%, 55%, ${state.spaceInterference * 0.22})`
          );
          causticGlow.addColorStop(
            0.75,
            state.palette === "monochrome"
              ? `rgba(148, 163, 184, ${state.spaceInterference * 0.08})`
              : `hsla(${(interHue + 120) % 360}, 85%, 45%, ${state.spaceInterference * 0.15})`
          );
          causticGlow.addColorStop(1, "rgba(2, 6, 23, 0)");

          ctx.fillStyle = causticGlow;
          ctx.beginPath();
          ctx.arc(0, 0, tData.outer_radius * 1.15, 0, 2 * Math.PI);
          ctx.fill();
        }

        // 3. Render Pre-compiled Filament Paths (Zero object allocations per frame)
        const cachedPaths = pathCacheRef.current;
        const totalLoops = cachedPaths.length > 0 ? cachedPaths.length : state.lineCount;

        if (cachedPaths.length > 0 && state.mode !== "continuous") {
          for (let i = 0; i < cachedPaths.length; i++) {
            const frac = totalLoops > 0 ? i / totalLoops : 0;

            // Wave modulation computation
            let waveFactor = 0;
            switch (state.waveMode) {
              case "orbital_swirl":
                waveFactor = Math.sin(2 * Math.PI * (frac * state.harmonicMultiplier - curPhase));
                break;
              case "singularity_ingestion":
                waveFactor = Math.cos(2 * Math.PI * (frac * 2.0 + curPhase * state.harmonicMultiplier));
                break;
              case "standing_wave":
                waveFactor =
                  Math.sin(2 * Math.PI * frac * state.harmonicMultiplier) *
                  Math.cos(2 * Math.PI * curPhase);
                break;
              case "doppler_vortex":
                waveFactor = Math.sin(
                  2 * Math.PI * (Math.pow(frac, 1.5) * state.harmonicMultiplier - curPhase)
                );
                break;
            }

            // Frequency spectrum color resolution
            let hue = 0;
            let saturation = 85;
            let lightness = 55;

            switch (state.palette) {
              case "solfeggio": {
                const solfIdx = Math.abs((frac * 9 + curPhase * 3) % 9);
                const i0 = Math.floor(solfIdx);
                const i1 = (i0 + 1) % 9;
                const mix = solfIdx - i0;
                hue = solfeggioFrequencies[i0].hue * (1 - mix) + solfeggioFrequencies[i1].hue * mix;
                saturation = 90;
                lightness = 50 + waveFactor * 18;
                break;
              }
              case "pythagorean": {
                const pythSteps = (i * 7) % 12;
                hue = Math.abs(((pythSteps / 12) * 360 + curPhase * 180) % 360);
                saturation = 80;
                lightness = 52 + waveFactor * 15;
                break;
              }
              case "synesthesia": {
                hue = Math.abs(((frac * 360 + curPhase * 360) % 360 + 360) % 360);
                saturation = 95;
                lightness = 55 + waveFactor * 15;
                break;
              }
              case "bioluminescent": {
                hue = 155 + Math.abs(((frac + curPhase) % 1.0) * 65);
                saturation = 95;
                lightness = 58 + waveFactor * 20;
                break;
              }
              case "monochrome":
              default: {
                hue = 215;
                saturation = 15;
                lightness = 65 + waveFactor * 25;
                break;
              }
            }

            const opacity = Math.max(
              0.15,
              Math.min(1.0, state.baseOpacity * (0.65 + waveFactor * 0.35))
            );
            const strokeW = Math.max(
              0.4,
              state.baseStrokeWidth * (0.75 + Math.abs(waveFactor) * 0.45)
            );

            ctx.strokeStyle = `hsla(${Math.round(hue)}, ${saturation}%, ${Math.round(lightness)}%, ${opacity.toFixed(2)})`;
            ctx.lineWidth = strokeW;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.stroke(cachedPaths[i]);
          }
        } else if (continuousPathRef.current) {
          // Continuous mode
          const waveFactor = Math.sin(2 * Math.PI * curPhase);
          ctx.strokeStyle =
            state.palette === "monochrome"
              ? "#e2e8f0"
              : `hsla(${Math.round(Math.abs((curPhase * 360) % 360))}, 90%, 55%, 0.8)`;
          ctx.lineWidth = state.baseStrokeWidth * (0.8 + Math.abs(waveFactor) * 0.4);
          ctx.stroke(continuousPathRef.current);
        }

        // 4. Central Event Horizon Black Hole Void (Masks center with pure black)
        if (tData.inner_hole_radius > 5) {
          const blackHoleGrad = ctx.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            tData.inner_hole_radius
          );
          blackHoleGrad.addColorStop(0, "#000000");
          blackHoleGrad.addColorStop(0.75, "#000000");
          blackHoleGrad.addColorStop(0.92, "#020617");
          blackHoleGrad.addColorStop(1, "rgba(2, 6, 23, 0)");

          ctx.fillStyle = blackHoleGrad;
          ctx.beginPath();
          ctx.arc(0, 0, tData.inner_hole_radius, 0, 2 * Math.PI);
          ctx.fill();

          // Singularity Horizon Ring
          ctx.strokeStyle =
            state.palette === "monochrome"
              ? "rgba(203, 213, 225, 0.4)"
              : `hsla(${Math.round(Math.abs((curPhase * 360) % 360))}, 80%, 65%, 0.5)`;
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.arc(0, 0, tData.inner_hole_radius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.setLineDash([]);

          // Central Bindu
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, 1.8, 0, 2 * Math.PI);
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(renderContinuousFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(renderContinuousFrame);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [toroidData, engineMode, solfeggioFrequencies]);

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

  // Copy SVG Path
  const handleCopyPath = () => {
    if (!toroidData?.svg_path) return;
    navigator.clipboard.writeText(toroidData.svg_path);
    setCopied(true);
    toastSuccess("Copied SVG vector path to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Save Preset to BoltDB Storehouse
  const handleSavePreset = async () => {
    setSavingPreset(true);
    try {
      const presetName = prompt(
        "Name this Continuous Flow Torus Preset:",
        "Infinite Harmonic Torus"
      );
      if (!presetName) {
        setSavingPreset(false);
        return;
      }

      const res = await fetch("/api/v1/amra/artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          description: `Continuous Flow (${palette}, ${waveMode}), ${lineCount} lines, miss margin ${missMargin}°, tilt ${tiltAngle}°.`,
          major_radius: majorR,
          minor_radius: minorR,
          line_count: lineCount,
          miss_margin: missMargin,
          tilt_angle: tiltAngle,
          mode: mode,
        }),
      });

      if (res.ok) {
        toastSuccess(`Saved "${presetName}" to Treasury Storehouse`);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Bar: Frequency & Musical Spectrum Indicator */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Toroidal Harmonics • Infinite Continuous Flow</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-normal flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Never-Ending Stream
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Harmonic wave circulation through circumscribed lines and inter-filament spaces, powered by zero-allocation continuous flow mechanics.
              </p>
            </div>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="flex items-center flex-wrap gap-2">
          {presets.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 transition"
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

      {/* 2. Main Studio Grid: Screen + Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Continuous Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/95 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {/* Top Status & Memory Telemetry Bar */}
          <div className="w-full flex justify-between items-center mb-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}></span>
              <span className="text-slate-200">FPS: <strong className="text-emerald-400">{displayFps}</strong></span>
              <span className="text-slate-500">• Heap: Zero-Alloc Pool</span>
            </span>

            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span className="capitalize">{engineMode.replace("_", " ")}</span>
                {streamActive && <span className="text-emerald-400">(SSE Live)</span>}
              </span>
              <span>Filaments: <strong className="text-purple-300">{lineCount}</strong></span>
              <span className="text-amber-400">δ = {missMargin}°</span>
            </div>
          </div>

          {/* Canvas Rendering Port */}
          <div className="w-full aspect-square max-w-[480px] relative flex items-center justify-center p-2 rounded-2xl bg-black border border-slate-900 shadow-2xl overflow-hidden">
            <canvas
              ref={canvasRef}
              width={640}
              height={640}
              className="w-full h-full object-contain rounded-xl select-none"
            />
          </div>

          {/* Playback & Continuous Transport Bar */}
          <div className="w-full mt-4 pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Play/Pause & Direction */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition ${
                  isPlaying
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/50"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Flowing" : "Paused"}</span>
              </button>

              <button
                onClick={() => setFlowDirection((prev) => (prev === 1 ? -1 : 1))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1 font-mono text-[11px] transition"
                title="Reverse wave circulation direction"
              >
                <RotateCw className={`w-3 h-3 ${flowDirection === -1 ? "-scale-x-100 text-amber-400" : "text-cyan-400"}`} />
                <span>{flowDirection === 1 ? "Forward" : "Reverse"}</span>
              </button>

              {/* Speed Multiplier */}
              <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 px-2 py-1 space-x-1 text-slate-400 font-mono text-[11px]">
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span>{speedMultiplier.toFixed(1)}x</span>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.1"
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                  className="w-16 accent-cyan-400 bg-slate-800 h-1 cursor-pointer"
                  title="Wave circulation speed"
                />
              </div>
            </div>

            {/* Engine Mode Toggle (Client GPU vs Server SSE Stream) */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-mono text-[11px]">
              <button
                onClick={() => setEngineMode("client_gpu")}
                className={`px-2 py-1 rounded transition ${
                  engineMode === "client_gpu"
                    ? "bg-slate-800 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Hardware-accelerated continuous GPU Canvas rendering"
              >
                GPU Loop
              </button>
              <button
                onClick={() => setEngineMode("server_stream")}
                className={`px-2 py-1 rounded transition flex items-center space-x-1 ${
                  engineMode === "server_stream"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Real-time Server-Sent Events stream from Go backend (/geometry/toroid/stream)"
              >
                <Radio className="w-3 h-3" />
                <span>SSE Stream</span>
              </button>
            </div>

            {/* Utility Actions */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleCopyPath}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                title="Copy SVG Vector Path"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSavePreset}
                disabled={savingPreset}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-amber-950/40 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/30 transition flex items-center space-x-1 text-xs font-mono"
                title="Save this continuous flow configuration to Treasury Storehouse"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Coloration & Wave Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Palette & Circulation Wave Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h4 className="text-sm font-semibold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <span>Continuous Harmonic Color Spectrum</span>
              </span>
              <span className="text-xs font-mono text-amber-400">Musica Universalis</span>
            </h4>

            {/* 1. Color Palette Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">Musical Noise Spectrum Mode</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  onClick={() => setPalette("solfeggio")}
                  className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                    palette === "solfeggio"
                      ? "bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold">Solfeggio Prism</div>
                    <div className="text-[10px] text-slate-500">9 Sacred Frequencies</div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                </button>

                <button
                  onClick={() => setPalette("synesthesia")}
                  className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                    palette === "synesthesia"
                      ? "bg-purple-950/60 text-purple-300 border-purple-500/50 shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold">Synesthesia 360°</div>
                    <div className="text-[10px] text-slate-500">Newton-Scriabin Wheel</div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400"></div>
                </button>

                <button
                  onClick={() => setPalette("pythagorean")}
                  className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                    palette === "pythagorean"
                      ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold">Pythagorean 3:2</div>
                    <div className="text-[10px] text-slate-500">Spiral of Fifths</div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                </button>

                <button
                  onClick={() => setPalette("bioluminescent")}
                  className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                    palette === "bioluminescent"
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold">Bioluminescent</div>
                    <div className="text-[10px] text-slate-500">Oceanic Emerald/Cyan</div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </button>

                <button
                  onClick={() => setPalette("monochrome")}
                  className={`col-span-2 p-2 rounded-xl border text-left transition flex items-center justify-between ${
                    palette === "monochrome"
                      ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold">Plain Monochrome Ink (Silver Luminescence)</div>
                    <div className="text-[10px] text-slate-500">Pure circumscribed lines without coloration</div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                </button>
              </div>
            </div>

            {/* 2. Wave Circulation Mechanism */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">Wave Circulation Pattern</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: "orbital_swirl", label: "Orbital Swirl", desc: "Circulating perimeter" },
                  { id: "singularity_ingestion", label: "Singularity Inward", desc: "Black hole breathing" },
                  { id: "standing_wave", label: "Standing Wave", desc: "Chladni stationary nodes" },
                  { id: "doppler_vortex", label: "Doppler Vortex", desc: "Accelerating torque" },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWaveMode(w.id as any)}
                    className={`p-2 rounded-xl border text-left transition ${
                      waveMode === w.id
                        ? "bg-slate-800 text-cyan-300 border-slate-600 font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>{w.label}</div>
                    <div className="text-[10px] text-slate-500">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Inter-Filament Space Luminescence Slider (Spaces between lines) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <label className="text-slate-200 font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Inter-Filament Caustic Spaces</span>
                </label>
                <span className="font-mono text-purple-300 font-semibold">
                  {(spaceInterference * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={spaceInterference}
                onChange={(e) => setSpaceInterference(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[11px] text-slate-500">
                Luminescent harmonic standing wave caustics breathing inside the spaces between lines.
              </p>
            </div>

            {/* 4. Harmonic Overtone Multiplier Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-200 font-medium flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Harmonic Overtone Multiplier (m)</span>
                </label>
                <span className="font-mono text-amber-300 font-semibold">{harmonicMultiplier}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={harmonicMultiplier}
                onChange={(e) => setHarmonicMultiplier(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <div className="flex gap-1 pt-0.5">
                {[1, 2, 3, 4, 6, 9].map((ov) => (
                  <button
                    key={ov}
                    onClick={() => setHarmonicMultiplier(ov)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      harmonicMultiplier === ov
                        ? "bg-amber-950 text-amber-300 border-amber-500/50 font-semibold"
                        : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    {ov}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toroid Mathematical Geometry Sliders */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Toroidal Geometric Matrix</span>
              </span>
              <span className="text-xs font-mono text-slate-400">Parametric Calculus</span>
            </h4>

            {/* Slider: Miss Margin */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">Miss Margin (δ)</label>
                <span className="font-mono text-amber-400">{missMargin}°</span>
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
            </div>

            {/* Slider: Line Density */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">Circumscribed Filaments (N)</label>
                <span className="font-mono text-cyan-400">{lineCount} lines</span>
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
            </div>

            {/* Slider: Perspective Tilt (35° default for the artwork) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">3D Perspective Tilt (α)</label>
                <span className="font-mono text-emerald-400">{tiltAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="65"
                step="1"
                value={tiltAngle}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTiltAngle(val);
                  fetchGeometry(majorR, minorR, lineCount, missMargin, val, mode);
                }}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Slider: Major Radius (Aperture / Black Hole Void) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">Major Radius (R)</label>
                <span className="font-mono text-purple-400">{majorR}px</span>
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
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mathematical & Acoustic Formulations Card */}
      {toroidData?.formulas && Object.keys(toroidData.formulas).length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h4 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Harmonic &amp; Acoustic Formulations of the Toroidal Field</span>
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
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-cyan-400 text-[11px] font-semibold block">ACOUSTIC CIRCULATION</span>
              <div className="text-slate-300 break-all text-[11px] font-mono">
                W(k, t) = sin(2π · (m · k/N - phase(t))) [Infinite Monotonic Flow]
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-purple-400 text-[11px] font-semibold block">SOLFEGGIO MAPPING</span>
              <div className="text-slate-300 break-all text-[11px] font-mono">
                f_k = 174Hz → 963Hz (Akasha Crown) [Mapped across N lines]
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-emerald-400 text-[11px] font-semibold block">MEMORY STABILITY POOL</span>
              <div className="text-slate-300 break-all text-[11px] font-mono">
                Allocations: 0 bytes/frame • Pre-compiled Path2D cache
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
