"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, ShieldCheck, Download, Code, Layers, ExternalLink } from "lucide-react";
import { AmraGeometryData } from "@/lib/types/treasury";
import MangoGeometryVisualizer from "@/components/treasury/mango-geometry-visualizer";

export default function SacredObjectsPage() {
  const [geoBelly, setGeoBelly] = useState(125);
  const [geoHook, setGeoHook] = useState(35);
  const [geoShadow, setGeoShadow] = useState(0.40);
  const [geoHeat, setGeoHeat] = useState(0.80);
  const [geoData, setGeoData] = useState<AmraGeometryData | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const loadGeometry = useCallback(
    async (belly = geoBelly, hook = geoHook, shadow = geoShadow, heat = geoHeat) => {
      setLoadingGeo(true);
      try {
        const res = await fetch(
          `/api/v1/amra/geometry?belly=${belly}&hook=${hook}&shadow=${shadow}&heat=${heat}`
        );
        if (res.ok) {
          const data = await res.json();
          setGeoData(data);
        }
      } catch (err) {
        console.error("Failed to load geometry:", err);
      } finally {
        setLoadingGeo(false);
      }
    },
    [geoBelly, geoHook, geoShadow, geoHeat]
  );

  useEffect(() => {
    loadGeometry();
  }, [loadGeometry]);

  const handlePreset = (belly: number, hook: number, shadow: number, heat: number) => {
    setGeoBelly(belly);
    setGeoHook(hook);
    setGeoShadow(shadow);
    setGeoHeat(heat);
    loadGeometry(belly, hook, shadow, heat);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 p-6 rounded-2xl border border-amber-500/30 shadow-2xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Sparkles className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight font-serif">
                Sacred Graphical Objects
              </h1>
            </div>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>PORT 8050 ATELIER</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
            Specific graphical objects depicted entirely using mathematical code and specialized color animations. Featuring the Vedic Āmra Rūpa (Mango Fruit), 5 Pūrṇa Kumbha leaves, indestructible Amara Bīja seed, and dynamic prānic breathing expressions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center space-x-1.5">
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Parametric Kairi Calculus</span>
          </div>
          <a
            href="/api/v1/amra/geometry"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 hover:bg-amber-900/60 transition flex items-center space-x-1"
          >
            <span>Geometry API</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Standalone Sacred Graphical Objects Visualizer */}
      <MangoGeometryVisualizer
        geoBelly={geoBelly}
        geoHook={geoHook}
        geoShadow={geoShadow}
        geoHeat={geoHeat}
        geoData={geoData}
        loadingGeo={loadingGeo}
        onBellyChange={(v) => {
          setGeoBelly(v);
          loadGeometry(v, geoHook, geoShadow, geoHeat);
        }}
        onHookChange={(v) => {
          setGeoHook(v);
          loadGeometry(geoBelly, v, geoShadow, geoHeat);
        }}
        onShadowChange={(v) => {
          setGeoShadow(v);
          loadGeometry(geoBelly, geoHook, v, geoHeat);
        }}
        onHeatChange={(v) => {
          setGeoHeat(v);
          loadGeometry(geoBelly, geoHook, geoShadow, v);
        }}
        onPreset={handlePreset}
        onReload={() => loadGeometry()}
      />
    </div>
  );
}
