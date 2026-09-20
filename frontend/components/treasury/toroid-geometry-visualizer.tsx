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
  Radio,
  Music,
  Activity,
  Video,
  Layers,
  Clock,
  Gauge,
  Eye,
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

export default function ToroidGeometryVisualizer({
  onPresetSelect,
}: ToroidGeometryVisualizerProps) {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  // 1. Mathematical Geometry Parameters
  const [majorR, setMajorR] = useState<number>(130);
  const [minorR, setMinorR] = useState<number>(95);
  const [lineCount, setLineCount] = useState<number>(108);
  const [missMargin, setMissMargin] = useState<number>(7.5);
  const [tiltAngle, setTiltAngle] = useState<number>(35); // Default to 35° tilt matching user's artwork
  const [mode, setMode] = useState<"discrete_rings" | "continuous" | "chords">("discrete_rings");
  const [baseStrokeWidth, setBaseStrokeWidth] = useState<number>(1.0);
  const [baseOpacity, setBaseOpacity] = useState<number>(0.75);

  // 2. Harmonic Frequency & Coloration State
  const [palette, setPalette] = useState<HarmonicColorPalette>("solfeggio");
  const [waveMode, setWaveMode] = useState<WaveCirculationMode>("orbital_swirl");
  const [harmonicMultiplier, setHarmonicMultiplier] = useState<number>(3); // 3-fold harmonic overtone
  const [spaceInterference, setSpaceInterference] = useState<number>(0.45); // Luminescence in spaces between lines

  // 3. Timing, Loop Duration & Animation Speed
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [loopDurationSeconds, setLoopDurationSeconds] = useState<number>(8.0); // Exact loop period (e.g. 8s)
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [animProgress, setAnimProgress] = useState<number>(0); // 0.0 to 1.0 within loop period

  // 4. Video Recording & Export State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0); // 0% to 100%
  const [exportFormat, setExportFormat] = useState<"mp4" | "m4a" | "webm">("mp4");

  // 5. API Data & Utility State
  const [toroidData, setToroidData] = useState<ToroidGeometryResult | null>(null);
  const [presets, setPresets] = useState<ToroidPreset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savingPreset, setSavingPreset] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Solfeggio 9-Frequency Harmonic Spectrum (Hz -> Chromatic Hues)
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

  // Compute Chromatic Color for Line k at Normalized Loop Phase t
  const getLineStyle = useCallback(
    (k: number, total: number, phase: number) => {
      const frac = total > 0 ? k / total : 0;

      // Calculate Wave Modulation depending on circulation mode
      let waveFactor = 0;
      switch (waveMode) {
        case "orbital_swirl":
          // Traveling sinusoidal circulation around the ring
          waveFactor = Math.sin(2 * Math.PI * (frac * harmonicMultiplier - phase));
          break;
        case "singularity_ingestion":
          // Inward breathing pulse toward the event horizon
          waveFactor = Math.cos(2 * Math.PI * (frac * 2 + phase * harmonicMultiplier));
          break;
        case "standing_wave":
          // Chladni standing wave resonance with nodes and antinodes
          waveFactor =
            Math.sin(2 * Math.PI * frac * harmonicMultiplier) *
            Math.cos(2 * Math.PI * phase);
          break;
        case "doppler_vortex":
          // Accelerating wave phase shift
          waveFactor = Math.sin(2 * Math.PI * (Math.pow(frac, 1.5) * harmonicMultiplier - phase));
          break;
      }

      // Resolve Chromatic Hue from Musical Spectrum
      let hue = 0;
      let saturation = 85;
      let lightness = 55;

      switch (palette) {
        case "solfeggio": {
          // Continuous interpolation across the 9 Solfeggio frequency stations
          const solfIdx = (frac * solfeggioFrequencies.length + phase * 3) % solfeggioFrequencies.length;
          const i0 = Math.floor(solfIdx);
          const i1 = (i0 + 1) % solfeggioFrequencies.length;
          const mix = solfIdx - i0;
          hue = solfeggioFrequencies[i0].hue * (1 - mix) + solfeggioFrequencies[i1].hue * mix;
          saturation = 90;
          lightness = 50 + waveFactor * 18;
          break;
        }
        case "pythagorean": {
          // Pythagorean fifths spiral (3:2 frequency ratio)
          const pythSteps = (k * 7) % 12; // Cycle of fifths
          hue = (pythSteps / 12) * 360 + phase * 180;
          saturation = 80;
          lightness = 52 + waveFactor * 15;
          break;
        }
        case "synesthesia": {
          // Full 360° synesthesia rainbow circulation
          hue = (frac * 360 + phase * 360) % 360;
          saturation = 95;
          lightness = 55 + waveFactor * 15;
          break;
        }
        case "bioluminescent": {
          // Emerald to deep cyan oceanic frequency spectrum (150° to 220°)
          hue = 155 + ((frac + phase) % 1.0) * 65;
          saturation = 95;
          lightness = 58 + waveFactor * 20;
          break;
        }
        case "monochrome":
        default: {
          // Plain silver & platinum lines with luminescent frequency breathing
          hue = 215;
          saturation = 15;
          lightness = 65 + waveFactor * 25;
          break;
        }
      }

      const opacity = Math.max(
        0.15,
        Math.min(1.0, baseOpacity * (0.65 + waveFactor * 0.35))
      );
      const strokeW = Math.max(
        0.4,
        baseStrokeWidth * (0.75 + Math.abs(waveFactor) * 0.45)
      );

      return {
        color: `hsla(${Math.round(hue)}, ${saturation}%, ${Math.round(lightness)}%, ${opacity.toFixed(2)})`,
        width: strokeW,
        opacity,
      };
    },
    [palette, waveMode, harmonicMultiplier, baseOpacity, baseStrokeWidth, solfeggioFrequencies]
  );

  // Main High-Precision Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const loopDurationMs = (loopDurationSeconds / speedMultiplier) * 1000;

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const currentPhase = (elapsed % loopDurationMs) / loopDurationMs; // Exact [0.0, 1.0) loop phase
      setAnimProgress(currentPhase);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, loopDurationSeconds, speedMultiplier]);

  // Synchronized HTML5 Canvas Drawing for High-Performance Rendering & Video Capture
  const drawToCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, phase: number) => {
      if (!toroidData) return;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space Obsidian Background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, height);

      // Coordinate Transform to Center
      ctx.translate(width / 2, height / 2);
      const scaleFactor = Math.min(width, height) / 500;
      ctx.scale(scaleFactor, scaleFactor);

      // 2. Inter-Filament Caustic Resonance (Glow in the spaces between lines)
      if (spaceInterference > 0) {
        const causticGlow = ctx.createRadialGradient(
          0,
          0,
          toroidData.inner_hole_radius * 0.8,
          0,
          0,
          toroidData.outer_radius * 1.05
        );
        const interHue = (phase * 360) % 360;
        causticGlow.addColorStop(0, "rgba(0, 0, 0, 0.95)");
        causticGlow.addColorStop(
          0.35,
          palette === "monochrome"
            ? `rgba(226, 232, 240, ${spaceInterference * 0.12})`
            : `hsla(${interHue}, 90%, 55%, ${spaceInterference * 0.22})`
        );
        causticGlow.addColorStop(
          0.75,
          palette === "monochrome"
            ? `rgba(148, 163, 184, ${spaceInterference * 0.08})`
            : `hsla(${(interHue + 120) % 360}, 85%, 45%, ${spaceInterference * 0.15})`
        );
        causticGlow.addColorStop(1, "rgba(2, 6, 23, 0)");

        ctx.fillStyle = causticGlow;
        ctx.beginPath();
        ctx.arc(0, 0, toroidData.outer_radius * 1.15, 0, 2 * Math.PI);
        ctx.fill();
      }

      // 3. Render Circumscribed Loops with Frequency Coloration
      const loops = toroidData.loops || [];
      const totalLoops = loops.length > 0 ? loops.length : lineCount;

      if (loops.length > 0 && mode !== "continuous") {
        for (let i = 0; i < loops.length; i++) {
          const style = getLineStyle(i, totalLoops, phase);
          ctx.strokeStyle = style.color;
          ctx.lineWidth = style.width;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          const path = new Path2D(loops[i].svg_path);
          ctx.stroke(path);
        }
      } else if (toroidData.svg_path) {
        // Continuous mode
        const style = getLineStyle(0, totalLoops, phase);
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.width;
        const path = new Path2D(toroidData.svg_path);
        ctx.stroke(path);
      }

      // 4. Central Event Horizon Black Hole Void (Masks center with true black singularity)
      if (toroidData.inner_hole_radius > 5) {
        const blackHoleGrad = ctx.createRadialGradient(
          0,
          0,
          0,
          0,
          0,
          toroidData.inner_hole_radius
        );
        blackHoleGrad.addColorStop(0, "#000000");
        blackHoleGrad.addColorStop(0.75, "#000000");
        blackHoleGrad.addColorStop(0.92, "#020617");
        blackHoleGrad.addColorStop(1, "rgba(2, 6, 23, 0)");

        ctx.fillStyle = blackHoleGrad;
        ctx.beginPath();
        ctx.arc(0, 0, toroidData.inner_hole_radius, 0, 2 * Math.PI);
        ctx.fill();

        // Singularity Horizon Ring (Subtle perimeter)
        ctx.strokeStyle =
          palette === "monochrome"
            ? "rgba(203, 213, 225, 0.4)"
            : `hsla(${(phase * 360) % 360}, 80%, 65%, 0.5)`;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, toroidData.inner_hole_radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);

        // Central Bindu
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
    },
    [toroidData, lineCount, mode, spaceInterference, palette, getLineStyle]
  );

  // Sync canvas display on animation frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawToCanvas(ctx, canvas.width, canvas.height, animProgress);
  }, [animProgress, drawToCanvas]);

  // Video & M4A / MP4 Export Engine (Canvas Stream MediaRecorder)
  const handleExportAnimation = async () => {
    if (!toroidData || isRecording) return;

    // Check MediaRecorder browser support
    let mimeType = "video/mp4";
    if (typeof MediaRecorder === "undefined") {
      toastError("MediaRecorder API is not available in this environment.");
      return;
    }

    if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
      mimeType = "video/mp4;codecs=avc1";
    } else if (MediaRecorder.isTypeSupported("video/mp4")) {
      mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    }

    setIsRecording(true);
    setRecordProgress(0);
    toastInfo(`Recording high-definition seamless loop (${loopDurationSeconds}s)...`);

    // Create high-resolution dedicated offscreen recording canvas (1080x1080 60FPS)
    const recCanvas = document.createElement("canvas");
    recCanvas.width = 1080;
    recCanvas.height = 1080;
    const recCtx = recCanvas.getContext("2d");
    if (!recCtx) {
      setIsRecording(false);
      toastError("Failed to initialize recording context.");
      return;
    }

    const fps = 60;
    const stream = recCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 12000000, // 12 Mbps crystal clear lines
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    recorder.onstop = () => {
      const extension = exportFormat === "m4a" ? "m4a" : exportFormat === "mp4" ? "mp4" : "webm";
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `toroid-harmonic-${palette}-${loopDurationSeconds}s.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsRecording(false);
      setRecordProgress(100);
      toastSuccess(`Exported seamless ${extension.toUpperCase()} loop (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
    };

    recorder.start();

    // Render precise frames across the configured loop duration
    const totalFrames = Math.round(loopDurationSeconds * fps);
    let currentFrame = 0;

    const renderLoopFrame = () => {
      if (currentFrame >= totalFrames) {
        recorder.stop();
        return;
      }

      const framePhase = currentFrame / totalFrames; // Exact 0.0 to 1.0 progression
      drawToCanvas(recCtx, 1080, 1080, framePhase);
      currentFrame++;
      setRecordProgress(Math.round((currentFrame / totalFrames) * 100));

      // Schedule next frame
      setTimeout(renderLoopFrame, 1000 / fps);
    };

    renderLoopFrame();
  };

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
        "Name this Harmonic Toroidal Artwork Preset:",
        "Harmonic Resonance Torus"
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
          description: `${palette.toUpperCase()} palette, ${lineCount} lines, miss margin ${missMargin}°, tilt ${tiltAngle}°, duration ${loopDurationSeconds}s.`,
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
              <Music className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Toroidal Harmonics &amp; Multi-Colored Wave Circulation</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-normal">
                  Musical Noise Spectrum • {lineCount} Filaments
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dividing the musical frequency spectrum into a myriad matching the lines, circulating waves through the toroid and spaces between lines.
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

      {/* 2. Main Studio Grid: Interactive Screen + Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live Visualizer & Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/95 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {/* Top Status Bar */}
          <div className="w-full flex justify-between items-center mb-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}></span>
              <span className="text-slate-300">Phase: {(animProgress * 100).toFixed(1)}%</span>
              <span className="text-slate-500">• Loop: {loopDurationSeconds}s</span>
            </span>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Hole: <strong className="text-cyan-300">{toroidData?.inner_hole_radius?.toFixed(0) || Math.abs(majorR - minorR)}px</strong></span>
              <span>Filaments: <strong className="text-purple-300">{lineCount}</strong></span>
              <span className="text-amber-400">δ = {missMargin}°</span>
            </div>
          </div>

          {/* Canvas Rendering Port */}
          <div className="w-full aspect-square max-w-[480px] relative flex items-center justify-center p-2 rounded-2xl bg-black border border-slate-900 shadow-2xl overflow-hidden group">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="w-full h-full object-contain rounded-xl select-none"
            />

            {/* Recording Progress Overlay */}
            {isRecording && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin flex items-center justify-center">
                  <Video className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-semibold text-white font-mono">
                    Rendering Seamless {exportFormat.toUpperCase()} Loop
                  </div>
                  <div className="text-xs text-cyan-400 font-mono">
                    Recording 60 FPS • {recordProgress}% Complete
                  </div>
                </div>
                <div className="w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-100"
                    style={{ width: `${recordProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Playback & Loop Transport Bar */}
          <div className="w-full mt-4 pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Play/Pause & Speed */}
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
                <span>{isPlaying ? "Pause Loop" : "Play Loop"}</span>
              </button>

              {/* Speed Multiplier */}
              <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 px-2 py-1 space-x-1 text-slate-400 font-mono text-[11px]">
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span>{speedMultiplier.toFixed(1)}x</span>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                  className="w-14 accent-cyan-400 bg-slate-800 h-1 cursor-pointer"
                  title="Animation Circulation Speed"
                />
              </div>
            </div>

            {/* Loop Duration Selector Chips */}
            <div className="flex items-center space-x-1 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-slate-500 mr-1" />
              {[4, 8, 12, 16].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setLoopDurationSeconds(sec)}
                  className={`px-2 py-1 rounded border transition ${
                    loopDurationSeconds === sec
                      ? "bg-purple-950/80 text-purple-300 border-purple-500/50 font-semibold"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Video Export & Save Actions */}
            <div className="flex items-center space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-300 focus:outline-none"
              >
                <option value="mp4">MP4 (Video)</option>
                <option value="m4a">M4A (Video)</option>
                <option value="webm">WebM (VP9)</option>
              </select>

              <button
                onClick={handleExportAnimation}
                disabled={isRecording}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 transition flex items-center space-x-1.5 text-xs font-mono shadow-sm"
                title="Export high-definition video loop with no audio"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Export {exportFormat.toUpperCase()}</span>
              </button>

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
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition"
                title="Save Preset to Treasury Storehouse"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Coloration & Wave Formulation Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Palette & Circulation Wave Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h4 className="text-sm font-semibold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <span>Harmonic Color Spectrum</span>
              </span>
              <span className="text-xs font-mono text-amber-400">Musica Universalis</span>
            </h4>

            {/* 1. Color Palette Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">Frequency Spectrum Mode</label>
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
                Fills the diamond interference cells and spaces between lines with harmonic standing wave caustics.
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
                W(k, t) = sin(2π · (m · k/N - t/T_loop)) [Harmonic Standing Wave]
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-purple-400 text-[11px] font-semibold block">SOLFEGGIO MAPPING</span>
              <div className="text-slate-300 break-all text-[11px] font-mono">
                f_k = 174Hz → 963Hz (Akasha Crown) [Mapped across N lines]
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-emerald-400 text-[11px] font-semibold block">SEAMLESS LOOP EQUILIBRIUM</span>
              <div className="text-slate-300 break-all text-[11px] font-mono">
                Phase(t + T_loop) ≡ Phase(t) (mod 1.0) [Zero-Hitch Video Closure]
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
