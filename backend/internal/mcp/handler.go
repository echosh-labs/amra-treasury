package mcp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/echosh-labs/amra-treasury/internal/amra"
	"github.com/echosh-labs/amra-treasury/internal/api"
	"github.com/echosh-labs/amra-treasury/internal/config"
	"github.com/echosh-labs/amra-treasury/internal/db"
	"github.com/echosh-labs/amra-treasury/internal/youtube"
)

// Handler processes MCP protocol requests for AMRA Treasury & YouTube Studio.
type Handler struct {
	apiHandler *api.Handler
	store      db.StorageEngine
	cfg        *config.Config
	amraEngine *amra.Engine
	ytClient   *youtube.Client
}

// NewHandler creates a new AMRA Treasury MCP request handler.
func NewHandler(apiHandler *api.Handler, store db.StorageEngine, cfg *config.Config, amraEngine *amra.Engine, ytClient *youtube.Client) *Handler {
	return &Handler{
		apiHandler: apiHandler,
		store:      store,
		cfg:        cfg,
		amraEngine: amraEngine,
		ytClient:   ytClient,
	}
}

// HandleRequest parses and routes a raw JSON-RPC 2.0 MCP request.
func (h *Handler) HandleRequest(ctx context.Context, body []byte) *Response {
	var req Request
	if err := json.Unmarshal(body, &req); err != nil {
		return &Response{
			JSONRPC: "2.0",
			Error:   &Error{Code: ErrCodeParse, Message: "Parse error: " + err.Error()},
		}
	}

	if req.JSONRPC != "2.0" {
		return &Response{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &Error{Code: ErrCodeInvalidReq, Message: "Invalid Request: jsonrpc must be '2.0'"},
		}
	}

	// Notifications have no ID and expect no response
	isNotification := req.ID == nil

	switch req.Method {
	case "initialize":
		res := h.handleInitialize()
		return &Response{JSONRPC: "2.0", ID: req.ID, Result: res}

	case "notifications/initialized":
		return nil

	case "resources/list":
		res := h.handleResourcesList()
		return &Response{JSONRPC: "2.0", ID: req.ID, Result: res}

	case "resources/read":
		res, err := h.handleResourcesRead(ctx, req.Params)
		if err != nil {
			return &Response{JSONRPC: "2.0", ID: req.ID, Error: err}
		}
		return &Response{JSONRPC: "2.0", ID: req.ID, Result: res}

	case "tools/list":
		res := h.handleToolsList()
		return &Response{JSONRPC: "2.0", ID: req.ID, Result: res}

	case "tools/call":
		res, err := h.handleToolsCall(ctx, req.Params)
		if err != nil {
			return &Response{JSONRPC: "2.0", ID: req.ID, Error: err}
		}
		return &Response{JSONRPC: "2.0", ID: req.ID, Result: res}

	case "ping":
		return &Response{JSONRPC: "2.0", ID: req.ID, Result: map[string]string{}}

	default:
		if isNotification {
			return nil
		}
		return &Response{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &Error{Code: ErrCodeNoMethod, Message: fmt.Sprintf("Method not found: %s", req.Method)},
		}
	}
}

func (h *Handler) handleInitialize() map[string]any {
	return map[string]any{
		"protocolVersion": ProtocolVersion,
		"serverInfo": ServerInfo{
			Name:    "amra-treasury-mcp",
			Version: "1.0.0",
		},
		"capabilities": Capabilities{
			Resources: &ResourceCapability{ListChanged: true},
			Tools:     &ToolCapability{ListChanged: true},
		},
		"instructions": "AMRA Sovereign Treasury & YouTube Studio MCP Server. Exposes immutable financial ledger operations, SaaS subscription plans, YouTube studio and monetization feedback loops, and Vedic sacred geometry.",
	}
}

