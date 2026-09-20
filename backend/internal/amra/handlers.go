package amra

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/echosh-labs/amra-treasury/internal/db"
)

// Handler serves HTTP endpoints for AMRA financial operations.
type Handler struct {
	engine *Engine
}

func NewHandler(engine *Engine) *Handler {
	return &Handler{engine: engine}
}

// ListPlansHandler returns all active subscription plans.
func (h *Handler) ListPlansHandler(w http.ResponseWriter, r *http.Request) {
	plans := h.engine.ListPlans()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"plans": plans,
		"count": len(plans),
	})
}

// CheckoutHandler creates a checkout session for a given plan.
func (h *Handler) CheckoutHandler(w http.ResponseWriter, r *http.Request) {
	var req CheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if req.PlanID == "" {
		http.Error(w, `{"error":"plan_id is required"}`, http.StatusBadRequest)
		return
	}

	resp, err := h.engine.CreateCheckout(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrPlanNotFound) {
			http.Error(w, `{"error":"plan not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

// WebhookHandler handles inbound payment provider webhook events.
func (h *Handler) WebhookHandler(w http.ResponseWriter, r *http.Request) {
	providerName := r.PathValue("provider")
	if providerName == "" {
		providerName = "mock"
	}

	provider, ok := h.engine.providers[providerName]
	if !ok {
		http.Error(w, `{"error":"unrecognized payment provider"}`, http.StatusBadRequest)
		return
	}

	body, eventType, err := provider.VerifyWebhook(r, "")
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusUnauthorized)
		return
	}

	tx, err := h.engine.ProcessWebhookIngest(r.Context(), providerName, eventType, body)
	if err != nil {
		if errors.Is(err, ErrDuplicateEvent) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "ignored_duplicate"})
			return
		}
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":      "processed",
		"transaction": tx,
	})
}

// GetSubscriptionHandler retrieves subscription state by ID.
func (h *Handler) GetSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	subID := r.PathValue("id")
	if subID == "" {
		http.Error(w, `{"error":"subscription id is required"}`, http.StatusBadRequest)
		return
	}

	sub, err := h.engine.GetSubscription(subID)
	if err != nil {
		http.Error(w, `{"error":"subscription not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(sub)
}

// LedgerHandler returns recent transactions from the immutable ledger.
func (h *Handler) LedgerHandler(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	txs, err := h.engine.ListLedgerTransactions(limit)
	if err != nil {
		http.Error(w, `{"error":"failed to query ledger"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"ledger": txs,
		"count":  len(txs),
	})
}

// MetricsHandler returns unified SaaS and YouTube financial metrics.
func (h *Handler) MetricsHandler(w http.ResponseWriter, r *http.Request) {
	metrics, err := h.engine.GetFinancialMetrics(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to compute financial metrics"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(metrics)
}

// GeometryHandler calculates the parametric Kairi curve, sacred leaves, and
// Samudra Manthan alchemical shadow-transmutation metrics.
func (h *Handler) GeometryHandler(w http.ResponseWriter, r *http.Request) {
	params := DefaultKairiParams()
	shadowTension := 0.40
	solarFire := 0.80

	// Handle optional POST request body
	if r.Method == http.MethodPost && r.Body != nil {
		var req struct {
			Rx            float64 `json:"rx"`
			Ry            float64 `json:"ry"`
			Hook          float64 `json:"hook"`
			ShadowTension float64 `json:"shadow_tension"`
			SolarFire     float64 `json:"solar_fire"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			if req.Rx > 0 {
				params.Rx = req.Rx
			}
			if req.Ry > 0 {
				params.Ry = req.Ry
			}
			if req.Hook > 0 {
				params.Gamma = req.Hook
			}
			if req.ShadowTension >= 0 {
				shadowTension = req.ShadowTension
			}
			if req.SolarFire >= 0 {
				solarFire = req.SolarFire
			}
		}
	}

	// Handle optional GET query parameters
	q := r.URL.Query()
	if rxStr := q.Get("rx"); rxStr != "" {
		if parsed, err := strconv.ParseFloat(rxStr, 64); err == nil && parsed > 0 {
			params.Rx = parsed
		}
	}
	if ryStr := q.Get("ry"); ryStr != "" {
		if parsed, err := strconv.ParseFloat(ryStr, 64); err == nil && parsed > 0 {
			params.Ry = parsed
		}
	}
	if hookStr := q.Get("hook"); hookStr != "" {
		if parsed, err := strconv.ParseFloat(hookStr, 64); err == nil && parsed > 0 {
			params.Gamma = parsed
		}
	}
	if shadowStr := q.Get("shadow"); shadowStr != "" {
		if parsed, err := strconv.ParseFloat(shadowStr, 64); err == nil {
			shadowTension = parsed
		}
	}
	if heatStr := q.Get("heat"); heatStr != "" {
		if parsed, err := strconv.ParseFloat(heatStr, 64); err == nil {
			solarFire = parsed
		}
	}

	demons, _ := h.engine.GetArishadvargaDemons()
	philosophy, _ := h.engine.GetAmraPhilosophy()
	triad, _ := h.engine.GetTransmutationTriad()

	geo := GenerateAmraGeometryWithContent(params, shadowTension, solarFire, demons, philosophy, triad)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(geo)
}

// GCloudStatusHandler returns the Google Cloud account and project topology.
func (h *Handler) GCloudStatusHandler(w http.ResponseWriter, r *http.Request) {
	status, err := h.engine.GetGCloudStatus(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to resolve gcloud status"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(status)
}

// GCloudBillingHandler returns the infrastructure burn rate report and sovereign margin analysis.
func (h *Handler) GCloudBillingHandler(w http.ResponseWriter, r *http.Request) {
	billing, err := h.engine.GetGCloudBilling(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to generate gcloud billing report"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(billing)
}

// GCloudSyncLedgerHandler commits the current month's infrastructure expense to the immutable ledger.
func (h *Handler) GCloudSyncLedgerHandler(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	tx, err := h.engine.SyncGCloudExpenseToLedger(r.Context(), month)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"failed to sync gcloud expense to ledger: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":      "synced",
		"transaction": tx,
	})
}

// ToroidGeometryHandler calculates the Sacred Toroidal Singularity geometry,
// with circumscribed precessing filaments, central black hole void, and non-closure miss margin.
func (h *Handler) ToroidGeometryHandler(w http.ResponseWriter, r *http.Request) {
	params := DefaultToroidParams()

	// Handle optional POST request body
	if r.Method == http.MethodPost && r.Body != nil {
		var req struct {
			MajorRadius float64 `json:"major_radius"`
			MinorRadius float64 `json:"minor_radius"`
			LineCount   int     `json:"line_count"`
			MissMargin  float64 `json:"miss_margin"`
			TiltAngle   float64 `json:"tilt_angle"`
			WindingStep int     `json:"winding_step"`
			Mode        string  `json:"mode"`
			Scale       float64 `json:"scale"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			if req.MajorRadius > 0 {
				params.MajorRadius = req.MajorRadius
			}
			if req.MinorRadius > 0 {
				params.MinorRadius = req.MinorRadius
			}
			if req.LineCount > 0 {
				params.LineCount = req.LineCount
			}
			if req.MissMargin != 0 {
				params.MissMargin = req.MissMargin
			}
			if req.TiltAngle != 0 {
				params.TiltAngle = req.TiltAngle
			}
			if req.WindingStep > 0 {
				params.WindingStep = req.WindingStep
			}
			if req.Mode != "" {
				params.Mode = req.Mode
			}
			if req.Scale > 0 {
				params.Scale = req.Scale
			}
		}
	}

	// Handle optional GET query parameters
	q := r.URL.Query()
	if v := q.Get("r_major"); v != "" {
		if val, err := strconv.ParseFloat(v, 64); err == nil && val > 0 {
			params.MajorRadius = val
		}
	}
	if v := q.Get("r_minor"); v != "" {
		if val, err := strconv.ParseFloat(v, 64); err == nil && val > 0 {
			params.MinorRadius = val
		}
	}
	if v := q.Get("lines"); v != "" {
		if val, err := strconv.Atoi(v); err == nil && val > 0 {
			params.LineCount = val
		}
	}
	if v := q.Get("miss"); v != "" {
		if val, err := strconv.ParseFloat(v, 64); err == nil {
			params.MissMargin = val
		}
	}
	if v := q.Get("tilt"); v != "" {
		if val, err := strconv.ParseFloat(v, 64); err == nil {
			params.TiltAngle = val
		}
	}
	if v := q.Get("step"); v != "" {
		if val, err := strconv.Atoi(v); err == nil && val > 0 {
			params.WindingStep = val
		}
	}
	if v := q.Get("mode"); v != "" {
		params.Mode = v
	}
	if v := q.Get("scale"); v != "" {
		if val, err := strconv.ParseFloat(v, 64); err == nil && val > 0 {
			params.Scale = val
		}
	}

	geo := CalculateToroidGeometry(params)

	// Enrich with presets from database doc if available
	doc, err := h.engine.GetToroidArtwork()
	var presets []db.ToroidPresetDoc
	if err == nil && doc != nil {
		presets = doc.Presets
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"geometry": geo,
		"presets":  presets,
		"metadata": doc,
	})
}

// ToroidStreamHandler streams real-time continuous harmonic wave states over Server-Sent Events (SSE).
// It features high-precision ticker synchronization, zero-leak goroutine termination, and pooled buffers.
func (h *Handler) ToroidStreamHandler(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	q := r.URL.Query()
	lineCount := 108
	if v := q.Get("lines"); v != "" {
		if val, err := strconv.Atoi(v); err == nil && val > 0 {
			lineCount = val
		}
	}
	waveMode := q.Get("mode")
	if waveMode == "" {
		waveMode = "orbital_swirl"
	}
	multiplier := 3
	if v := q.Get("multiplier"); v != "" {
		if val, err := strconv.Atoi(v); err == nil && val > 0 {
			multiplier = val
		}
	}
	palette := q.Get("palette")
	if palette == "" {
		palette = "solfeggio"
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	ticker := time.NewTicker(33 * time.Millisecond) // ~30 FPS broadcast
	defer ticker.Stop()

	start := time.Now()
	var frameIdx int64 = 0

	for {
		select {
		case <-r.Context().Done():
			// Client disconnected - cleanly exit to prevent memory or goroutine leak
			return
		case now := <-ticker.C:
			frameIdx++
			tSec := now.Sub(start).Seconds()
			frame := ComputeContinuousHarmonicFrame(lineCount, tSec, waveMode, multiplier, palette, frameIdx)
			data, err := json.Marshal(frame)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

// ArtworkCatalogHandler returns all available sacred artworks in the AMRA Treasury Storehouse.
func (h *Handler) ArtworkCatalogHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		// Save new preset to toroid artwork document
		var newPreset db.ToroidPresetDoc
		if err := json.NewDecoder(r.Body).Decode(&newPreset); err != nil {
			http.Error(w, `{"error":"invalid preset payload"}`, http.StatusBadRequest)
			return
		}
		if newPreset.ID == "" {
			newPreset.ID = fmt.Sprintf("preset_%d", time.Now().Unix())
		}
		if newPreset.Name == "" {
			newPreset.Name = "Custom Torus Preset"
		}

		doc, _ := h.engine.GetToroidArtwork()
		if doc == nil {
			d := db.DefaultToroidArtworkDoc()
			doc = &d
		}
		doc.Presets = append(doc.Presets, newPreset)
		if err := h.engine.SaveToroidArtwork(doc); err != nil {
			http.Error(w, `{"error":"failed to persist preset"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"status": "saved",
			"preset": newPreset,
		})
		return
	}

	// GET: Return entire artwork catalog
	toroidDoc, _ := h.engine.GetToroidArtwork()
	philosophy, _ := h.engine.GetAmraPhilosophy()

	catalog := []map[string]any{
		{
			"id":          "toroid_singularity",
			"name":        "Toroidal Singularity (Akasha Spanda)",
			"category":    "sacred_geometry",
			"description": "Circumscribed precessing filaments forming an event horizon black hole void with intentional non-closing miss margin.",
			"endpoint":    "/api/v1/amra/geometry/toroid",
			"metadata":    toroidDoc,
		},
		{
			"id":          "amra_mango",
			"name":        "Āmra Rūpa & Shadow Alchemy (Jnana-Phala)",
			"category":    "sacred_geometry",
			"description": "Parametric Kairi curve with indestructible Bīja seed and Arishadvarga shadow transmutation.",
			"endpoint":    "/api/v1/amra/geometry",
			"metadata":    philosophy,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"catalog": catalog,
		"count":   len(catalog),
	})
}

