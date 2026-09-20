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
  Palette,
  Pipette,
  Plus,
  Trash2,
  SlidersHorizontal,
  Wand2,
  Eye,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
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

export type BackdropStyle = "obsidian" | "cosmic_aurora" | "emerald_matrix" | "solar_corona";

export type HarmonicColorPalette =
  | "multivariate_facets"
  | "solfeggio"
  | "pythagorean"
  | "synesthesia"
  | "bioluminescent"
  | "monochrome"
  | "chakra"
  | "alchemical"
  | "golden_angle"
  | "iridescent"
  | "dual_zone"
  | "solid_tint"
  | "custom_spectrum";

export type FacetDistributionMode =
  | "interlaced_weave"
  | "radial_octaves"
  | "interference_blend";

export interface MultivariateFacet {
  id: string;
  name: string;
  category: "chakra" | "alchemical" | "singularity" | "neon";
  coreHex: string;         // Primary base hue
  accentHex: string;       // Harmonic overtone / tint
  causticHex: string;      // Inter-filament caustic glow
  frequencyHz: number;     // Harmonic acoustic station (Hz)
  modulationPhase: number; // Phase offset factor (0.0 to 1.0)
  meaning: string;
}

export const CHAKRA_FACETS: MultivariateFacet[] = [
  { id: "chakra_muladhara", name: "Mūlādhāra", category: "chakra", coreHex: "#E11D48", accentHex: "#FB7185", causticHex: "#9F1239", frequencyHz: 174, modulationPhase: 0.0, meaning: "Root / Grounding Ruby" },
  { id: "chakra_svadhisthana", name: "Svādhiṣṭhāna", category: "chakra", coreHex: "#EA580C", accentHex: "#FB923C", causticHex: "#C2410C", frequencyHz: 285, modulationPhase: 0.14, meaning: "Sacral / Pranic Fire" },
  { id: "chakra_manipura", name: "Maṇipūra", category: "chakra", coreHex: "#EAB308", accentHex: "#FDE047", causticHex: "#CA8A04", frequencyHz: 396, modulationPhase: 0.28, meaning: "Solar Plexus / Will Aurum" },
  { id: "chakra_anahata", name: "Anāhata", category: "chakra", coreHex: "#10B981", accentHex: "#34D399", causticHex: "#047857", frequencyHz: 528, modulationPhase: 0.42, meaning: "Heart / Cosmic Miracle" },
  { id: "chakra_vishuddha", name: "Viśuddha", category: "chakra", coreHex: "#06B6D4", accentHex: "#38BDF8", causticHex: "#0891B2", frequencyHz: 639, modulationPhase: 0.57, meaning: "Throat / Sacred Akasha" },
  { id: "chakra_ajna", name: "Ājñā", category: "chakra", coreHex: "#6366F1", accentHex: "#818CF8", causticHex: "#4338CA", frequencyHz: 741, modulationPhase: 0.71, meaning: "Third Eye / Intuitive Indigo" },
  { id: "chakra_sahasrara", name: "Sahasrāra", category: "chakra", coreHex: "#A855F7", accentHex: "#C084FC", causticHex: "#7E22CE", frequencyHz: 963, modulationPhase: 0.85, meaning: "Crown / Transcendent Void" },
];

export const ALCHEMICAL_FACETS: MultivariateFacet[] = [
  { id: "alc_aurum", name: "Aurum", category: "alchemical", coreHex: "#F59E0B", accentHex: "#FEF08A", causticHex: "#D97706", frequencyHz: 432, modulationPhase: 0.0, meaning: "Philosopher's Gold" },
  { id: "alc_argentum", name: "Argentum", category: "alchemical", coreHex: "#E2E8F0", accentHex: "#FFFFFF", causticHex: "#94A3B8", frequencyHz: 586, modulationPhase: 0.16, meaning: "Lunar Reflective Silver" },
  { id: "alc_cuprum", name: "Cuprum", category: "alchemical", coreHex: "#B45309", accentHex: "#FDBA74", causticHex: "#92400E", frequencyHz: 324, modulationPhase: 0.33, meaning: "Venusian Resonant Copper" },
  { id: "alc_ferrum", name: "Ferrum", category: "alchemical", coreHex: "#475569", accentHex: "#94A3B8", causticHex: "#1E293B", frequencyHz: 216, modulationPhase: 0.50, meaning: "Martian Telluric Iron" },
  { id: "alc_hydrargyrum", name: "Hydrargyrum", category: "alchemical", coreHex: "#38BDF8", accentHex: "#7DD3FC", causticHex: "#0284C7", frequencyHz: 648, modulationPhase: 0.66, meaning: "Hermetic Fluid Quicksilver" },
  { id: "alc_aetherium", name: "Aetherium", category: "alchemical", coreHex: "#C084FC", accentHex: "#E9D5FF", causticHex: "#9333EA", frequencyHz: 864, modulationPhase: 0.83, meaning: "Quintessence Aether Void" },
];

