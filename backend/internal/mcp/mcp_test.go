package mcp_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/echosh-labs/amra-treasury/internal/amra"
	"github.com/echosh-labs/amra-treasury/internal/api"
	"github.com/echosh-labs/amra-treasury/internal/config"
	"github.com/echosh-labs/amra-treasury/internal/db"
	"github.com/echosh-labs/amra-treasury/internal/mcp"
	"github.com/echosh-labs/amra-treasury/internal/youtube"
)

func setupTestMCPServer(t *testing.T) (*mcp.Server, *mcp.Handler, func()) {
	t.Helper()
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_mcp.db")

	store, err := db.Open(dbPath)
	if err != nil {
		t.Fatalf("failed to open test store: %v", err)
	}

	_ = db.SeedEsotericContent(store)

	cfg := &config.Config{
		Port:        "8050",
		BoltDBPath:  dbPath,
		ServiceName: "amra-treasury-mcp-test",
		Environment: "test",
	}

	apiH := api.NewHandler(cfg, store)
	mockProvider := amra.NewMockPaymentProvider("mcp_test_secret")
	engine := amra.NewEngine(store, mockProvider)
	ytSecrets := youtube.NewEnvSecretProvider("mock_client_id", "mock_client_secret", "http://localhost:8050/callback")
	ytClient := youtube.NewClient(ytSecrets, store, nil)

	handler := mcp.NewHandler(apiH, store, cfg, engine, ytClient)
	srv := mcp.NewServer(handler, "")

	cleanup := func() {
		_ = store.Close()
		_ = os.RemoveAll(tmpDir)
	}

	return srv, handler, cleanup
}

func TestMCP_Initialize(t *testing.T) {
	_, handler, cleanup := setupTestMCPServer(t)
	defer cleanup()

	req := mcp.Request{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "initialize",
	}
	raw, _ := json.Marshal(req)

	resp := handler.HandleRequest(context.Background(), raw)
	if resp == nil {
		t.Fatal("expected non-nil response for initialize")
	}
	if resp.Error != nil {
		t.Fatalf("unexpected error: %v", resp.Error)
	}

	resMap, ok := resp.Result.(map[string]any)
	if !ok {
		t.Fatalf("expected map result, got %T", resp.Result)
	}
	if resMap["protocolVersion"] != mcp.ProtocolVersion {
		t.Errorf("expected protocolVersion %s, got %v", mcp.ProtocolVersion, resMap["protocolVersion"])
	}
}

func TestMCP_ResourcesListAndRead(t *testing.T) {
	_, handler, cleanup := setupTestMCPServer(t)
	defer cleanup()

	// 1. resources/list
	listReq, _ := json.Marshal(mcp.Request{JSONRPC: "2.0", ID: 2, Method: "resources/list"})
	listResp := handler.HandleRequest(context.Background(), listReq)
	if listResp.Error != nil {
		t.Fatalf("resources/list error: %v", listResp.Error)
	}

	resMap := listResp.Result.(map[string]any)
	resources := resMap["resources"].([]mcp.Resource)
	if len(resources) < 5 {
		t.Errorf("expected at least 5 resources, got %d", len(resources))
	}

	// 2. resources/read amra://metrics
	readReq, _ := json.Marshal(mcp.Request{
		JSONRPC: "2.0",
		ID:      3,
		Method:  "resources/read",
		Params:  map[string]any{"uri": "amra://metrics"},
	})
	readResp := handler.HandleRequest(context.Background(), readReq)
	if readResp.Error != nil {
		t.Fatalf("resources/read error: %v", readResp.Error)
	}

	readMap := readResp.Result.(map[string]any)
	contents := readMap["contents"].([]mcp.ResourceContent)
	if len(contents) != 1 || contents[0].URI != "amra://metrics" {
		t.Fatalf("unexpected contents: %v", contents)
	}
}

func TestMCP_ToolsListAndCall(t *testing.T) {
	_, handler, cleanup := setupTestMCPServer(t)
	defer cleanup()

	// 1. tools/list
	listReq, _ := json.Marshal(mcp.Request{JSONRPC: "2.0", ID: 4, Method: "tools/list"})
	listResp := handler.HandleRequest(context.Background(), listReq)
	if listResp.Error != nil {
		t.Fatalf("tools/list error: %v", listResp.Error)
	}

	resMap := listResp.Result.(map[string]any)
	tools := resMap["tools"].([]mcp.Tool)
	if len(tools) < 5 {
		t.Errorf("expected at least 5 tools, got %d", len(tools))
	}

	// 2. tools/call amra_calculate_geometry
	callReq, _ := json.Marshal(mcp.Request{
		JSONRPC: "2.0",
		ID:      5,
		Method:  "tools/call",
		Params: map[string]any{
			"name": "amra_calculate_geometry",
			"arguments": map[string]any{
				"rx":             130.0,
				"ry":             180.0,
				"shadow_tension": 0.5,
			},
		},
	})
	callResp := handler.HandleRequest(context.Background(), callReq)
	if callResp.Error != nil {
		t.Fatalf("tools/call error: %v", callResp.Error)
	}

	callMap := callResp.Result.(map[string]any)
	content := callMap["content"].([]mcp.ToolContent)
	if len(content) == 0 {
		t.Fatal("expected tool output content")
	}
	if !bytes.Contains([]byte(content[0].Text), []byte("svg_path")) {
		t.Errorf("expected svg_path in geometry tool output: %s", content[0].Text)
	}

	// 3. tools/call amra_generate_toroid_geometry
	toroidReq, _ := json.Marshal(map[string]any{
		"jsonrpc": "2.0",
		"id":      3,
		"method":  "tools/call",
		"params": map[string]any{
			"name": "amra_generate_toroid_geometry",
			"arguments": map[string]any{
				"line_count":  108,
				"miss_margin": 7.5,
				"mode":        "discrete_rings",
			},
		},
	})
	toroidResp := handler.HandleRequest(context.Background(), toroidReq)
	if toroidResp.Error != nil {
		t.Fatalf("toroid tools/call error: %v", toroidResp.Error)
	}
	toroidMap := toroidResp.Result.(map[string]any)
	toroidContent := toroidMap["content"].([]mcp.ToolContent)
	if len(toroidContent) == 0 {
		t.Fatal("expected toroid tool output content")
	}
	if !bytes.Contains([]byte(toroidContent[0].Text), []byte("inner_hole_radius")) {
		t.Errorf("expected inner_hole_radius in toroid output: %s", toroidContent[0].Text)
	}
}

func TestMCP_HTTPServer(t *testing.T) {
	srv, _, cleanup := setupTestMCPServer(t)
	defer cleanup()

	mux := http.NewServeMux()
	srv.RegisterRoutes(mux)
	ts := httptest.NewServer(mux)
	defer ts.Close()

	// 1. GET /mcp
	getResp, err := http.Get(ts.URL + "/mcp")
	if err != nil {
		t.Fatalf("GET /mcp failed: %v", err)
	}
	defer getResp.Body.Close()
	if getResp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", getResp.StatusCode)
	}

	// 2. POST /mcp (JSON-RPC initialize)
	body, _ := json.Marshal(mcp.Request{JSONRPC: "2.0", ID: 10, Method: "initialize"})
	postResp, err := http.Post(ts.URL+"/mcp", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST /mcp failed: %v", err)
	}
	defer postResp.Body.Close()

	if postResp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", postResp.StatusCode)
	}

	var rpcResp mcp.Response
	if err := json.NewDecoder(postResp.Body).Decode(&rpcResp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if rpcResp.Error != nil {
		t.Errorf("unexpected error: %v", rpcResp.Error)
	}
}
