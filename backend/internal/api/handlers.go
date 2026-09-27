package api

import (
	"encoding/json"
	"net/http"
	"runtime"
	"strings"
	"time"

	"github.com/echosh-labs/amra-treasury/internal/amra"
	"github.com/echosh-labs/amra-treasury/internal/config"
	"github.com/echosh-labs/amra-treasury/internal/db"
	"github.com/echosh-labs/amra-treasury/internal/studio"
	"github.com/echosh-labs/amra-treasury/internal/youtube"
)

type Handler struct {
	cfg           *config.Config
	store         db.StorageEngine
	youtube       *youtube.Client
	amraEngine    *amra.Engine
	amraHandler   *amra.Handler
	studioHandler *studio.Handler
	startTime     time.Time
}

func NewHandler(cfg *config.Config, store db.StorageEngine) *Handler {
	ytSecrets := youtube.NewEnvSecretProvider(cfg.YouTubeClientID, cfg.YouTubeClientSecret, cfg.YouTubeRedirectURL)
	ytClient := youtube.NewClient(ytSecrets, store, func() string {
		return "══════════════════════════════════════════════════════════════════\n🏛️ AMRA Sovereign Treasury & Studio\n• Host Substrate: echosh-labs single-binary engine (Port 8050)\n• Vedic Fruition & Immutable Audit Ledger\n══════════════════════════════════════════════════════════════════"
	})

	var paymentProviders []amra.PaymentProvider
	if cfg.StripeAPIKey != "" {
		paymentProviders = append(paymentProviders, amra.NewStripePaymentProvider(cfg.StripeAPIKey, cfg.StripeWebhookSecret))
	} else {
		paymentProviders = append(paymentProviders, amra.NewMockPaymentProvider("dev_secret_mock"))
	}

	amraEngine := amra.NewEngine(store, paymentProviders...)
	amraHandler := amra.NewHandler(amraEngine)
	studioHandler := studio.NewHandler(ytClient.GetUploader(), ".data/renders")

	return &Handler{
		cfg:           cfg,
		store:         store,
		youtube:       ytClient,
		amraEngine:    amraEngine,
		amraHandler:   amraHandler,
		studioHandler: studioHandler,
		startTime:     time.Now().UTC(),
	}
}

// HealthzHandler returns the liveness status of amra-treasury.
func (h *Handler) HealthzHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":      "ok",
		"service":     h.cfg.ServiceName,
		"port":        h.cfg.Port,
		"uptime_sec":  int(time.Since(h.startTime).Seconds()),
		"environment": h.cfg.Environment,
	})
}

// TelemetryHandler provides system performance and storage metrics.
func (h *Handler) TelemetryHandler(w http.ResponseWriter, r *http.Request) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	stats, _ := h.store.GetStats()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"service":      h.cfg.ServiceName,
		"goroutines":   runtime.NumGoroutine(),
		"alloc_mb":     float64(m.Alloc) / 1024 / 1024,
		"sys_mb":       float64(m.Sys) / 1024 / 1024,
		"num_gc":       m.NumGC,
		"uptime_sec":   int(time.Since(h.startTime).Seconds()),
		"boltdb_stats": stats,
	})
}