func (h *Handler) handleResourcesList() map[string]any {
	resources := []Resource{
		{
			URI:         "amra://metrics",
			Name:        "AMRA Unified Financial Metrics",
			Description: "Consolidated financial telemetry: active subscribers, SaaS MRR, YouTube 30-day accrued revenue, and gross ecosystem yield.",
			MimeType:    "application/json",
		},
		{
			URI:         "amra://ledger",
			Name:        "BoltDB Immutable Financial Ledger",
			Description: "Recent transactions from the sovereign financial audit ledger with SHA-256 idempotency proofs.",
			MimeType:    "application/json",
		},
		{
			URI:         "amra://plans",
			Name:        "AMRA Subscription Plans",
			Description: "Active SaaS billing plans (Sadhaka, Adept, Magus, Enterprise) and feature entitlements.",
			MimeType:    "application/json",
		},
		{
			URI:         "amra://gcloud/billing",
			Name:        "Google Cloud Infrastructure Burn Rate",
			Description: "Current month GCP consumption, itemized service spend, scale-to-zero status, and sovereign profit margin.",
			MimeType:    "application/json",
		},
		{
			URI:         "amra://geometry",
			Name:        "Vedic Parametric Mango Geometry",
			Description: "Mathematical parameters and SVG coordinates for the Kairi curve, 6 Arishadvarga demons, and Samudra Manthan alchemical ratio.",
			MimeType:    "application/json",
		},
		{
			URI:         "youtube://status",
			Name:        "YouTube Channel Status & Quota",
			Description: "Verified YouTube channel identity, OAuth2 token validity, and daily API quota tracker.",
			MimeType:    "application/json",
		},
		{
			URI:         "youtube://jobs",
			Name:        "YouTube Resumable Upload Jobs",
			Description: "Queue of recent chunked video upload jobs and progress statuses.",
			MimeType:    "application/json",
		},
	}
	return map[string]any{"resources": resources}
}

func (h *Handler) handleResourcesRead(ctx context.Context, params any) (map[string]any, *Error) {
	var p struct {
		URI string `json:"uri"`
	}
	if raw, err := json.Marshal(params); err == nil {
		_ = json.Unmarshal(raw, &p)
	}

	if p.URI == "" {
		return nil, &Error{Code: ErrCodeBadParams, Message: "Missing required 'uri' parameter"}
	}

	var text string

	switch p.URI {
	case "amra://metrics":
		metrics, err := h.amraEngine.GetFinancialMetrics(ctx)
		if err != nil {
			return nil, &Error{Code: ErrCodeInternal, Message: fmt.Sprintf("Failed to query metrics: %v", err)}
		}
		b, _ := json.MarshalIndent(metrics, "", "  ")
		text = string(b)

	case "amra://ledger":
		txs, err := h.amraEngine.ListLedgerTransactions(25)
		if err != nil {
			return nil, &Error{Code: ErrCodeInternal, Message: fmt.Sprintf("Failed to query ledger: %v", err)}
		}
		b, _ := json.MarshalIndent(map[string]any{"total": len(txs), "ledger": txs}, "", "  ")
		text = string(b)

	case "amra://plans":
		plans := h.amraEngine.ListPlans()
		b, _ := json.MarshalIndent(map[string]any{"total": len(plans), "plans": plans}, "", "  ")
		text = string(b)

	case "amra://gcloud/billing":
		billing, err := h.amraEngine.GetGCloudBilling(ctx)
		if err != nil {
			return nil, &Error{Code: ErrCodeInternal, Message: fmt.Sprintf("Failed to query gcloud billing: %v", err)}
		}
		b, _ := json.MarshalIndent(billing, "", "  ")
		text = string(b)

	case "amra://geometry":
		params := amra.DefaultKairiParams()
		demons, _ := h.amraEngine.GetArishadvargaDemons()
		phil, _ := h.amraEngine.GetAmraPhilosophy()
		triad, _ := h.amraEngine.GetTransmutationTriad()
		geo := amra.GenerateAmraGeometryWithContent(params, 0.4, 0.8, demons, phil, triad)
		b, _ := json.MarshalIndent(geo, "", "  ")
		text = string(b)

	case "youtube://status":
		status := h.ytClient.GetStatus(ctx)
		b, _ := json.MarshalIndent(status, "", "  ")
		text = string(b)

	case "youtube://jobs":
		jobs, err := h.ytClient.ListJobs(20)
		if err != nil {
			return nil, &Error{Code: ErrCodeInternal, Message: fmt.Sprintf("Failed to list upload jobs: %v", err)}
		}
		b, _ := json.MarshalIndent(map[string]any{"total": len(jobs), "jobs": jobs}, "", "  ")
		text = string(b)

	default:
		return nil, &Error{Code: ErrCodeBadParams, Message: fmt.Sprintf("Resource not found: %s", p.URI)}
	}

	return map[string]any{
		"contents": []ResourceContent{
			{
				URI:      p.URI,
				MimeType: "application/json",
				Text:     text,
			},
		},
	}, nil
}

