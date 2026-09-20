package api_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/echosh-labs/amra-treasury/internal/api"
	"github.com/echosh-labs/amra-treasury/internal/config"
	"github.com/echosh-labs/amra-treasury/internal/db"
)

func setupTestServer(t *testing.T) (*httptest.Server, db.StorageEngine, func()) {
	t.Helper()
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_treasury.db")

	store, err := db.Open(dbPath)
	if err != nil {
		t.Fatalf("failed to open test store: %v", err)
	}

	_ = db.SeedEsotericContent(store)

	cfg := &config.Config{
		Port:                "8050",
		BoltDBPath:          dbPath,
		ServiceName:         "amra-treasury-test",
		Environment:         "test",
		YouTubeClientID:     "mock_client_id",
		YouTubeClientSecret: "mock_client_secret",
		YouTubeRedirectURL:  "http://localhost:8050/api/v1/youtube/auth/callback",
	}

	handler := api.NewHandler(cfg, store)
	mux := http.NewServeMux()
	api.RegisterRoutes(mux, handler)

	ts := httptest.NewServer(mux)

	cleanup := func() {
		ts.Close()
		_ = store.Close()
		_ = os.RemoveAll(tmpDir)
	}

	return ts, store, cleanup
}

func TestHealthzAndTelemetry(t *testing.T) {
	ts, _, cleanup := setupTestServer(t)
	defer cleanup()

	// 1. Healthz
	resp, err := http.Get(ts.URL + "/healthz")
	if err != nil {
		t.Fatalf("healthz request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var health map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		t.Fatalf("failed to decode healthz response: %v", err)
	}
	if health["status"] != "ok" || health["port"] != "8050" {
		t.Errorf("unexpected healthz payload: %v", health)
	}

	// 2. Telemetry
	tResp, err := http.Get(ts.URL + "/api/telemetry")
	if err != nil {
		t.Fatalf("telemetry request failed: %v", err)
	}
	defer tResp.Body.Close()

	if tResp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", tResp.StatusCode)
	}
}

func TestAMRA_Endpoints(t *testing.T) {
	ts, _, cleanup := setupTestServer(t)
	defer cleanup()

	// 1. Plans
	resp, err := http.Get(ts.URL + "/api/v1/amra/plans")
	if err != nil {
		t.Fatalf("plans request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// 2. Metrics
	resp, err = http.Get(ts.URL + "/api/v1/amra/metrics")
	if err != nil {
		t.Fatalf("metrics request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// 3. Ledger
	resp, err = http.Get(ts.URL + "/api/v1/amra/ledger")
	if err != nil {
		t.Fatalf("ledger request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// 4. Geometry
	resp, err = http.Get(ts.URL + "/api/v1/amra/geometry")
	if err != nil {
		t.Fatalf("geometry request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// 5. Toroid Geometry
	resp, err = http.Get(ts.URL + "/api/v1/amra/geometry/toroid?lines=72&miss=6.5")
	if err != nil {
		t.Fatalf("toroid geometry request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// 6. Artwork Catalog
	resp, err = http.Get(ts.URL + "/api/v1/amra/artwork")
	if err != nil {
		t.Fatalf("artwork catalog request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
}

func TestYouTube_Endpoints(t *testing.T) {
	ts, _, cleanup := setupTestServer(t)
	defer cleanup()

	// 1. Status
	resp, err := http.Get(ts.URL + "/api/v1/youtube/status")
	if err != nil {
		t.Fatalf("youtube status failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// 2. Auth URL
	resp, err = http.Get(ts.URL + "/api/v1/youtube/auth/url")
	if err != nil {
		t.Fatalf("youtube auth url failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// 3. Jobs list
	resp, err = http.Get(ts.URL + "/api/v1/youtube/jobs")
	if err != nil {
		t.Fatalf("youtube jobs failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}
}

func TestEsoteric_Endpoints(t *testing.T) {
	ts, _, cleanup := setupTestServer(t)
	defer cleanup()

	// 1. Arishadvarga
	resp, err := http.Get(ts.URL + "/api/v1/esoteric/arishadvarga")
	if err != nil {
		t.Fatalf("arishadvarga request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var data map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if data["count"].(float64) < 6 {
		t.Errorf("expected at least 6 demons, got %v", data["count"])
	}
}