// GetEsotericCatalogHandler lists available esoteric document keys in BoltDB.
func (h *Handler) GetEsotericCatalogHandler(w http.ResponseWriter, r *http.Request) {
	prefix := r.URL.Query().Get("prefix")
	if prefix == "" {
		prefix = "esoteric:"
	}

	keys, err := h.store.ListEsotericContent(prefix)
	if err != nil {
		http.Error(w, `{"error":"failed to list esoteric documents"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"keys":   keys,
		"count":  len(keys),
		"prefix": prefix,
		"source": "boltdb:esoteric_content",
	})
}

// GetArishadvargaHandler returns the 6 classical inner adversaries and transmutations.
func (h *Handler) GetArishadvargaHandler(w http.ResponseWriter, r *http.Request) {
	raw, err := h.store.GetEsotericContent("esoteric:arishadvarga")
	if err != nil {
		// Fallback to in-memory defaults
		demons := db.DefaultArishadvargaDemons()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"demons": demons,
			"count":  len(demons),
			"source": "memory:defaults",
		})
		return
	}

	var demons []db.ArishadvargaDemon
	if err := json.Unmarshal(raw, &demons); err != nil {
		demons = db.DefaultArishadvargaDemons()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"demons": demons,
		"count":  len(demons),
		"source": "boltdb:esoteric_content",
	})
}

// GetEsotericDocHandler retrieves a specific esoteric document by key.
func (h *Handler) GetEsotericDocHandler(w http.ResponseWriter, r *http.Request) {
	key := strings.TrimPrefix(r.URL.Path, "/api/v1/esoteric/")
	if key == "" {
		http.Error(w, `{"error":"key required"}`, http.StatusBadRequest)
		return
	}

	fullKey := key
	if !strings.HasPrefix(fullKey, "esoteric:") {
		fullKey = "esoteric:" + fullKey
	}

	raw, err := h.store.GetEsotericContent(fullKey)
	if err != nil {
		http.Error(w, `{"error":"esoteric document not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

// RouteInfo describes a registered REST route.
type RouteInfo struct {
	Method      string `json:"method"`
	Path        string `json:"path"`
	Category    string `json:"category"`
	Description string `json:"description"`
}

// RoutesCatalogHandler returns an interactive catalog of all registered endpoints.
func (h *Handler) RoutesCatalogHandler(w http.ResponseWriter, r *http.Request) {
	routes := []RouteInfo{
		{"GET", "/healthz", "Mission Control", "Service health check, uptime, and environment."},
		{"GET", "/api/telemetry", "Mission Control", "Go runtime memory, goroutines, and BoltDB stats."},
		{"GET", "/api/v1/routes", "Mission Control", "Interactive API catalog of all registered endpoints."},
		{"GET", "/api/v1/system/routes", "Mission Control", "Alias to API route catalog."},
		// YouTube Studio
		{"GET", "/api/v1/youtube/status", "YouTube Studio", "OAuth2 account status, channel metadata, and estimated quota units."},
		{"GET", "/api/v1/youtube/auth/url", "YouTube Studio", "Generate Google OAuth 2.0 authorization URL with offline consent."},
		{"GET", "/api/v1/youtube/auth/callback", "YouTube Studio", "OAuth2 redirect receiver and token persistence handler."},
		{"POST", "/api/v1/youtube/auth/disconnect", "YouTube Studio", "Revoke OAuth tokens and purge YouTube credentials from BoltDB."},
		{"POST", "/api/v1/youtube/upload", "YouTube Studio", "Enqueue video upload from local POSIX path or multipart form."},
		{"GET", "/api/v1/youtube/jobs", "YouTube Studio", "List active and historical video upload jobs."},
		{"GET", "/api/v1/youtube/jobs/{id}", "YouTube Studio", "Get real-time upload progress and video URL."},
		{"GET", "/api/v1/youtube/videos", "YouTube Studio", "List authenticated channel uploaded videos."},
		{"GET", "/api/v1/youtube/analytics", "YouTube Studio", "30-day analytics report for channel views and watch time."},
		{"GET", "/api/v1/youtube/finance", "YouTube Studio", "Estimated monetary earnings report."},
		{"POST", "/api/v1/youtube/finance/sync-amra", "YouTube Studio", "Sync accrued YouTube ad earnings to AMRA Treasury audit ledger."},
		// AMRA Financial Core
		{"GET", "/api/v1/amra/plans", "Treasury Core", "List active sovereign subscription and patron plans."},
		{"POST", "/api/v1/amra/checkout", "Treasury Core", "Initiate patron checkout session via Stripe or dev mock."},
		{"POST", "/api/v1/amra/webhook/{provider}", "Treasury Core", "Payment provider webhook receiver."},
		{"GET", "/api/v1/amra/subscriptions/{id}", "Treasury Core", "Get subscription details and status."},
		{"GET", "/api/v1/amra/ledger", "Treasury Core", "Query immutable BoltDB audit ledger entries."},
		{"GET", "/api/v1/amra/metrics", "Treasury Core", "Consolidated MRR, subscribers, and gross ecosystem yield."},
		// Sacred Geometry & Artwork
		{"GET", "/api/v1/amra/geometry", "Sacred Geometry", "Compute parametric Kairi curve and Arishadvarga shadow transmutation."},
		{"POST", "/api/v1/amra/geometry", "Sacred Geometry", "Save custom geometry parameters to BoltDB."},
		{"GET", "/api/v1/amra/geometry/toroid", "Sacred Geometry", "Calculate Sacred Toroidal Singularity geometry."},
		{"POST", "/api/v1/amra/geometry/toroid", "Sacred Geometry", "Save custom toroid presets to BoltDB."},
		{"GET", "/api/v1/amra/geometry/toroid/stream", "Sacred Geometry", "Server-Sent Events (SSE) real-time harmonic wave stream."},
		{"GET", "/api/v1/amra/artwork", "Sacred Geometry", "Catalog of canonical sacred geometry presets."},
		{"POST", "/api/v1/amra/artwork", "Sacred Geometry", "Save or seed sacred artwork documents."},
		// Google Cloud Billing
		{"GET", "/api/v1/amra/gcloud/status", "Cloud Infrastructure", "GCloud SDK configuration and billing account status."},
		{"GET", "/api/v1/amra/gcloud/billing", "Cloud Infrastructure", "Current month GCP infrastructure spend."},
		{"POST", "/api/v1/amra/gcloud/sync-ledger", "Cloud Infrastructure", "Log GCP operational expenses into BoltDB audit ledger."},
		// Creative Studio & Video Pipeline
		{"GET", "/api/v1/studio/manifests", "Creative Studio", "List saved timeline manifests for long-form video."},
		{"POST", "/api/v1/studio/manifests", "Creative Studio", "Save or update a timeline manifest."},
		{"GET", "/api/v1/studio/stream", "Creative Studio", "Zero-commit ephemeral live video stream preview."},
		{"POST", "/api/v1/studio/render", "Creative Studio", "Launch headless video compilation job (MP4 output)."},
		{"GET", "/api/v1/studio/jobs", "Creative Studio", "List all background render jobs."},
		{"GET", "/api/v1/studio/jobs/{id}", "Creative Studio", "Get render job progress, frame count, and output path."},
		{"POST", "/api/v1/studio/dispatch", "Creative Studio", "Push completed render artifact directly to YouTube."},
		// Local Media CDN
		{"GET", "/api/v1/studio/media/catalog", "Local Media CDN", "Scan and catalog media library across renders, Shaolin, esoteric, vault."},
		{"GET", "/api/v1/studio/media/stream/{id}", "Local Media CDN", "HTTP 206 Partial Content byte-range zero-stutter video streaming."},
		// Esoteric Foundations
		{"GET", "/api/v1/esoteric", "Esoteric Foundations", "List esoteric document keys in BoltDB."},
		{"GET", "/api/v1/esoteric/arishadvarga", "Esoteric Foundations", "The 6 classical inner adversaries and alchemical transmutations."},
		{"GET", "/api/v1/esoteric/{key}", "Esoteric Foundations", "Retrieve specific esoteric philosophical document by key."},
		// MCP Server
		{"GET", "/mcp", "Model Context Protocol", "MCP service metadata and streamable HTTP transport info."},
		{"POST", "/mcp", "Model Context Protocol", "JSON-RPC 2.0 MCP protocol execution endpoint."},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"service": h.cfg.ServiceName,
		"port":    h.cfg.Port,
		"total":   len(routes),
		"routes":  routes,
	})
}

// GetStudioHandler returns the creative studio handler instance.
func (h *Handler) GetStudioHandler() *studio.Handler {
	return h.studioHandler
}
