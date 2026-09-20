"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Radio,
  Monitor,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Eye,
  Activity,
  ExternalLink,
} from "lucide-react";

interface LiveBroadcastMonitorProps {
  manifestId?: string;
  totalDurationSec: number;
  baseCycleSec: number;
  repeatCount: number;
  backdropStyle: string;
  palette: string;
  primaryFreqHz: number;
}

export default function LiveBroadcastMonitor({
  manifestId,
  totalDurationSec,
  baseCycleSec,
  repeatCount,
  backdropStyle,
  palette,
  primaryFreqHz,
}: LiveBroadcastMonitorProps) {
  const [monitorMode, setMonitorMode] = useState<"interactive_player" | "live_stream_broadcast">("interactive_player");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [isFullBleed, setIsFullBleed] = useState<boolean>(false);

  // Layer toggles
  const [showBackground, setShowBackground] = useState<boolean>(true);
  const [showObjects, setShowObjects] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Interactive Canvas Player Render Loop
  useEffect(() => {
    if (monitorMode !== "interactive_player") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isSubscribed = true;

    const render = (timestamp: number) => {
      if (!isSubscribed) return;

      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const dt = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + dt * playbackSpeed;
          if (totalDurationSec > 0 && next >= totalDurationSec) {
            return 0; // Loop presentation
          }
          return next;
        });
      }

      // Drawing
      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;

      // 1. Atmosphere Background
      if (backdropStyle === "cosmic_aurora") {
        const bgGrad = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, Math.max(w, h) * 0.75);
        bgGrad.addColorStop(0, "#1f0f38");
        bgGrad.addColorStop(0.5, "#0d061c");
        bgGrad.addColorStop(1, "#020617");
        ctx.fillStyle = bgGrad;
      } else if (backdropStyle === "emerald_matrix") {
        const bgGrad = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, Math.max(w, h) * 0.75);
        bgGrad.addColorStop(0, "#063024");
        bgGrad.addColorStop(0.5, "#021610");
        bgGrad.addColorStop(1, "#020617");
        ctx.fillStyle = bgGrad;
      } else if (backdropStyle === "solar_corona") {
        const bgGrad = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, Math.max(w, h) * 0.75);
        bgGrad.addColorStop(0, "#381400");
        bgGrad.addColorStop(0.5, "#1c0700");
        bgGrad.addColorStop(1, "#020617");
        ctx.fillStyle = bgGrad;
      } else {
        ctx.fillStyle = "#020617";
      }
      ctx.fillRect(0, 0, w, h);

      // Cycle calculations
      const cycleIdx = Math.floor(currentTime / (baseCycleSec || 108));
      const cycleTime = currentTime % (baseCycleSec || 108);
      const hueShift = (cycleIdx * 15) % 360;
      const phase = (currentTime * 0.065) % 1.0;

      // 2. Toroidal Background Layer
      if (showBackground) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const radius = Math.min(w, h) * 0.38;
        const lineCount = 72;

        for (let i = 0; i < lineCount; i++) {
          const angle = (i / lineCount) * 2 * Math.PI + phase * 2 * Math.PI;
          const cx = Math.cos(angle) * (radius * 0.42);
          const cy = Math.sin(angle) * (radius * 0.28);
          const r = radius * 0.52;

          const hue = Math.abs((i * 8 + hueShift + phase * 360) % 360);
          ctx.strokeStyle = `hsla(${hue}, 88%, 58%, 0.65)`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // Event Horizon Void
        const voidGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.26);
        voidGrad.addColorStop(0, "#000000");
        voidGrad.addColorStop(0.85, "#000000");
        voidGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = voidGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.26, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
      }

      // 3. Sacred Object Layer (Āmra Fruit)
      if (showObjects) {
        ctx.save();
        ctx.translate(centerX, centerY);

        // Calculate opacity ramp along cycle
        let opacity = 0.95;
        if (cycleTime < 10) opacity = cycleTime / 10;
        if (cycleTime > baseCycleSec - 10) opacity = Math.max(0.1, (baseCycleSec - cycleTime) / 10);

        const pranaScale = 1.0 + Math.sin(currentTime * 1.8) * 0.045;
        const fruitR = Math.min(w, h) * 0.12 * pranaScale;

        // Fleshy Body
        const fruitGrad = ctx.createRadialGradient(-fruitR * 0.2, -fruitR * 0.2, 0, 0, 0, fruitR);
        fruitGrad.addColorStop(0, "#fef08a");
        fruitGrad.addColorStop(0.45, "#f59e0b");
        fruitGrad.addColorStop(0.85, "#b45309");
        fruitGrad.addColorStop(1, "#451a03");

        ctx.globalAlpha = opacity;
        ctx.fillStyle = fruitGrad;
        ctx.beginPath();
        ctx.arc(0, 0, fruitR, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Amara Bīja Seed Bindu
        const seedR = fruitR * 0.35;
        const seedGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, seedR);
        seedGrad.addColorStop(0, "#ffffff");
        seedGrad.addColorStop(0.5, "#fef3c7");
        seedGrad.addColorStop(1, "#d97706");
        ctx.fillStyle = seedGrad;
        ctx.beginPath();
        ctx.arc(0, 0, seedR, 0, 2 * Math.PI);
        ctx.fill();

        // Ripples
        const rippleR = seedR + ((currentTime * 20) % (fruitR * 0.7));
        ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, rippleR, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.restore();
      }

      // 4. Subtle Guide Grid
      if (showGrid) {
        ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [
    monitorMode,
    isPlaying,
    playbackSpeed,
    totalDurationSec,
    baseCycleSec,
    backdropStyle,
    showBackground,
    showObjects,
    showGrid,
  ]);

  const liveStreamUrl = `/api/v1/studio/stream?format=mjpeg&fps=30${manifestId ? `&manifest_id=${manifestId}` : ""}`;

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* 1. Top Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMonitorMode("interactive_player")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                monitorMode === "interactive_player"
                  ? "bg-purple-950 text-purple-300 border border-purple-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-purple-400" />
              <span>Interactive Player</span>
            </button>

            <button
              onClick={() => setMonitorMode("live_stream_broadcast")}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                monitorMode === "live_stream_broadcast"
                  ? "bg-red-950 text-red-300 border border-red-500/40 font-semibold animate-pulse"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>Live Test Stream (No YouTube)</span>
            </button>
          </div>
        </div>

        {/* Telemetry & Badges */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-200">{primaryFreqHz.toFixed(1)} Hz Bed</span>
          </span>
          <span>Cycle: <strong className="text-amber-300">{Math.floor(currentTime / (baseCycleSec || 108)) + 1}</strong> / {repeatCount}</span>
          <span className="text-purple-300">{formatTime(currentTime)} / {formatTime(totalDurationSec)}</span>
        </div>
      </div>

      {/* 2. Visual Viewport Area */}
      <div
        className={`w-full aspect-video relative flex items-center justify-center rounded-2xl bg-black border border-slate-900 overflow-hidden shadow-2xl transition-all ${
          isFullBleed ? "fixed inset-0 z-50 rounded-none border-none aspect-auto w-screen h-screen" : ""
        }`}
      >
        {monitorMode === "interactive_player" ? (
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-full object-contain select-none"
          />
        ) : (
          <div className="w-full h-full relative flex flex-col items-center justify-center bg-slate-950">
            {/* Live MJPEG Stream Direct Image Component */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={liveStreamUrl}
              alt="Live Broadcast Ephemeral Stream"
              className="w-full h-full object-contain select-none"
            />
            {/* Stream Watermark & Status Pill */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-red-400 font-bold">LIVE EPHEMERAL BROADCAST</span>
              <span className="text-slate-500">• Port 8050 MJPEG</span>
            </div>
          </div>
        )}

        {/* Full-bleed exit button */}
        {isFullBleed && (
          <button
            onClick={() => setIsFullBleed(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-white"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 3. Transport & Layer Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-mono">
        {/* Playback & Scrub Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition ${
              isPlaying
                ? "bg-purple-950/60 text-purple-300 border-purple-700/50"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Playing" : "Paused"}</span>
          </button>

          <button
            onClick={() => setCurrentTime(0)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Reset to Timeline Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Timeline Scrubber */}
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={totalDurationSec || 108}
              step="0.5"
              value={currentTime}
              onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
              className="w-32 sm:w-48 accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <span className="text-slate-500 text-[11px]">{formatTime(totalDurationSec)}</span>
          </div>
        </div>

        {/* Layer Visibility & Fullscreen */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setShowBackground(!showBackground)}
              className={`px-2 py-0.5 rounded transition ${
                showBackground ? "text-cyan-300 font-semibold" : "text-slate-500"
              }`}
              title="Toggle Toroid Background"
            >
              Background
            </button>
            <button
              onClick={() => setShowObjects(!showObjects)}
              className={`px-2 py-0.5 rounded transition ${
                showObjects ? "text-amber-300 font-semibold" : "text-slate-500"
              }`}
              title="Toggle Sacred Objects"
            >
              Objects
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-0.5 rounded transition ${
                showGrid ? "text-purple-300 font-semibold" : "text-slate-500"
              }`}
              title="Toggle Alignment Grid"
            >
              Grid
            </button>
          </div>

          <button
            onClick={() => setIsFullBleed(!isFullBleed)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Fullscreen Monitor"
          >
            {isFullBleed ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
