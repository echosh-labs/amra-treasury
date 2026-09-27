package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/echosh-labs/amra-treasury/internal/amra"
	"github.com/echosh-labs/amra-treasury/internal/api"
	"github.com/echosh-labs/amra-treasury/internal/config"
	"github.com/echosh-labs/amra-treasury/internal/db"
	"github.com/echosh-labs/amra-treasury/internal/mcp"
	"github.com/echosh-labs/amra-treasury/internal/portutil"
	"github.com/echosh-labs/amra-treasury/internal/youtube"
)

//go:embed all:frontend_out/*
var frontendFS embed.FS

func main() {
	cfg := config.Load()
	log.Printf("══════════════════════════════════════════════════════════════════")
	log.Printf("🏛️ Starting [%s] on port %s in %s mode...", cfg.ServiceName, cfg.Port, cfg.Environment)
	log.Printf("══════════════════════════════════════════════════════════════════")

	// 0. Ensure port availability / remedy contentious process at startup
	if err := portutil.ClearPortIfContentious(cfg.Port); err != nil {
		log.Printf("⚠️ Warning: port contentious remediation: %v", err)
	}

	// 1. Initialize BoltDB
	store, err := db.Open(cfg.BoltDBPath)
	if err != nil {
		log.Fatalf("Fatal: could not open BoltDB at %s: %v", cfg.BoltDBPath, err)
	}
	defer func() {
		log.Println("Closing BoltDB connection...")
		if err := store.Close(); err != nil {
			log.Printf("Error closing BoltDB: %v", err)
		}
	}()

	// 1b. Seed Canonical Esoteric Foundations (Arishadvarga, Āmra Philosophy, Transmutation Triad)
	if err := db.SeedEsotericContent(store); err != nil {
		log.Printf("Warning: failed to seed esoteric content: %v", err)
	}

	// 2. Initialize Engines & MCP Server
	apiHandler := api.NewHandler(cfg, store)

	ytSecrets := youtube.NewEnvSecretProvider(cfg.YouTubeClientID, cfg.YouTubeClientSecret, cfg.YouTubeRedirectURL)
	ytClient := youtube.NewClient(ytSecrets, store, nil)

	var paymentProviders []amra.PaymentProvider
	if cfg.StripeAPIKey != "" {
		paymentProviders = append(paymentProviders, amra.NewStripePaymentProvider(cfg.StripeAPIKey, cfg.StripeWebhookSecret))
	} else {
		paymentProviders = append(paymentProviders, amra.NewMockPaymentProvider("dev_mock_secret"))
	}
	amraEngine := amra.NewEngine(store, paymentProviders...)

	mcpHandler := mcp.NewHandler(apiHandler, store, cfg, amraEngine, ytClient)
	mcpServer := mcp.NewServer(mcpHandler, "")

	// Check if stdio MCP mode requested
	for _, arg := range os.Args[1:] {
		if arg == "--mcp" || arg == "-mcp" {
			log.Println("Starting AMRA Treasury in Stdio MCP mode...")
			if err := mcpServer.ServeStdio(os.Stdin, os.Stdout); err != nil {
				log.Fatalf("MCP Stdio server error: %v", err)
			}
			return
		}
	}

	rootMux := http.NewServeMux()
	mcpServer.RegisterRoutes(rootMux)
	api.RegisterRoutes(rootMux, apiHandler)

	// 3. Mount Embedded Next.js 15 Frontend Export
	var subFS fs.FS
	sub, err := fs.Sub(frontendFS, "frontend_out")
	if err == nil {
		subFS = sub
	}

	if subFS != nil {
		fileServer := http.FileServer(http.FS(subFS))
		rootMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// 1. Guard API and MCP namespaces: Unmatched API routes must return JSON 404
			if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/mcp") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusNotFound)
				_ = json.NewEncoder(w).Encode(map[string]any{
					"error":  "API route not found",
					"path":   r.URL.Path,
					"method": r.Method,
					"status": http.StatusNotFound,
				})
				return
			}

			path := strings.TrimPrefix(r.URL.Path, "/")
			if path == "" {
				path = "index.html"
			}

			// If file exists directly in embed, serve it
			if f, err := subFS.Open(path); err == nil {
				_ = f.Close()
				fileServer.ServeHTTP(w, r)
				return
			}

			// If HTML version exists (e.g. /treasury -> treasury.html), serve directly
			if htmlData, err := fs.ReadFile(subFS, path+".html"); err == nil {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(htmlData)
				return
			}

			// SPA Fallback: serve index.html directly with 200 OK (eliminating 301 redirect loops)
			if indexData, err := fs.ReadFile(subFS, "index.html"); err == nil {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(indexData)
				return
			}

			// Minimal fallback if frontend is not yet built
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`<!DOCTYPE html>
<html>
<head><title>AMRA Sovereign Treasury</title></head>
<body style="background:#090d16;color:#f1f5f9;font-family:sans-serif;padding:2rem;text-align:center;">
<h1>🏛️ AMRA Sovereign Treasury & Studio</h1>
<p>Service operational on port ` + cfg.Port + `. Frontend build pending.</p>
</body>
</html>`))
		})
	} else {
		// Fallback when subFS is nil: still guard API routes
		rootMux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"error":  "API route not found",
				"path":   r.URL.Path,
				"method": r.Method,
				"status": http.StatusNotFound,
			})
		})
	}

	// 4. Wrap with Middleware
	httpHandler := api.LoggingMiddleware(api.CORSMiddleware(rootMux))

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      httpHandler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// 5. Graceful Shutdown Coordinator
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("✔ AMRA Sovereign Treasury API listening at http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Fatal: server ListenAndServe error: %v", err)
		}
	}()

	<-stopChan
	log.Println("Shutting down AMRA Sovereign Treasury gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("Warning: server shutdown error: %v", err)
	}

	log.Println("✔ Sovereign Treasury shutdown complete.")
}
