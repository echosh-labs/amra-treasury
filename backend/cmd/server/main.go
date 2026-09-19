package main

import (
	"context"
	"embed"
	"errors"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/echosh-labs/amra-treasury/internal/api"
	"github.com/echosh-labs/amra-treasury/internal/config"
	"github.com/echosh-labs/amra-treasury/internal/db"
	"github.com/echosh-labs/amra-treasury/internal/portutil"
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

	// 2. Initialize API Router
	apiHandler := api.NewHandler(cfg, store)
	rootMux := http.NewServeMux()
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

			// If HTML version exists (e.g. /treasury -> treasury.html)
			if f, err := subFS.Open(path + ".html"); err == nil {
				_ = f.Close()
				r.URL.Path = "/" + path + ".html"
				fileServer.ServeHTTP(w, r)
				return
			}

			// SPA Fallback: serve index.html for unrecognized routes
			if f, err := subFS.Open("index.html"); err == nil {
				_ = f.Close()
				r.URL.Path = "/index.html"
				fileServer.ServeHTTP(w, r)
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
