package studio

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/echosh-labs/amra-treasury/internal/youtube"
)

// Handler exposes the Creative Studio REST and streaming APIs.
type Handler struct {
	compiler    *TimelineCompiler
	streamer    *LiveStreamer
	renderer    *HeadlessRenderer
	bridge      *YouTubeBridge
	mediaCDN    *LocalMediaCDN
	manifestsMu sync.RWMutex
	manifests   map[string]*StudioTimelineManifest
}

// NewHandler instantiates the Studio API handler.
func NewHandler(uploader *youtube.Uploader, rendersDir string) *Handler {
	h := &Handler{
		compiler:  NewTimelineCompiler(),
		streamer:  NewLiveStreamer(),
		renderer:  NewHeadlessRenderer(rendersDir),
		bridge:    NewYouTubeBridge(uploader),
		mediaCDN:  NewLocalMediaCDN(rendersDir),
		manifests: make(map[string]*StudioTimelineManifest),
	}

	// Seed canonical default manifest
	canonical := &StudioTimelineManifest{
		ID:          "manifest_canonical_108",
		Title:       "Akasha Spanda • 108 Sacred Harmonic Cycle",
		Description: "A long-form sacred geometry meditation video combining Toroidal Singularity harmonics with Vedic Āmra Rūpa prānic fruition.",
		Tags:        []string{"SacredGeometry", "Toroid", "AmraRupa", "Meditation", "Solfeggio", "432Hz"},
	}
	canonical.EnsureDefaults()
	canonical.PatternLoop.BaseCycleSec = 108.0
	canonical.PatternLoop.RepeatCount = 8 // ~14.4 minutes
	canonical.PatternLoop.OctaveModulation = true
	canonical.PatternLoop.HueShiftDegPerCycle = 15.0
	h.manifests[canonical.ID] = canonical

	return h
}

// ListManifestsHandler returns all saved studio manifests.
func (h *Handler) ListManifestsHandler(w http.ResponseWriter, r *http.Request) {
	h.manifestsMu.RLock()
	defer h.manifestsMu.RUnlock()

	list := make([]*StudioTimelineManifest, 0, len(h.manifests))
	for _, m := range h.manifests {
		list = append(list, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"total":     len(list),
		"manifests": list,
	})
}

// SaveManifestHandler parses and persists a timeline manifest.
func (h *Handler) SaveManifestHandler(w http.ResponseWriter, r *http.Request) {
	var m StudioTimelineManifest
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		http.Error(w, `{"error":"invalid manifest JSON"}`, http.StatusBadRequest)
		return
	}
	m.EnsureDefaults()

	h.manifestsMu.Lock()
	h.manifests[m.ID] = &m
	h.manifestsMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success":  true,
		"manifest": m,
	})
}

// LiveStreamHandler connects the client to the live ephemeral preview stream without YouTube commitment.
func (h *Handler) LiveStreamHandler(w http.ResponseWriter, r *http.Request) {
	manifestID := r.URL.Query().Get("manifest_id")

	h.streamer.StreamHandler(w, r, func() *StudioTimelineManifest {
		h.manifestsMu.RLock()
		defer h.manifestsMu.RUnlock()
		if manifestID != "" {
			if m, exists := h.manifests[manifestID]; exists {
				return m
			}
		}
		// Return canonical or first manifest
		for _, m := range h.manifests {
			return m
		}
		def := &StudioTimelineManifest{}
		def.EnsureDefaults()
		return def
	})
}

// LaunchRenderJobHandler triggers a headless background video encoding pipeline.
func (h *Handler) LaunchRenderJobHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ManifestID string                  `json:"manifest_id"`
		Manifest   *StudioTimelineManifest `json:"manifest,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	var targetManifest *StudioTimelineManifest
	if req.Manifest != nil {
		req.Manifest.EnsureDefaults()
		targetManifest = req.Manifest
	} else if req.ManifestID != "" {
		h.manifestsMu.RLock()
		m, exists := h.manifests[req.ManifestID]
		h.manifestsMu.RUnlock()
		if !exists {
			http.Error(w, `{"error":"manifest not found"}`, http.StatusNotFound)
			return
		}
		targetManifest = m
	} else {
		http.Error(w, `{"error":"either manifest_id or manifest is required"}`, http.StatusBadRequest)
		return
	}

	job, err := h.renderer.LaunchJob(r.Context(), targetManifest)
	if err != nil {
		http.Error(w, `{"error":"failed to launch render job"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]any{
		"job": job,
	})
}