export const SINGULARITY_FACETS: MultivariateFacet[] = [
  { id: "sing_void", name: "Singularity Void", category: "singularity", coreHex: "#020617", accentHex: "#1E293B", causticHex: "#0F172A", frequencyHz: 108, modulationPhase: 0.0, meaning: "Black Hole Event Singularity" },
  { id: "sing_horizon", name: "Event Horizon", category: "singularity", coreHex: "#FBBF24", accentHex: "#FEF3C7", causticHex: "#B45309", frequencyHz: 480, modulationPhase: 0.16, meaning: "Photon Sphere Amber" },
  { id: "sing_accretion", name: "Accretion Disk", category: "singularity", coreHex: "#DC2626", accentHex: "#F87171", causticHex: "#991B1B", frequencyHz: 256, modulationPhase: 0.33, meaning: "Relativistic Doppler Red" },
  { id: "sing_jet", name: "Relativistic Jet", category: "singularity", coreHex: "#2563EB", accentHex: "#60A5FA", causticHex: "#1D4ED8", frequencyHz: 720, modulationPhase: 0.50, meaning: "Synchrotron Relativistic Jet" },
  { id: "sing_hawking", name: "Hawking Glow", category: "singularity", coreHex: "#22D3EE", accentHex: "#A5F3FC", causticHex: "#0E7490", frequencyHz: 888, modulationPhase: 0.66, meaning: "Quantum Evaporation Glow" },
  { id: "sing_supernova", name: "Supernova Peak", category: "singularity", coreHex: "#FFFFFF", accentHex: "#F1F5F9", causticHex: "#CBD5E1", frequencyHz: 999, modulationPhase: 0.83, meaning: "Zero-Point Cosmic Flash" },
];

export const NEON_FACETS: MultivariateFacet[] = [
  { id: "neon_rose", name: "Laser Rose", category: "neon", coreHex: "#F43F5E", accentHex: "#FDA4AF", causticHex: "#BE123C", frequencyHz: 520, modulationPhase: 0.0, meaning: "520nm Coherent Neon Rose" },
  { id: "neon_sunburst", name: "Solar Flare", category: "neon", coreHex: "#FB923C", accentHex: "#FED7AA", causticHex: "#EA580C", frequencyHz: 360, modulationPhase: 0.16, meaning: "Chromospheric Solar Flare" },
  { id: "neon_lime", name: "Acid Lime", category: "neon", coreHex: "#84CC16", accentHex: "#BEF264", causticHex: "#65A30D", frequencyHz: 440, modulationPhase: 0.33, meaning: "Bioluminescent Spore Ray" },
  { id: "neon_emerald", name: "Emerald Ray", category: "neon", coreHex: "#10B981", accentHex: "#6EE7B7", causticHex: "#047857", frequencyHz: 528, modulationPhase: 0.50, meaning: "Laser Harmonic Coherence" },
  { id: "neon_teal", name: "Cyber Teal", category: "neon", coreHex: "#06B6D4", accentHex: "#67E8F9", causticHex: "#0E7490", frequencyHz: 672, modulationPhase: 0.66, meaning: "High-Frequency Cyber Plasma" },
  { id: "neon_violet", name: "Hyper Violet", category: "neon", coreHex: "#8B5CF6", accentHex: "#C4B5FD", causticHex: "#6D28D9", frequencyHz: 816, modulationPhase: 0.83, meaning: "Deep Ultraviolet Resonance" },
];

export const ALL_FACETS: MultivariateFacet[] = [
  ...CHAKRA_FACETS,
  ...ALCHEMICAL_FACETS,
  ...SINGULARITY_FACETS,
  ...NEON_FACETS,
];

