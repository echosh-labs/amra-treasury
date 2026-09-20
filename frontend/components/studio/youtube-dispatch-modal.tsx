"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Youtube,
  Film,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Sparkles,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface YouTubeDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: any;
}

export default function YouTubeDispatchModal({
  isOpen,
  onClose,
  manifest,
}: YouTubeDispatchModalProps) {
  const [title, setTitle] = useState<string>(
    "Āmra Anāhata Meditation | 432Hz Sacred Geometry Toroid"
  );
  const [description, setDescription] = useState<string>(
    "Sacred Geometry Toroidal visualization with Āmra Rūpa Mango focal mandala. Frequency calibrated to 432Hz harmonic heart resonance for deep yoga nidra and focused contemplation."
  );
  const [tags, setTags] = useState<string>(
    "sacred geometry, amra, meditation, 432hz, sound healing, toroid, mandala"
  );
  const [privacyStatus, setPrivacyStatus] = useState<"private" | "unlisted" | "public">(
    "unlisted"
  );

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("idle");
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [renderedFilePath, setRenderedFilePath] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll job status if active
  useEffect(() => {
    if (!activeJobId || jobStatus === "completed" || jobStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/studio/jobs/${activeJobId}`);
        if (!res.ok) return;
        const data = await res.json();
        const job = data.job || (data.jobs && data.jobs[0]) || data;
        setJobStatus(job.status);
        setJobProgress(job.progress_pct !== undefined ? job.progress_pct : (job.progress || 0));

        if (job.status === "completed") {
          setRenderedFilePath(job.output_path || job.outputPath);
        } else if (job.status === "failed") {
          setErrorMessage(job.error_message || job.error || "Render job encountered an error");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobId, jobStatus]);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setErrorMessage(null);
    setJobStatus("initiating");
    setJobProgress(0);

    try {
      const res = await fetch("/api/v1/studio/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate render");
      }

      const data = await res.json();
      setActiveJobId(data.jobId);
      setJobStatus("rendering");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start render");
      setJobStatus("failed");
    }
  };

  const handleFullDispatch = async () => {
    setErrorMessage(null);
    setJobStatus("initiating");
    setJobProgress(0);

    try {
      const res = await fetch("/api/v1/studio/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manifest,
          youtube: {
            title,
            description,
            tags: tags.split(",").map((t) => t.trim()),
            privacyStatus,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate dispatch pipeline");
      }

      const data = await res.json();
      setActiveJobId(data.jobId);
      setJobStatus("rendering");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start dispatch");
      setJobStatus("failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <Youtube className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Studio Export & YouTube Dispatch
              </h2>
              <p className="text-xs text-slate-400">
                Headless FFmpeg compilation and optional YouTube API publication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Ephemeral Guarantee Notice */}
          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-200">Zero-Commit Live Stream Guarantee</p>
              <p className="mt-0.5 text-slate-300">
                Live monitoring via the studio broadcast player is 100% ephemeral in memory. Video files are only created, and YouTube publications only triggered, when you explicitly execute an action below.
              </p>
            </div>
          </div>

          {/* Video Metadata Form */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Video Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  YouTube Privacy
                </label>
                <select
                  value={privacyStatus}
                  onChange={(e) => setPrivacyStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500/50"
                >
                  <option value="unlisted">Unlisted (Safe for Verification)</option>
                  <option value="private">Private (Only You)</option>
                  <option value="public">Public (Broadcast to World)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Progress Indicator */}
          {jobStatus !== "idle" && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <RefreshCw className={`w-3.5 h-3.5 ${jobStatus === "rendering" ? "animate-spin text-amber-400" : "text-slate-400"}`} />
                  Status: <span className="uppercase text-amber-400 font-mono">{jobStatus}</span>
                </span>
                <span className="font-mono text-slate-300">
                  {jobProgress.toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${jobProgress}%` }}
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300"
                />
              </div>

              {renderedFilePath && (
                <div className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Render output: {renderedFilePath}</span>
                </div>
              )}

              {errorMessage && (
                <div className="text-xs text-rose-400 flex items-center space-x-1.5 pt-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              disabled={jobStatus === "rendering" || jobStatus === "initiating"}
              onClick={handleStartRender}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
            >
              <Film className="w-4 h-4 text-amber-400" />
              <span>Render MP4 Only</span>
            </button>

            <button
              type="button"
              disabled={jobStatus === "rendering" || jobStatus === "initiating"}
              onClick={handleFullDispatch}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-xs font-semibold text-white shadow-lg shadow-red-900/30 transition-all disabled:opacity-50"
            >
              <Youtube className="w-4 h-4" />
              <span>Render & Dispatch to YouTube</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
