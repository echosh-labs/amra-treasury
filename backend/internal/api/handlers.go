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
	"github.com/echosh-labs/amra-treasury/internal/youtube"
)

type Handler struct {
	cfg         *config.Config
	store       db.StorageEngine
	youtube     *youtube.Client
	amraEngine  *amra.Engine
	amraHandler *amra.Handler
	startTime   time.Time
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

	return &Handler{
		cfg:         cfg,
		store:       store,
		youtube:     ytClient,
		amraEngine:  amraEngine,
		amraHandler: amraHandler,
		startTime:   time.Now().UTC(),
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