export const GRADIENT_PRESETS = [
  { name: "Solar Flare", stops: ["#DC2626", "#F97316", "#FACC15"] },
  { name: "Oceanic Abyss", stops: ["#0284C7", "#06B6D4", "#10B981"] },
  { name: "Cosmic Lotus", stops: ["#7C3AED", "#EC4899", "#38BDF8"] },
  { name: "Aurum Singularity", stops: ["#020617", "#D97706", "#FEF08A"] },
  { name: "Bioluminescent Forest", stops: ["#064E3B", "#10B981", "#6EE7B7"] },
  { name: "Akasha Crown", stops: ["#312E81", "#6366F1", "#C084FC", "#F43F5E"] },
];

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToRgb(hex: string): RGB {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) return { r: 148, g: 163, b: 184 };
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 148, g: 163, b: 184 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export interface CompiledFacet {
  id: string;
  name: string;
  coreRgb: RGB;
  accentRgb: RGB;
  causticRgb: RGB;
  coreHsl: HSL;
  accentHsl: HSL;
  frequencyHz: number;
  modulationPhase: number;
}

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
  const [palette, setPalette] = useState<HarmonicColorPalette>("multivariate_facets");
  const [waveMode, setWaveMode] = useState<WaveCirculationMode>("orbital_swirl");
  const [harmonicMultiplier, setHarmonicMultiplier] = useState<number>(3); // 3-fold harmonic overtone
  const [spaceInterference, setSpaceInterference] = useState<number>(0.45); // Luminescence in spaces between lines

  // Enhanced Color Selection Grid State & Multi-Facet Activation
  const [selectedHex, setSelectedHex] = useState<string>("#38BDF8");
  const [secondaryHex, setSecondaryHex] = useState<string>("#F59E0B");
  const [activeFacetIds, setActiveFacetIds] = useState<string[]>([
    "chakra_muladhara",
    "chakra_anahata",
    "chakra_sahasrara",
  ]);
  const [facetDistribution, setFacetDistribution] =
    useState<FacetDistributionMode>("interlaced_weave");
  const [customSpectrumStops, setCustomSpectrumStops] = useState<string[]>([
    "#E11D48",
    "#F59E0B",
    "#06B6D4",
    "#A855F7",
  ]);
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [colorModeTab, setColorModeTab] = useState<
    "standard_swatches" | "precision_picker" | "spectrum_builder" | "advanced_modes"
  >("standard_swatches");
  const [swatchCategory, setSwatchCategory] = useState<
    "all" | "chakra" | "alchemical" | "singularity" | "neon"
  >("all");
  const [hslSliders, setHslSliders] = useState<HSL>({ h: 199, s: 95, l: 60 });

  // 3. Continuous Flow & Engine Mode State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [flowDirection, setFlowDirection] = useState<1 | -1>(1);
  const [engineMode, setEngineMode] = useState<EngineMode>("client_gpu");
  const [backdropStyle, setBackdropStyle] = useState<BackdropStyle>("obsidian");
  const [fullBleed, setFullBleed] = useState<boolean>(false);

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
    palette: "multivariate_facets" as HarmonicColorPalette,
    waveMode: "orbital_swirl" as WaveCirculationMode,
    baseOpacity: 0.75,
    baseStrokeWidth: 1.0,
    lineCount: 108,
    mode: "discrete_rings" as "discrete_rings" | "continuous" | "chords",
    // Pre-parsed colors for zero allocation:
    primaryRgb: { r: 56, g: 189, b: 248 },
    primaryHsl: { h: 199, s: 95, l: 60 },
    secondaryRgb: { r: 245, g: 158, b: 11 },
    secondaryHsl: { h: 38, s: 92, l: 50 },
    spectrumStopsRgb: [
      { r: 225, g: 29, b: 72 },
      { r: 245, g: 158, b: 11 },
      { r: 6, g: 182, b: 212 },
      { r: 168, g: 85, b: 247 },
    ],
    compiledFacets: [] as CompiledFacet[],
    facetDistribution: "interlaced_weave" as FacetDistributionMode,
    backdropStyle: "obsidian" as BackdropStyle,
  });

  // Multi-Facet toggle helpers
  const toggleFacet = (id: string) => {
    setActiveFacetIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          toastError("At least 1 facet must remain active in the multi-facet matrix");
          return prev;
        }
        next = prev.filter((item) => item !== id);
      } else {
        next = [...prev, id];
      }
      setPalette("multivariate_facets");
      return next;
    });
  };

  const soloFacet = (id: string) => {
    setActiveFacetIds([id]);
    const facet = ALL_FACETS.find((f) => f.id === id);
    if (facet) {
      setSelectedHex(facet.coreHex);
      setSecondaryHex(facet.accentHex);
    }
    setPalette("multivariate_facets");
    toastSuccess(`Soloing facet: ${facet?.name || id}`);
  };

  const selectFacetCluster = (category: "all" | "chakra" | "alchemical" | "singularity" | "neon") => {
    if (category === "all") {
      setActiveFacetIds(ALL_FACETS.map((f) => f.id));
      toastSuccess(`Activated all ${ALL_FACETS.length} harmonic facets`);
    } else {
      const ids = ALL_FACETS.filter((f) => f.category === category).map((f) => f.id);
      setActiveFacetIds(ids);
      toastSuccess(`Activated ${ids.length} ${category} facets`);
    }
    setPalette("multivariate_facets");
  };

  // Sync React props to mutable ref so the render loop always has latest settings without restart
  useEffect(() => {
    const pRgb = hexToRgb(selectedHex);
    const pHsl = rgbToHsl(pRgb.r, pRgb.g, pRgb.b);
    const sRgb = hexToRgb(secondaryHex);
    const sHsl = rgbToHsl(sRgb.r, sRgb.g, sRgb.b);
    const specRgb = customSpectrumStops.map((hex) => hexToRgb(hex));

    const activeFacetsList = ALL_FACETS.filter((f) => activeFacetIds.includes(f.id));
    const targetFacets = activeFacetsList.length > 0 ? activeFacetsList : [ALL_FACETS[0]];
    const compiledFacets: CompiledFacet[] = targetFacets.map((f) => {
      const cRgb = hexToRgb(f.coreHex);
      const aRgb = hexToRgb(f.accentHex);
      const kRgb = hexToRgb(f.causticHex);
      return {
        id: f.id,
        name: f.name,
        coreRgb: cRgb,
        accentRgb: aRgb,
        causticRgb: kRgb,
        coreHsl: rgbToHsl(cRgb.r, cRgb.g, cRgb.b),
        accentHsl: rgbToHsl(aRgb.r, aRgb.g, aRgb.b),
        frequencyHz: f.frequencyHz,
        modulationPhase: f.modulationPhase,
      };
    });

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
    engineStateRef.current.primaryRgb = pRgb;
    engineStateRef.current.primaryHsl = pHsl;
    engineStateRef.current.secondaryRgb = sRgb;
    engineStateRef.current.secondaryHsl = sHsl;
    engineStateRef.current.spectrumStopsRgb = specRgb;
    engineStateRef.current.compiledFacets = compiledFacets;
    engineStateRef.current.facetDistribution = facetDistribution;
    engineStateRef.current.backdropStyle = backdropStyle;
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
    selectedHex,
    secondaryHex,
    customSpectrumStops,
    activeFacetIds,
    facetDistribution,
    backdropStyle,
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

    const colorsParam =
      palette === "multivariate_facets"
        ? activeFacetIds
            .map((id) => ALL_FACETS.find((f) => f.id === id)?.coreHex)
            .filter(Boolean)
            .join(",")
        : palette === "custom_spectrum"
        ? customSpectrumStops.join(",")
        : `${selectedHex},${secondaryHex}`;

    const query = new URLSearchParams({
      lines: lineCount.toString(),
      mode: waveMode,
      multiplier: harmonicMultiplier.toString(),
      palette: palette,
      colors: colorsParam,
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
  }, [
    engineMode,
    lineCount,
    waveMode,
    harmonicMultiplier,
    palette,
    selectedHex,
    secondaryHex,
    customSpectrumStops,
    activeFacetIds,
  ]);

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

        // 1. Deep Space Obsidian / Ambient Auroral Wallpaper Background
        if (state.backdropStyle === "cosmic_aurora") {
          const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) * 0.75);
          bgGrad.addColorStop(0, "#1f0f38");
          bgGrad.addColorStop(0.5, "#0d061c");
          bgGrad.addColorStop(1, "#020617");
          ctx.fillStyle = bgGrad;
        } else if (state.backdropStyle === "emerald_matrix") {
          const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) * 0.75);
          bgGrad.addColorStop(0, "#063024");
          bgGrad.addColorStop(0.5, "#021610");
          bgGrad.addColorStop(1, "#020617");
          ctx.fillStyle = bgGrad;
        } else if (state.backdropStyle === "solar_corona") {
          const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) * 0.75);
          bgGrad.addColorStop(0, "#381400");
          bgGrad.addColorStop(0.5, "#1c0700");
          bgGrad.addColorStop(1, "#020617");
          ctx.fillStyle = bgGrad;
        } else {
          ctx.fillStyle = "#020617";
        }
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

            if (state.palette === "monochrome") {
              causticGlow.addColorStop(0.35, `rgba(226, 232, 240, ${state.spaceInterference * 0.12})`);
              causticGlow.addColorStop(0.75, `rgba(148, 163, 184, ${state.spaceInterference * 0.08})`);
            } else if (state.palette === "multivariate_facets" && state.compiledFacets.length > 0) {
              const fLen = state.compiledFacets.length;
              let cR = 0, cG = 0, cB = 0;
              for (let fi = 0; fi < fLen; fi++) {
                cR += state.compiledFacets[fi].causticRgb.r;
                cG += state.compiledFacets[fi].causticRgb.g;
                cB += state.compiledFacets[fi].causticRgb.b;
              }
              cR = Math.round(cR / fLen);
              cG = Math.round(cG / fLen);
              cB = Math.round(cB / fLen);
              const waveBoost = (Math.sin(2 * Math.PI * curPhase) + 1.0) * 0.5;
              causticGlow.addColorStop(
                0.35,
                `rgba(${cR}, ${cG}, ${cB}, ${(state.spaceInterference * (0.2 + waveBoost * 0.15)).toFixed(3)})`
              );
              causticGlow.addColorStop(
                0.75,
                `rgba(${cR}, ${cG}, ${cB}, ${(state.spaceInterference * 0.08).toFixed(3)})`
              );
            } else {
              const interHue = Math.floor(((curPhase * 360) % 360 + 360) % 360);
              causticGlow.addColorStop(0.35, `hsla(${interHue}, 90%, 55%, ${state.spaceInterference * 0.22})`);
              causticGlow.addColorStop(
                0.75,
                `hsla(${(interHue + 120) % 360}, 85%, 45%, ${state.spaceInterference * 0.15})`
              );
            }

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

              let hue = 0;
              let saturation = 85;
              let lightness = 55;
              let customRgbStroke = "";

              switch (state.palette) {
                case "multivariate_facets": {
                  const facets = state.compiledFacets;
                  const fCount = facets.length;
                  if (fCount > 0) {
                    let f: CompiledFacet;
                    let blendWeight = 0;
                    let nextF: CompiledFacet | null = null;

                    if (state.facetDistribution === "interlaced_weave") {
                      f = facets[i % fCount];
                    } else if (state.facetDistribution === "radial_octaves") {
                      const sector = Math.floor(frac * fCount) % fCount;
                      f = facets[sector];
                    } else {
                      // interference_blend
                      const pos = Math.abs(
                        (frac * fCount + curPhase * state.harmonicMultiplier) % fCount
                      );
                      const idx0 = Math.floor(pos);
                      const idx1 = (idx0 + 1) % fCount;
                      blendWeight = pos - idx0;
                      f = facets[idx0];
                      nextF = facets[idx1];
                    }

                    const fWave = Math.sin(
                      2 * Math.PI * (frac * state.harmonicMultiplier - curPhase + f.modulationPhase)
                    );
                    const tColor = (fWave + 1.0) * 0.5;

                    let r = f.coreRgb.r * (1.0 - tColor) + f.accentRgb.r * tColor;
                    let g = f.coreRgb.g * (1.0 - tColor) + f.accentRgb.g * tColor;
                    let b = f.coreRgb.b * (1.0 - tColor) + f.accentRgb.b * tColor;

                    if (nextF && blendWeight > 0) {
                      const r2 = nextF.coreRgb.r * (1.0 - tColor) + nextF.accentRgb.r * tColor;
                      const g2 = nextF.coreRgb.g * (1.0 - tColor) + nextF.accentRgb.g * tColor;
                      const b2 = nextF.coreRgb.b * (1.0 - tColor) + nextF.accentRgb.b * tColor;
                      r = r * (1.0 - blendWeight) + r2 * blendWeight;
                      g = g * (1.0 - blendWeight) + g2 * blendWeight;
                      b = b * (1.0 - blendWeight) + b2 * blendWeight;
                    }

                    const lum = Math.max(0.2, 1.0 + fWave * 0.35);
                    const op = Math.max(
                      0.15,
                      Math.min(1.0, state.baseOpacity * (0.65 + fWave * 0.35))
                    );

                    customRgbStroke = `rgba(${Math.min(255, Math.max(0, Math.round(r * lum)))}, ${Math.min(
                      255,
                      Math.max(0, Math.round(g * lum))
                    )}, ${Math.min(255, Math.max(0, Math.round(b * lum)))}, ${op.toFixed(2)})`;
                  }
                  break;
                }
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
              case "chakra": {
                const chkHues = [0, 24, 50, 155, 190, 240, 280];
                const cLen = chkHues.length;
                const cIdx = Math.abs((frac * cLen + curPhase * 2.0) % cLen);
                const i0 = Math.floor(cIdx);
                const i1 = (i0 + 1) % cLen;
                const mix = cIdx - i0;
                hue = chkHues[i0] * (1 - mix) + chkHues[i1] * mix;
                saturation = 92;
                lightness = 52 + waveFactor * 16;
                break;
              }
              case "alchemical": {
                const alcHues = [42, 210, 28, 220, 195, 270];
                const aLen = alcHues.length;
                const aIdx = Math.abs((frac * aLen + curPhase * 2.0) % aLen);
                const i0 = Math.floor(aIdx);
                const i1 = (i0 + 1) % aLen;
                const mix = aIdx - i0;
                hue = alcHues[i0] * (1 - mix) + alcHues[i1] * mix;
                saturation = 88;
                lightness = 54 + waveFactor * 18;
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
              case "golden_angle": {
                // 137.507764° Golden Angle non-repeating phyllotaxis stepping
                const baseH = state.primaryHsl.h;
                hue = Math.abs((baseH + i * 137.507764 + curPhase * 360) % 360);
                saturation = 90;
                lightness = 52 + waveFactor * 18;
                break;
              }
              case "iridescent": {
                // Thin-film optical interference based on isometric depth
                const baseH = state.primaryHsl.h;
                hue = Math.abs(
                  (baseH + 120 * Math.sin(2 * Math.PI * (frac * 3 - curPhase)) + 360) % 360
                );
                saturation = 95;
                lightness = 55 + waveFactor * 20;
                break;
              }
              case "solid_tint": {
                hue = state.primaryHsl.h;
                saturation = state.primaryHsl.s;
                lightness = Math.min(90, Math.max(20, state.primaryHsl.l + waveFactor * 18));
                break;
              }
              case "dual_zone": {
                const blend = Math.sin(frac * Math.PI * 0.5);
                const r = state.primaryRgb.r * (1 - blend) + state.secondaryRgb.r * blend;
                const g = state.primaryRgb.g * (1 - blend) + state.secondaryRgb.g * blend;
                const b = state.primaryRgb.b * (1 - blend) + state.secondaryRgb.b * blend;
                const lum = Math.max(0.2, 1 + waveFactor * 0.28);
                const op = Math.max(
                  0.15,
                  Math.min(1.0, state.baseOpacity * (0.65 + waveFactor * 0.35))
                );
                customRgbStroke = `rgba(${Math.min(255, Math.max(0, Math.round(r * lum)))}, ${Math.min(
                  255,
                  Math.max(0, Math.round(g * lum))
                )}, ${Math.min(255, Math.max(0, Math.round(b * lum)))}, ${op.toFixed(2)})`;
                break;
              }
              case "custom_spectrum": {
                const stops = state.spectrumStopsRgb;
                if (stops.length >= 2) {
                  const numStops = stops.length;
                  const pos = Math.abs(
                    (frac * numStops + curPhase * state.harmonicMultiplier) % numStops
                  );
                  const i0 = Math.floor(pos);
                  const i1 = (i0 + 1) % numStops;
                  const t = pos - i0;
                  const r = stops[i0].r * (1 - t) + stops[i1].r * t;
                  const g = stops[i0].g * (1 - t) + stops[i1].g * t;
                  const b = stops[i0].b * (1 - t) + stops[i1].b * t;
                  const lum = Math.max(0.2, 1 + waveFactor * 0.25);
                  const op = Math.max(
                    0.15,
                    Math.min(1.0, state.baseOpacity * (0.65 + waveFactor * 0.35))
                  );
                  customRgbStroke = `rgba(${Math.min(
                    255,
                    Math.max(0, Math.round(r * lum))
                  )}, ${Math.min(255, Math.max(0, Math.round(g * lum)))}, ${Math.min(
                    255,
                    Math.max(0, Math.round(b * lum))
                  )}, ${op.toFixed(2)})`;
                } else {
                  hue = state.primaryHsl.h;
                  saturation = state.primaryHsl.s;
                  lightness = 55 + waveFactor * 15;
                }
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

            ctx.strokeStyle =
              customRgbStroke ||
              `hsla(${Math.round(hue)}, ${saturation}%, ${Math.round(lightness)}%, ${opacity.toFixed(2)})`;
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

  // Export PNG Wallpaper Snapshot
  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `sacred_torus_wallpaper_${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    toastSuccess("Downloaded PNG wallpaper snapshot");
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

          {/* Backdrop Atmosphere & Wallpaper Controls */}
          <div className="w-full flex items-center justify-between mb-2.5 px-1 text-[11px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[10px]">ATMOSPHERE:</span>
              {[
                { id: "obsidian", label: "Void" },
                { id: "cosmic_aurora", label: "Cosmic" },
                { id: "emerald_matrix", label: "Emerald" },
                { id: "solar_corona", label: "Solar" },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBackdropStyle(b.id as BackdropStyle)}
                  className={`px-2 py-0.5 rounded text-[10px] transition ${
                    backdropStyle === b.id
                      ? "bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportPng}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center gap-1 text-[10px] transition"
                title="Download 4K/HD Wallpaper Snapshot (PNG)"
              >
                <ImageIcon className="w-3 h-3 text-cyan-400" />
                <span>PNG Wallpaper</span>
              </button>
              <button
                onClick={() => setFullBleed(!fullBleed)}
                className={`p-1 rounded border transition text-[10px] flex items-center gap-1 ${
                  fullBleed
                    ? "bg-cyan-950 text-cyan-300 border-cyan-500"
                    : "bg-slate-900 text-slate-400 hover:text-white border-slate-800"
                }`}
                title={fullBleed ? "Exit Full Bleed View" : "Full Bleed Ambient Background"}
              >
                {fullBleed ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Canvas Rendering Port */}
          <div className={`w-full aspect-square relative flex items-center justify-center p-2 rounded-2xl bg-black border border-slate-900 shadow-2xl overflow-hidden transition-all ${
            fullBleed ? "fixed inset-0 z-50 max-w-none w-screen h-screen rounded-none border-none p-0" : "max-w-[480px]"
          }`}>
            <canvas
              ref={canvasRef}
              width={fullBleed ? 1280 : 640}
              height={fullBleed ? 1280 : 640}
              className="w-full h-full object-contain select-none"
            />
            {fullBleed && (
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-cyan-400 pl-2">Ambient Background Active</span>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-xs font-mono text-slate-200"
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  onClick={() => setFullBleed(false)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Exit Full Bleed"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            )}
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
          {/* Enhanced Color Selection Grid & Spectrum Studio */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">Enhanced Color Selection Grid</h4>
              </div>
              <span className="text-xs font-mono text-amber-400">Harmonic Atelier</span>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => setColorModeTab("standard_swatches")}
                className={`py-1.5 px-2 rounded-lg text-center transition ${
                  colorModeTab === "standard_swatches"
                    ? "bg-slate-800 text-cyan-300 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Swatches
              </button>
              <button
                onClick={() => setColorModeTab("precision_picker")}
                className={`py-1.5 px-2 rounded-lg text-center transition ${
                  colorModeTab === "precision_picker"
                    ? "bg-slate-800 text-cyan-300 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Picker
              </button>
              <button
                onClick={() => setColorModeTab("spectrum_builder")}
                className={`py-1.5 px-2 rounded-lg text-center transition ${
                  colorModeTab === "spectrum_builder"
                    ? "bg-slate-800 text-cyan-300 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Spectrum
              </button>
              <button
                onClick={() => setColorModeTab("advanced_modes")}
                className={`py-1.5 px-2 rounded-lg text-center transition ${
                  colorModeTab === "advanced_modes"
                    ? "bg-slate-800 text-cyan-300 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Harmonics
              </button>
            </div>

            {/* TAB 1: MULTI-FACET SELECTOR & MULTIVARIATE MATRIX */}
            {colorModeTab === "standard_swatches" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* 1. Active Multivariate Facets Header & Distribution Controls */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="text-xs font-semibold text-white font-mono">
                        Active Multivariate Facets ({activeFacetIds.length})
                      </span>
                    </div>

                    {/* Distribution Mode Switcher */}
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                      {[
                        { id: "interlaced_weave", label: "Weave" },
                        { id: "radial_octaves", label: "Octaves" },
                        { id: "interference_blend", label: "Blend" },
                      ].map((dm) => (
                        <button
                          key={dm.id}
                          onClick={() => {
                            setFacetDistribution(dm.id as FacetDistributionMode);
                            setPalette("multivariate_facets");
                          }}
                          className={`px-2 py-0.5 rounded transition ${
                            facetDistribution === dm.id
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-semibold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          title={`Distribution Topology: ${dm.label}`}
                        >
                          {dm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Facets Pill Chips */}
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                    {activeFacetIds.map((fid) => {
                      const f = ALL_FACETS.find((item) => item.id === fid);
                      if (!f) return null;
                      return (
                        <div
                          key={fid}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-slate-200 shadow-sm"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${f.coreHex}, ${f.accentHex})`,
                            }}
                          />
                          <span className="text-[10px] font-medium">{f.name}</span>
                          <span className="text-[9px] text-cyan-400 font-normal">
                            {f.frequencyHz}Hz
                          </span>
                          <button
                            onClick={() => toggleFacet(f.id)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                            title="Remove Facet"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Cluster Selector Buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-slate-900 text-[10px] font-mono scrollbar-none">
                    <span className="text-slate-500 shrink-0 mr-1">Clusters:</span>
                    <button
                      onClick={() => selectFacetCluster("chakra")}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-800 hover:border-rose-500/30 whitespace-nowrap transition"
                    >
                      Chakras (7)
                    </button>
                    <button
                      onClick={() => selectFacetCluster("alchemical")}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/30 whitespace-nowrap transition"
                    >
                      Alchemical (6)
                    </button>
                    <button
                      onClick={() => selectFacetCluster("singularity")}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-blue-300 border border-slate-800 hover:border-blue-500/30 whitespace-nowrap transition"
                    >
                      Singularity (6)
                    </button>
                    <button
                      onClick={() => selectFacetCluster("neon")}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 hover:border-emerald-500/30 whitespace-nowrap transition"
                    >
                      Neon (6)
                    </button>
                    <button
                      onClick={() => selectFacetCluster("all")}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 hover:border-purple-500/30 whitespace-nowrap transition"
                    >
                      All (25)
                    </button>
                  </div>
                </div>

                {/* 2. Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
                  {(["all", "chakra", "alchemical", "singularity", "neon"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSwatchCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg border uppercase transition whitespace-nowrap ${
                        swatchCategory === cat
                          ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 font-semibold"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* 3. Multivariate Facet Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {(swatchCategory === "all"
                    ? ALL_FACETS
                    : ALL_FACETS.filter((s) => s.category === swatchCategory)
                  ).map((s) => {
                    const isActive = activeFacetIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleFacet(s.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2.5 ${
                          isActive
                            ? "bg-slate-800/95 text-white border-cyan-400 shadow-md ring-1 ring-cyan-400/50"
                            : "bg-slate-950/80 text-slate-300 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {/* Dual-Tone Gradient Swatch Badge */}
                          <div
                            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner shrink-0 flex items-center justify-center relative overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${s.coreHex} 0%, ${s.accentHex} 100%)`,
                            }}
                          >
                            {isActive && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
                              <span>{s.name}</span>
                              <span className="text-[9px] font-mono text-cyan-400 font-normal">
                                {s.frequencyHz}Hz
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                              {s.meaning}
                            </div>
                          </div>
                        </div>

                        {/* Solo Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soloFacet(s.id);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition shrink-0"
                          title="Solo this facet"
                        >
                          Solo
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 4. Action Footer */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Mode:{" "}
                    <span className="font-mono text-cyan-300 font-semibold uppercase">
                      {palette === "multivariate_facets" ? `${facetDistribution}` : palette}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPalette("multivariate_facets")}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition font-semibold ${
                        palette === "multivariate_facets"
                          ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow-sm"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      Active Facet Stream
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRECISION PICKER & HSL DEFINITION */}
            {colorModeTab === "precision_picker" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Hex Code & Color Swatch Input */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="relative">
                    <input
                      type="color"
                      value={selectedHex}
                      onChange={(e) => {
                        const hex = e.target.value.toUpperCase();
                        setSelectedHex(hex);
                        const rgb = hexToRgb(hex);
                        setHslSliders(rgbToHsl(rgb.r, rgb.g, rgb.b));
                      }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <div
                      className="w-10 h-10 rounded-xl border border-white/30 shadow-md flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: selectedHex }}
                    >
                      <Pipette className="w-4 h-4 text-white/80 drop-shadow" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-400 block">
                      Hex Color Code
                    </label>
                    <input
                      type="text"
                      value={selectedHex}
                      onChange={(e) => {
                        const hex = e.target.value;
                        setSelectedHex(hex);
                        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                          const rgb = hexToRgb(hex);
                          setHslSliders(rgbToHsl(rgb.r, rgb.g, rgb.b));
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Dual-Zone Secondary Hex Box */}
                  <div className="border-l border-slate-800 pl-3 space-y-1">
                    <label className="text-[10px] uppercase font-mono text-slate-400 block">
                      Secondary
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={secondaryHex}
                        onChange={(e) => setSecondaryHex(e.target.value.toUpperCase())}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        title="Secondary Color (Perimeter / Dual-Zone)"
                      />
                      <span className="text-[10px] font-mono text-slate-400">{secondaryHex}</span>
                    </div>
                  </div>
                </div>

                {/* HSL Sliders */}
                <div className="space-y-2.5">
                  {/* Hue Slider (0 - 360) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Hue (H)</span>
                      <span className="font-mono text-cyan-300 text-[11px]">{hslSliders.h}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hslSliders.h}
                      onChange={(e) => {
                        const h = parseInt(e.target.value);
                        const newHsl = { ...hslSliders, h };
                        setHslSliders(newHsl);
                        setSelectedHex(hslToHex(newHsl.h, newHsl.s, newHsl.l));
                      }}
                      className="w-full h-2 rounded-lg cursor-pointer appearance-none"
                      style={{
                        background:
                          "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                      }}
                    />
                  </div>

                  {/* Saturation Slider (0 - 100) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Saturation (S)</span>
                      <span className="font-mono text-purple-300 text-[11px]">{hslSliders.s}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={hslSliders.s}
                      onChange={(e) => {
                        const s = parseInt(e.target.value);
                        const newHsl = { ...hslSliders, s };
                        setHslSliders(newHsl);
                        setSelectedHex(hslToHex(newHsl.h, newHsl.s, newHsl.l));
                      }}
                      className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>

                  {/* Lightness Slider (10 - 95) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Lightness (L)</span>
                      <span className="font-mono text-amber-300 text-[11px]">{hslSliders.l}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="95"
                      value={hslSliders.l}
                      onChange={(e) => {
                        const l = parseInt(e.target.value);
                        const newHsl = { ...hslSliders, l };
                        setHslSliders(newHsl);
                        setSelectedHex(hslToHex(newHsl.h, newHsl.s, newHsl.l));
                      }}
                      className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>

                {/* Quick Slot Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => {
                      setSecondaryHex(selectedHex);
                      toastSuccess("Assigned to Perimeter (Secondary)");
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                  >
                    Set as Perimeter
                  </button>
                  <button
                    onClick={() => {
                      if (!customSpectrumStops.includes(selectedHex)) {
                        setCustomSpectrumStops([...customSpectrumStops, selectedHex]);
                        setPalette("custom_spectrum");
                        toastSuccess("Added to Multi-Stop Spectrum");
                      }
                    }}
                    className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 transition"
                  >
                    + Add to Spectrum
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOM MULTI-STOP SPECTRUM BUILDER */}
            {colorModeTab === "spectrum_builder" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Visual Gradient Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Continuous Spectrum Flow</span>
                    <span className="text-cyan-300 text-[11px]">{customSpectrumStops.length} Stops</span>
                  </div>
                  <div
                    className="w-full h-7 rounded-xl border border-white/20 shadow-inner"
                    style={{
                      background: `linear-gradient(to right, ${customSpectrumStops.join(", ")})`,
                    }}
                  />
                </div>

                {/* Editable Color Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Gradient Nodes:</span>
                    <button
                      onClick={() => {
                        if (customSpectrumStops.length < 8) {
                          setCustomSpectrumStops([...customSpectrumStops, selectedHex]);
                          setPalette("custom_spectrum");
                        }
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Picked ({selectedHex})
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {customSpectrumStops.map((hex, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-mono ${
                          activeStopIndex === idx
                            ? "bg-slate-800 border-cyan-400 text-white shadow-sm"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        <span
                          onClick={() => {
                            setActiveStopIndex(idx);
                            setSelectedHex(hex);
                          }}
                          className="w-3.5 h-3.5 rounded-full cursor-pointer border border-white/20"
                          style={{ backgroundColor: hex }}
                        />
                        <span
                          onClick={() => {
                            setActiveStopIndex(idx);
                            setSelectedHex(hex);
                          }}
                          className="cursor-pointer text-[10px]"
                        >
                          {hex}
                        </span>
                        {customSpectrumStops.length > 2 && (
                          <button
                            onClick={() => {
                              const updated = customSpectrumStops.filter((_, i) => i !== idx);
                              setCustomSpectrumStops(updated);
                            }}
                            className="hover:text-rose-400 p-0.5 rounded transition"
                            title="Remove Stop"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Designer Gradient Presets */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-400 font-medium block">
                    Curated Harmonic Presets
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                    {GRADIENT_PRESETS.map((gp) => (
                      <button
                        key={gp.name}
                        onClick={() => {
                          setCustomSpectrumStops(gp.stops);
                          setPalette("custom_spectrum");
                          toastSuccess(`Loaded ${gp.name} spectrum`);
                        }}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
                      >
                        <span className="text-[11px] text-slate-300 truncate">{gp.name}</span>
                        <div
                          className="w-10 h-3 rounded border border-white/20 shrink-0 ml-1.5"
                          style={{ background: `linear-gradient(to right, ${gp.stops.join(",")})` }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setPalette("custom_spectrum")}
                  className={`w-full py-2 rounded-xl border text-xs font-mono font-semibold transition ${
                    palette === "custom_spectrum"
                      ? "bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-sm"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  Activate Custom Spectrum Flow
                </button>
              </div>
            )}

            {/* TAB 4: ADVANCED HARMONIC MODES */}
            {colorModeTab === "advanced_modes" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* Solfeggio Prism */}
                  <button
                    onClick={() => setPalette("solfeggio")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "solfeggio"
                        ? "bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Solfeggio Prism</div>
                      <div className="text-[9px] text-slate-500">9 Sacred Frequencies</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></div>
                  </button>

                  {/* Chakra 7-Centers */}
                  <button
                    onClick={() => setPalette("chakra")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "chakra"
                        ? "bg-rose-950/60 text-rose-300 border-rose-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Chakra 7-Centers</div>
                      <div className="text-[9px] text-slate-500">Vedic Pranic Centers</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></div>
                  </button>

                  {/* Alchemical Metals */}
                  <button
                    onClick={() => setPalette("alchemical")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "alchemical"
                        ? "bg-yellow-950/60 text-yellow-300 border-yellow-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Alchemical Metals</div>
                      <div className="text-[9px] text-slate-500">6 Esoteric Elements</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"></div>
                  </button>

                  {/* Golden Ratio Phyllotaxis */}
                  <button
                    onClick={() => setPalette("golden_angle")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "golden_angle"
                        ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Golden Angle (137.5°)</div>
                      <div className="text-[9px] text-slate-500">Fibonacci Phyllotaxis</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                  </button>

                  {/* Iridescent Thin-Film */}
                  <button
                    onClick={() => setPalette("iridescent")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "iridescent"
                        ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Iridescent Thin-Film</div>
                      <div className="text-[9px] text-slate-500">Optical Interference</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></div>
                  </button>

                  {/* Dual-Zone Singularity */}
                  <button
                    onClick={() => setPalette("dual_zone")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "dual_zone"
                        ? "bg-blue-950/60 text-blue-300 border-blue-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Dual-Zone Singularity</div>
                      <div className="text-[9px] text-slate-500">Core vs Perimeter</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
                  </button>

                  {/* Synesthesia 360° */}
                  <button
                    onClick={() => setPalette("synesthesia")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "synesthesia"
                        ? "bg-purple-950/60 text-purple-300 border-purple-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Synesthesia 360°</div>
                      <div className="text-[9px] text-slate-500">Newton-Scriabin Wheel</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></div>
                  </button>

                  {/* Pythagorean 3:2 */}
                  <button
                    onClick={() => setPalette("pythagorean")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "pythagorean"
                        ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Pythagorean 3:2</div>
                      <div className="text-[9px] text-slate-500">Spiral of Fifths</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></div>
                  </button>

                  {/* Bioluminescent */}
                  <button
                    onClick={() => setPalette("bioluminescent")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "bioluminescent"
                        ? "bg-teal-950/60 text-teal-300 border-teal-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Bioluminescent</div>
                      <div className="text-[9px] text-slate-500">Oceanic Cyan/Emerald</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0"></div>
                  </button>

                  {/* Solid Monochromatic Tint */}
                  <button
                    onClick={() => setPalette("solid_tint")}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "solid_tint"
                        ? "bg-sky-950/60 text-sky-300 border-sky-500/50 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white">Solid Tint</div>
                      <div className="text-[9px] text-slate-500">Luminance Breathing</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0"></div>
                  </button>

                  {/* Plain Monochrome Ink */}
                  <button
                    onClick={() => setPalette("monochrome")}
                    className={`col-span-2 p-2 rounded-xl border text-left transition flex items-center justify-between ${
                      palette === "monochrome"
                        ? "bg-slate-800 text-white border-slate-600 shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">Plain Monochrome Ink (Silver Luminescence)</div>
                      <div className="text-[10px] text-slate-500">Pure circumscribed lines without coloration</div>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wave Circulation & Harmonic Caustics Engine */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Wave Circulation &amp; Caustic Engine</span>
              </span>
              <span className="text-xs font-mono text-cyan-400">Harmonic Waveforms</span>
            </h4>

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
