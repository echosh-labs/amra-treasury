package studio

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"log"
	"math"
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

// renderPreviewFrame generates a fast raster preview image representing the composited state.
func (s *LiveStreamer) renderPreviewFrame(w, h int, frame *CompiledFrameState) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, w, h))

	// Background fill
	bgCol := color.RGBA{R: 2, G: 6, B: 23, A: 255} // Obsidian Void
	switch frame.BackdropStyle {
	case "cosmic_aurora":
		bgCol = color.RGBA{R: 22, G: 11, B: 42, A: 255}
	case "emerald_matrix":
		bgCol = color.RGBA{R: 4, G: 32, B: 24, A: 255}
	case "solar_corona":
		bgCol = color.RGBA{R: 40, G: 14, B: 0, A: 255}
	}
	draw.Draw(img, img.Bounds(), &image.Uniform{C: bgCol}, image.Point{}, draw.Src)

	centerX := float64(w) / 2
	centerY := float64(h) / 2
	radius := float64(h) * 0.38

	// Draw Toroidal Harmonics representation
	lines := 36
	for i := 0; i < lines; i++ {
		angle := (float64(i)/float64(lines))*2*math.Pi + frame.Phase*2*math.Pi
		cx := centerX + math.Cos(angle)*(radius*0.4)
		cy := centerY + math.Sin(angle)*(radius*0.25)
		ringR := radius * 0.55

		// Dynamic Hue
		hue := math.Mod(float64(i*10)+frame.HueOffset+frame.Phase*360.0, 360.0)
		r, g, b := hslToRgb(hue, 0.85, 0.55)
		strokeCol := color.RGBA{R: r, G: g, B: b, A: 160}

		drawCircleRing(img, int(cx), int(cy), int(ringR), strokeCol)
	}

	// Draw Center Black Hole Void
	drawFilledCircle(img, int(centerX), int(centerY), int(radius*0.25), color.RGBA{R: 0, G: 0, B: 0, A: 255})

	// Draw Sacred Objects (e.g. Āmra Mango fruit pulse representation)
	for _, obj := range frame.Objects {
		if obj.ObjectID == "amra_fruit" && obj.Opacity > 0.05 {
			objScale := obj.Scale * (1.0 + math.Sin(frame.TimeSec*1.8*obj.PranaRate)*0.04)
			fruitR := radius * 0.28 * objScale
			fruitCol := color.RGBA{R: 245, G: 158, B: 11, A: uint8(obj.Opacity * 220)} // Saffron gold

			drawFilledCircle(img, int(centerX+obj.X), int(centerY+obj.Y), int(fruitR), fruitCol)
			drawFilledCircle(img, int(centerX+obj.X), int(centerY+obj.Y), int(fruitR*0.35), color.RGBA{R: 255, G: 255, B: 255, A: uint8(obj.Opacity * 240)})
		}
	}

	return img
}

func drawCircleRing(img *image.RGBA, cx, cy, r int, col color.RGBA) {
	steps := 48
	for i := 0; i < steps; i++ {
		theta := (float64(i) / float64(steps)) * 2 * math.Pi
		x := cx + int(float64(r)*math.Cos(theta))
		y := cy + int(float64(r)*math.Sin(theta))
		if x >= 0 && x < img.Bounds().Dx() && y >= 0 && y < img.Bounds().Dy() {
			img.SetRGBA(x, y, col)
		}
	}
}

func drawFilledCircle(img *image.RGBA, cx, cy, r int, col color.RGBA) {
	minX := max(0, cx-r)
	maxX := min(img.Bounds().Dx()-1, cx+r)
	minY := max(0, cy-r)
	maxY := min(img.Bounds().Dy()-1, cy+r)

	r2 := r * r
	for y := minY; y <= maxY; y++ {
		dy := y - cy
		for x := minX; x <= maxX; x++ {
			dx := x - cx
			if dx*dx+dy*dy <= r2 {
				img.SetRGBA(x, y, col)
			}
		}
	}
}

func hslToRgb(h, s, l float64) (uint8, uint8, uint8) {
	h = math.Mod(h, 360.0)
	if h < 0 {
		h += 360.0
	}
	c := (1 - math.Abs(2*l-1)) * s
	x := c * (1 - math.Abs(math.Mod(h/60.0, 2)-1))
	m := l - c/2

	var rPrime, gPrime, bPrime float64
	switch {
	case h < 60:
		rPrime, gPrime, bPrime = c, x, 0
	case h < 120:
		rPrime, gPrime, bPrime = x, c, 0
	case h < 180:
		rPrime, gPrime, bPrime = 0, c, x
	case h < 240:
		rPrime, gPrime, bPrime = 0, x, c
	case h < 300:
		rPrime, gPrime, bPrime = x, 0, c
	default:
		rPrime, gPrime, bPrime = c, 0, x
	}

	return uint8((rPrime + m) * 255), uint8((gPrime + m) * 255), uint8((bPrime + m) * 255)
}