func (h *Handler) handleToolsList() map[string]any {
	tools := []Tool{
		{
			Name:        "amra_get_financial_metrics",
			Description: "Retrieve consolidated ecosystem financial telemetry: active subscribers, monthly recurring SaaS revenue, YouTube 30-day accrued revenue, and gross ecosystem yield.",
			InputSchema: map[string]any{
				"type":       "object",
				"properties": map[string]any{},
			},
		},
		{
			Name:        "amra_query_ledger",
			Description: "Query recent transactions from the immutable BoltDB audit ledger with SHA-256 idempotency deduplication proofs.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"limit": map[string]any{
						"type":        "integer",
						"description": "Maximum number of transactions to return (default: 20)",
					},
				},
			},
		},
		{
			Name:        "amra_calculate_geometry",
			Description: "Compute parametric Mango/Kairi curve coordinates, 6 Arishadvarga demon vectors, and Samudra Manthan alchemical ratio with custom geometric parameters.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"rx":             map[string]any{"type": "number", "description": "Horizontal radius (default: 125.0)"},
					"ry":             map[string]any{"type": "number", "description": "Vertical radius (default: 175.0)"},
					"hook":           map[string]any{"type": "number", "description": "Crest hook deflection (default: 25.0)"},
					"shadow_tension": map[string]any{"type": "number", "description": "Asuric shadow tension ratio (0.0 to 1.0)"},
					"solar_fire":     map[string]any{"type": "number", "description": "Solar fire transmutation coefficient (0.0 to 1.0)"},
				},
			},
		},
		{
			Name:        "amra_sync_gcloud_expense",
			Description: "Commit the current month's Google Cloud infrastructure consumption into the immutable financial audit ledger.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"month": map[string]any{
						"type":        "string",
						"description": "Billing month formatted as YYYY-MM (defaults to current month)",
					},
				},
			},
		},
		{
			Name:        "youtube_get_status",
			Description: "Inspect YouTube channel identity, OAuth2 authentication validity, and daily API quota consumption.",
			InputSchema: map[string]any{
				"type":       "object",
				"properties": map[string]any{},
			},
		},
		{
			Name:        "youtube_get_monetization_report",
			Description: "Query YouTube Analytics v2 for daily revenue, playback CPM, monetized playbacks, and gross revenue.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"start_date": map[string]any{
						"type":        "string",
						"description": "Start date (YYYY-MM-DD). Defaults to 30 days ago.",
					},
					"end_date": map[string]any{
						"type":        "string",
						"description": "End date (YYYY-MM-DD). Defaults to today.",
					},
				},
			},
		},
		{
			Name:        "youtube_sync_revenue_to_amra",
			Description: "Ingest verified daily YouTube monetization records into the immutable AMRA audit ledger with SHA-256 deduplication.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"start_date": map[string]any{"type": "string", "description": "Start date (YYYY-MM-DD)"},
					"end_date":   map[string]any{"type": "string", "description": "End date (YYYY-MM-DD)"},
				},
			},
		},
		{
			Name:        "youtube_list_recent_videos",
			Description: "List recent uploaded videos on the authenticated channel.",
			InputSchema: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"limit": map[string]any{"type": "integer", "description": "Max videos to return (default: 20)"},
				},
			},
		},
		{
			Name:        "youtube_initiate_upload",
			Description: "Queue a video file for chunked resumable upload to YouTube with custom title, description, and privacy status.",
			InputSchema: map[string]any{
				"type": "object",
				"required": []string{"file_path", "title"},
				"properties": map[string]any{
					"file_path":      map[string]any{"type": "string", "description": "Absolute path to video file on disk"},
					"title":          map[string]any{"type": "string", "description": "Video title"},
					"description":    map[string]any{"type": "string", "description": "Video description"},
					"privacy_status": map[string]any{"type": "string", "description": "unlisted, private, or public (default: unlisted)"},
					"tags":           map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
				},
			},
		},
	}
	return map[string]any{"tools": tools}
}