// ListRenderJobsHandler returns all render jobs.
func (h *Handler) ListRenderJobsHandler(w http.ResponseWriter, r *http.Request) {
	jobs := h.renderer.ListJobs()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"total": len(jobs),
		"jobs":  jobs,
	})
}

// GetRenderJobHandler returns details for a specific job.
func (h *Handler) GetRenderJobHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	jobID := ""
	if len(parts) >= 5 {
		jobID = parts[4]
	}

	job, exists := h.renderer.GetJob(jobID)
	if !exists {
		http.Error(w, `{"error":"job not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"job": job,
	})
}

// DispatchToYouTubeHandler pushes a completed render artifact to YouTube.
func (h *Handler) DispatchToYouTubeHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		JobID         string `json:"job_id"`
		PrivacyStatus string `json:"privacy_status"`
		CategoryID    string `json:"category_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	job, exists := h.renderer.GetJob(req.JobID)
	if !exists {
		http.Error(w, `{"error":"render job not found"}`, http.StatusNotFound)
		return
	}

	result, err := h.bridge.DispatchRenderJob(r.Context(), job, req.PrivacyStatus, req.CategoryID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"result":  result,
	})
}

// CatalogMediaHandler returns the indexed media library across renders, physical mastery, esoteric study, and vaults.
func (h *Handler) CatalogMediaHandler(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	items := h.mediaCDN.ScanDirectories()

	if category != "" {
		filtered := make([]*MediaItem, 0)
		for _, it := range items {
			if it.Category == category {
				filtered = append(filtered, it)
			}
		}
		items = filtered
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"total": len(items),
		"media": items,
	})
}

// StreamVideoHandler streams video using HTTP 206 Partial Content byte ranges for zero-stutter scrubbing.
func (h *Handler) StreamVideoHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	mediaID := ""
	if len(parts) >= 6 {
		mediaID = parts[5]
	} else if idQuery := r.URL.Query().Get("id"); idQuery != "" {
		mediaID = idQuery
	}

	if mediaID == "" {
		http.Error(w, `{"error":"media ID required"}`, http.StatusBadRequest)
		return
	}

	item, exists := h.mediaCDN.GetItem(mediaID)
	if !exists {
		http.Error(w, `{"error":"media file not found"}`, http.StatusNotFound)
		return
	}

	// Verify file exists on disk
	fInfo, err := os.Stat(item.Path)
	if err != nil || fInfo.IsDir() {
		http.Error(w, `{"error":"media file inaccessible"}`, http.StatusNotFound)
		return
	}

	// Set content headers
	switch item.Format {
	case "mp4":
		w.Header().Set("Content-Type", "video/mp4")
	case "webm":
		w.Header().Set("Content-Type", "video/webm")
	case "mkv":
		w.Header().Set("Content-Type", "video/x-matroska")
	case "mov":
		w.Header().Set("Content-Type", "video/quicktime")
	}

	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "public, max-age=3600")

	// Standard library ServeFile natively implements RFC 7233 range requests
	http.ServeFile(w, r, item.Path)
}

// GetRenderer returns the underlying HeadlessRenderer.
func (h *Handler) GetRenderer() *HeadlessRenderer { return h.renderer }

// GetBridge returns the underlying YouTubeBridge.
func (h *Handler) GetBridge() *YouTubeBridge { return h.bridge }

// GetMediaCDN returns the underlying LocalMediaCDN.
func (h *Handler) GetMediaCDN() *LocalMediaCDN { return h.mediaCDN }
