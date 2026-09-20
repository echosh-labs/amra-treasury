package studio

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	"image/jpeg"
	"log"
	"net/http"
	"strconv"
	"time"
)

// LiveStreamer coordinates ephemeral live preview streaming without disk or YouTube commitment.
type LiveStreamer struct {
	compiler *TimelineCompiler
}

// NewLiveStreamer instantiates the live streamer.
func NewLiveStreamer() *LiveStreamer {
	return &LiveStreamer{
		compiler: NewTimelineCompiler(),
	}
}

// StreamHandler handles ephemeral preview streams over HTTP.
// Supports format=mjpeg for direct video/image tag rendering, or format=events (default) for SSE telemetry.
func (s *LiveStreamer) StreamHandler(w http.ResponseWriter, r *http.Request, getManifest func() *StudioTimelineManifest) {
	manifest := getManifest()
	if manifest == nil {
		m := &StudioTimelineManifest{}
		m.EnsureDefaults()
		manifest = m
	}

	format := r.URL.Query().Get("format")
	fps := 30
	if fStr := r.URL.Query().Get("fps"); fStr != "" {
		if f, err := strconv.Atoi(fStr); err == nil && f > 0 && f <= 60 {
			fps = f
		}
	}

	speed := 1.0
	if sStr := r.URL.Query().Get("speed"); sStr != "" {
		if sp, err := strconv.ParseFloat(sStr, 64); err == nil && sp > 0 {
			speed = sp
		}
	}

	ctx := r.Context()

	if format == "mjpeg" {
		s.streamMJPEG(ctx, w, manifest, fps, speed)
		return
	}

	// Default: SSE Event Stream (format=events)
	s.streamEvents(ctx, w, manifest, fps, speed)
}

// streamEvents streams high-frequency compiled frame vectors over Server-Sent Events.
func (s *LiveStreamer) streamEvents(ctx context.Context, w http.ResponseWriter, m *StudioTimelineManifest, fps int, speed float64) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	interval := time.Duration(1000/fps) * time.Millisecond
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	startTime := time.Now()

	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			elapsedSec := now.Sub(startTime).Seconds() * speed
			frame := s.compiler.Evaluate(m, elapsedSec)

			data, err := json.Marshal(frame)
			if err != nil {
				continue
			}

			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

// streamMJPEG generates lightweight in-memory visual frames streamed as multipart/x-mixed-replace.
func (s *LiveStreamer) streamMJPEG(ctx context.Context, w http.ResponseWriter, m *StudioTimelineManifest, fps int, speed float64) {
	w.Header().Set("Content-Type", "multipart/x-mixed-replace; boundary=frame")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "close")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	interval := time.Duration(1000/fps) * time.Millisecond
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	startTime := time.Now()

	// Lightweight preview buffer: 480x270 for ultra-fast in-memory encoding
	const (
		wPx = 480
		hPx = 270
	)

	jpegOpt := &jpeg.Options{Quality: 65}
	buf := new(bytes.Buffer)

	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			elapsedSec := now.Sub(startTime).Seconds() * speed
			frame := s.compiler.Evaluate(m, elapsedSec)

			img := s.renderPreviewFrame(wPx, hPx, frame)

			buf.Reset()
			if err := jpeg.Encode(buf, img, jpegOpt); err != nil {
				log.Printf("LiveStreamer JPEG encode error: %v", err)
				continue
			}

			fmt.Fprintf(w, "--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %d\r\n\r\n", buf.Len())
			w.Write(buf.Bytes())
			fmt.Fprintf(w, "\r\n")
			flusher.Flush()
		}
	}
}

// renderPreviewFrame generates a high-fidelity raster preview image representing the composited state.
func (s *LiveStreamer) renderPreviewFrame(w, h int, frame *CompiledFrameState) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	RenderFrameRGBA(img, w, h, frame)
	return img
}