func (h *Handler) handleToolsCall(ctx context.Context, params any) (map[string]any, *Error) {
	var p struct {
		Name      string         `json:"name"`
		Arguments map[string]any `json:"arguments"`
	}
	if raw, err := json.Marshal(params); err == nil {
		_ = json.Unmarshal(raw, &p)
	}

	if p.Name == "" {
		return nil, &Error{Code: ErrCodeBadParams, Message: "Missing required 'name' parameter"}
	}

	var result ToolResult

	switch p.Name {
	case "amra_get_financial_metrics":
		metrics, err := h.amraEngine.GetFinancialMetrics(ctx)
		if err != nil {
			result = ToolResult{
				IsError: true,
				Content: []ToolContent{{Type: "text", Text: fmt.Sprintf("Failed to get financial metrics: %v", err)}},
			}
		} else {
			b, _ := json.MarshalIndent(metrics, "", "  ")
			result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}
		}

	case "amra_query_ledger":
		limit := 20
		if l, ok := p.Arguments["limit"]; ok {
			if n, err := strconv.Atoi(fmt.Sprintf("%v", l)); err == nil && n > 0 {
				limit = n
			}
		}
		txs, err := h.amraEngine.ListLedgerTransactions(limit)
		if err != nil {
			result = ToolResult{
				IsError: true,
				Content: []ToolContent{{Type: "text", Text: fmt.Sprintf("Failed to query ledger: %v", err)}},
			}
		} else {
			b, _ := json.MarshalIndent(map[string]any{"count": len(txs), "ledger": txs}, "", "  ")
			result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}
		}

	case "amra_calculate_geometry":
		params := amra.DefaultKairiParams()
		shadowTension := 0.4
		solarFire := 0.8

		if v, ok := p.Arguments["rx"].(float64); ok && v > 0 {
			params.Rx = v
		}
		if v, ok := p.Arguments["ry"].(float64); ok && v > 0 {
			params.Ry = v
		}
		if v, ok := p.Arguments["hook"].(float64); ok && v > 0 {
			params.Gamma = v
		}
		if v, ok := p.Arguments["shadow_tension"].(float64); ok && v >= 0 {
			shadowTension = v
		}
		if v, ok := p.Arguments["solar_fire"].(float64); ok && v >= 0 {
			solarFire = v
		}

		demons, _ := h.amraEngine.GetArishadvargaDemons()
		phil, _ := h.amraEngine.GetAmraPhilosophy()
		triad, _ := h.amraEngine.GetTransmutationTriad()
		geo := amra.GenerateAmraGeometryWithContent(params, shadowTension, solarFire, demons, phil, triad)
		b, _ := json.MarshalIndent(geo, "", "  ")
		result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}

	case "amra_sync_gcloud_expense":
		month, _ := p.Arguments["month"].(string)
		tx, err := h.amraEngine.SyncGCloudExpenseToLedger(ctx, month)
		if err != nil {
			result = ToolResult{
				IsError: true,
				Content: []ToolContent{{Type: "text", Text: fmt.Sprintf("Failed to sync gcloud expense: %v", err)}},
			}
		} else {
			b, _ := json.MarshalIndent(map[string]any{"status": "synced", "transaction": tx}, "", "  ")
			result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}
		}

	case "youtube_get_status":
		status := h.ytClient.GetStatus(ctx)
		b, _ := json.MarshalIndent(status, "", "  ")
		result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}

	case "youtube_get_monetization_report":
		if !h.ytClient.IsAuthenticated() {
			result = ToolResult{
				IsError: true,
				Content: []ToolContent{{Type: "text", Text: "YouTube client is not authenticated"}},
			}
		} else {
			startDate, _ := p.Arguments["start_date"].(string)
			endDate, _ := p.Arguments["end_date"].(string)
			rep, err := h.ytClient.GetFinancialReport(ctx, startDate, endDate)
			if err != nil {
				result = ToolResult{
					IsError: true,
					Content: []ToolContent{{Type: "text", Text: fmt.Sprintf("Failed to get monetization report: %v", err)}},
				}
			} else {
				b, _ := json.MarshalIndent(rep, "", "  ")
				result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}
			}
		}

	case "youtube_sync_revenue_to_amra":
		if !h.ytClient.IsAuthenticated() {
			result = ToolResult{
				IsError: true,
				Content: []ToolContent{{Type: "text", Text: "YouTube client is not authenticated"}},
			}
		} else {
			startDate, _ := p.Arguments["start_date"].(string)
			endDate, _ := p.Arguments["end_date"].(string)
			rep, err := h.ytClient.GetFinancialReport(ctx, startDate, endDate)
			if err != nil {
				result = ToolResult{
					IsError: true,
					Content: []ToolContent{{Type: "text", Text: fmt.Sprintf("Failed to query YouTube report: %v", err)}},
				}
			} else {
				ch, _ := h.ytClient.GetChannelProfile(ctx)
				channelID := "unknown"
				if ch != nil {
					channelID = ch.ChannelID
				}
				synced := 0
				skipped := 0
				var totalDollars float64
				for _, row := range rep.DailyRows {
					if row.EstimatedRevenue <= 0 {
						continue
					}
					_, err := h.amraEngine.IngestYouTubeRevenue(ctx, amra.YouTubeRevenueRecord{
						Day:              row.Day,
						EstimatedRevenue: row.EstimatedRevenue,
						MonetizedPlays:   row.MonetizedPlaybacks,
						CPM:              row.CPM,
						ChannelID:        channelID,
					})
					if err != nil {
						if errors.Is(err, amra.ErrDuplicateEvent) {
							skipped++
							continue
						}
						log.Printf("[MCP] Failed to ledger YouTube row %s: %v", row.Day, err)
						continue
					}
					synced++
					totalDollars += row.EstimatedRevenue
				}
				resPayload := map[string]any{
					"status":        "synced",
					"synced_count":  synced,
					"skipped_count": skipped,
					"total_dollars": totalDollars,
					"channel_id":    channelID,
				}
				b, _ := json.MarshalIndent(resPayload, "", "  ")
				result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}
			}
		}

	case "youtube_list_recent_videos":
		if !h.ytClient.IsAuthenticated() {
			result = ToolResult{
				IsError: true,
				Content: []ToolContent{{Type: "text", Text: "YouTube client is not authenticated"}},
			}
		} else {
			limit := int64(20)
			if l, ok := p.Arguments["limit"]; ok {
				if n, err := strconv.ParseInt(fmt.Sprintf("%v", l), 10, 64); err == nil && n > 0 {
					limit = n
				}
			}
			videos, err := h.ytClient.ListRecentVideos(ctx, limit)
			if err != nil {
				result = ToolResult{
					IsError: true,
					Content: []ToolContent{{Type: "text", Text: fmt.Sprintf("Failed to list videos: %v", err)}},
				}
			} else {
				b, _ := json.MarshalIndent(map[string]any{"total": len(videos), "videos": videos}, "", "  ")
				result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}
			}
		}

	case "youtube_initiate_upload":
		filePath, _ := p.Arguments["file_path"].(string)
		title, _ := p.Arguments["title"].(string)
		if strings.TrimSpace(filePath) == "" || strings.TrimSpace(title) == "" {
			result = ToolResult{
				IsError: true,
				Content: []ToolContent{{Type: "text", Text: "file_path and title are required"}},
			}
		} else {
			desc, _ := p.Arguments["description"].(string)
			privacy, _ := p.Arguments["privacy_status"].(string)
			var tags []string
			if rawTags, ok := p.Arguments["tags"].([]any); ok {
				for _, t := range rawTags {
					tags = append(tags, fmt.Sprintf("%v", t))
				}
			}
			job, err := h.ytClient.UploadVideo(ctx, youtube.UploadRequest{
				FilePath:            filePath,
				Title:               title,
				Description:         desc,
				PrivacyStatus:       privacy,
				Tags:                tags,
				AttachChronoContext: true,
			}, "mcp_client")
			if err != nil {
				result = ToolResult{
					IsError: true,
					Content: []ToolContent{{Type: "text", Text: fmt.Sprintf("Failed to queue upload: %v", err)}},
				}
			} else {
				b, _ := json.MarshalIndent(job, "", "  ")
				result = ToolResult{Content: []ToolContent{{Type: "text", Text: string(b)}}}
			}
		}

	default:
		return nil, &Error{Code: ErrCodeNoMethod, Message: fmt.Sprintf("Unknown tool: %s", p.Name)}
	}

	return map[string]any{
		"content": result.Content,
		"isError": result.IsError,
	}, nil
}
