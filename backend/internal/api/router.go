package api

import (
	"log"
	"net/http"
	"time"
)

// LoggingMiddleware logs request methods, paths, and response latency.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		// Avoid logging noisy health checks
		if r.URL.Path != "/healthz" {
			log.Printf("%s %s in %v", r.Method, r.URL.Path, time.Since(start))
		}
	})
}

// CORSMiddleware provides permissive cross-origin support for ecosystem microservices.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RegisterRoutes registers all AMRA, YouTube, and Esoteric endpoints on the provided router.
func RegisterRoutes(mux *http.ServeMux, handler *Handler) {
	// System Liveness & Telemetry
	mux.HandleFunc("GET /healthz", handler.HealthzHandler)
	mux.HandleFunc("GET /api/telemetry", handler.TelemetryHandler)
	mux.HandleFunc("GET /api/v1/routes", handler.RoutesCatalogHandler)
	mux.HandleFunc("GET /api/v1/system/routes", handler.RoutesCatalogHandler)

	// YouTube Sovereign Studio Endpoints
	mux.HandleFunc("GET /api/v1/youtube/status", handler.YouTubeStatusHandler)
	mux.HandleFunc("GET /api/v1/youtube/auth/url", handler.YouTubeAuthURLHandler)
	mux.HandleFunc("GET /api/v1/youtube/auth/callback", handler.YouTubeAuthCallbackHandler)
	mux.HandleFunc("POST /api/v1/youtube/auth/disconnect", handler.YouTubeDisconnectHandler)
	mux.HandleFunc("POST /api/v1/youtube/upload", handler.YouTubeUploadHandler)
	mux.HandleFunc("GET /api/v1/youtube/jobs", handler.YouTubeJobsHandler)
	mux.HandleFunc("GET /api/v1/youtube/jobs/{id...}", handler.YouTubeJobDetailHandler)
	mux.HandleFunc("POST /api/v1/youtube/jobs/{id...}", handler.YouTubeJobDetailHandler)
	mux.HandleFunc("GET /api/v1/youtube/videos", handler.YouTubeVideosHandler)
	mux.HandleFunc("GET /api/v1/youtube/analytics", handler.YouTubeAnalyticsHandler)
	mux.HandleFunc("GET /api/v1/youtube/finance", handler.YouTubeFinanceHandler)
	mux.HandleFunc("POST /api/v1/youtube/finance/sync-amra", handler.YouTubeSyncAmraHandler)

	// AMRA Sovereign Treasury Endpoints
	mux.HandleFunc("GET /api/v1/amra/plans", handler.amraHandler.ListPlansHandler)
	mux.HandleFunc("POST /api/v1/amra/checkout", handler.amraHandler.CheckoutHandler)
	mux.HandleFunc("POST /api/v1/amra/webhook/{provider}", handler.amraHandler.WebhookHandler)
	mux.HandleFunc("GET /api/v1/amra/subscriptions/{id}", handler.amraHandler.GetSubscriptionHandler)
	mux.HandleFunc("GET /api/v1/amra/ledger", handler.amraHandler.LedgerHandler)
	mux.HandleFunc("GET /api/v1/amra/metrics", handler.amraHandler.MetricsHandler)
	mux.HandleFunc("GET /api/v1/amra/geometry", handler.amraHandler.GeometryHandler)
	mux.HandleFunc("POST /api/v1/amra/geometry", handler.amraHandler.GeometryHandler)
	mux.HandleFunc("GET /api/v1/amra/geometry/toroid", handler.amraHandler.ToroidGeometryHandler)
	mux.HandleFunc("POST /api/v1/amra/geometry/toroid", handler.amraHandler.ToroidGeometryHandler)
	mux.HandleFunc("GET /api/v1/amra/geometry/toroid/stream", handler.amraHandler.ToroidStreamHandler)
	mux.HandleFunc("GET /api/v1/amra/artwork", handler.amraHandler.ArtworkCatalogHandler)
	mux.HandleFunc("POST /api/v1/amra/artwork", handler.amraHandler.ArtworkCatalogHandler)
	mux.HandleFunc("GET /api/v1/amra/gcloud/status", handler.amraHandler.GCloudStatusHandler)
	mux.HandleFunc("GET /api/v1/amra/gcloud/billing", handler.amraHandler.GCloudBillingHandler)
	mux.HandleFunc("POST /api/v1/amra/gcloud/sync-ledger", handler.amraHandler.GCloudSyncLedgerHandler)

	// Creative Studio & Video Pipeline Endpoints
	mux.HandleFunc("GET /api/v1/studio/manifests", handler.studioHandler.ListManifestsHandler)
	mux.HandleFunc("POST /api/v1/studio/manifests", handler.studioHandler.SaveManifestHandler)
	mux.HandleFunc("GET /api/v1/studio/stream", handler.studioHandler.LiveStreamHandler)
	mux.HandleFunc("POST /api/v1/studio/render", handler.studioHandler.LaunchRenderJobHandler)
	mux.HandleFunc("GET /api/v1/studio/jobs", handler.studioHandler.ListRenderJobsHandler)
	mux.HandleFunc("GET /api/v1/studio/jobs/{id...}", handler.studioHandler.GetRenderJobHandler)
	mux.HandleFunc("POST /api/v1/studio/dispatch", handler.studioHandler.DispatchToYouTubeHandler)

	// Sovereign Local Media CDN & Video Playback Endpoints
	mux.HandleFunc("GET /api/v1/studio/media/catalog", handler.studioHandler.CatalogMediaHandler)
	mux.HandleFunc("GET /api/v1/studio/media/stream/{id...}", handler.studioHandler.StreamVideoHandler)

	// Esoteric Document Catalog Endpoints
	mux.HandleFunc("GET /api/v1/esoteric", handler.GetEsotericCatalogHandler)
	mux.HandleFunc("GET /api/v1/esoteric/arishadvarga", handler.GetArishadvargaHandler)
	mux.HandleFunc("GET /api/v1/esoteric/{key...}", handler.GetEsotericDocHandler)
}
