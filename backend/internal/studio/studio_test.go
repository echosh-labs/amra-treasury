package studio

import (
	"context"
	"image"
	"net/http/httptest"
	"testing"
	"time"
)

func TestStudioManifest_DefaultsAndDuration(t *testing.T) {
	m := &StudioTimelineManifest{
		Title: "Test Meditation Video",
	}
	m.EnsureDefaults()

	if m.Canvas.Width != 1920 || m.Canvas.Height != 1080 {
		t.Errorf("expected 1920x1080, got %dx%d", m.Canvas.Width, m.Canvas.Height)
	}

	if m.PatternLoop.BaseCycleSec != 108.0 {
		t.Errorf("expected 108s base cycle, got %.1f", m.PatternLoop.BaseCycleSec)
	}

	m.PatternLoop.RepeatCount = 5
	expectedDuration := 108.0 * 5.0
	if m.TotalDurationSec() != expectedDuration {
		t.Errorf("expected duration %.1f, got %.1f", expectedDuration, m.TotalDurationSec())
	}
}

func TestTimelineCompiler_Evaluation(t *testing.T) {
	m := &StudioTimelineManifest{
		Title: "Compiler Test",
	}
	m.EnsureDefaults()
	m.PatternLoop.BaseCycleSec = 100.0
	m.PatternLoop.RepeatCount = 4
	m.PatternLoop.HueShiftDegPerCycle = 30.0

	compiler := NewTimelineCompiler()

	// Evaluate at t = 0
	f0 := compiler.Evaluate(m, 0.0)
	if f0.CycleIndex != 0 {
		t.Errorf("expected cycle 0 at t=0, got %d", f0.CycleIndex)
	}
	if f0.HueOffset != 0.0 {
		t.Errorf("expected hue offset 0, got %.1f", f0.HueOffset)
	}

	// Evaluate at t = 150 (Cycle 1, CycleTime 50)
	f150 := compiler.Evaluate(m, 150.0)
	if f150.CycleIndex != 1 {
		t.Errorf("expected cycle 1 at t=150, got %d", f150.CycleIndex)
	}
	if f150.CycleTime != 50.0 {
		t.Errorf("expected cycle time 50.0, got %.1f", f150.CycleTime)
	}
	if f150.HueOffset != 30.0 {
		t.Errorf("expected hue offset 30.0, got %.1f", f150.HueOffset)
	}

	if len(f150.Objects) == 0 {
		t.Fatalf("expected compiled objects, got 0")
	}
	obj := f150.Objects[0]
	if obj.Opacity <= 0.0 {
		t.Errorf("expected positive opacity at t=50s into cycle, got %.2f", obj.Opacity)
	}
}

func TestLiveStreamer_EphemeralEvents(t *testing.T) {
	streamer := NewLiveStreamer()

	m := &StudioTimelineManifest{Title: "Stream Test"}
	m.EnsureDefaults()

	req := httptest.NewRequest("GET", "/api/v1/studio/stream?fps=10", nil)
	ctx, cancel := context.WithTimeout(req.Context(), 150*time.Millisecond)
	defer cancel()
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()

	streamer.StreamHandler(rr, req, func() *StudioTimelineManifest {
		return m
	})

	body := rr.Body.String()
	if len(body) == 0 {
		t.Errorf("expected streamed data, got empty response")
	}
}

func TestLiveStreamer_EphemeralMJPEG(t *testing.T) {
	streamer := NewLiveStreamer()

	m := &StudioTimelineManifest{Title: "MJPEG Test"}
	m.EnsureDefaults()

	req := httptest.NewRequest("GET", "/api/v1/studio/stream?format=mjpeg&fps=10", nil)
	ctx, cancel := context.WithTimeout(req.Context(), 150*time.Millisecond)
	defer cancel()
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()

	streamer.StreamHandler(rr, req, func() *StudioTimelineManifest {
		return m
	})

	contentType := rr.Header().Get("Content-Type")
	if contentType != "multipart/x-mixed-replace; boundary=frame" {
		t.Errorf("expected multipart/x-mixed-replace, got %s", contentType)
	}
}

func TestRenderFrameRGBA_FidelityAndBackdrops(t *testing.T) {
	m := &StudioTimelineManifest{Title: "Fidelity Test"}
	m.EnsureDefaults()
	compiler := NewTimelineCompiler()

	backdrops := []string{"cosmic_aurora", "emerald_matrix", "solar_corona", "obsidian"}
	palettes := []string{"multivariate_facets", "solfeggio", "chakra", "alchemical", "golden_angle", "bioluminescent", "iridescent", "monochrome"}

	for _, bd := range backdrops {
		for _, pal := range palettes {
			m.Background.BackdropStyle = bd
			m.Background.Palette = pal

			state := compiler.Evaluate(m, 15.0)
			img := image.NewRGBA(image.Rect(0, 0, 480, 270))

			RenderFrameRGBA(img, 480, 270, state)

			// Check that frame is non-empty
			var nonZeroCount int
			for i := 0; i < len(img.Pix); i += 4 {
				if img.Pix[i] > 0 || img.Pix[i+1] > 0 || img.Pix[i+2] > 0 {
					nonZeroCount++
				}
			}
			if nonZeroCount < 1000 {
				t.Errorf("frame for backdrop %s and palette %s was unexpectedly empty", bd, pal)
			}
		}
	}
}

func TestThemeInterpolation(t *testing.T) {
	t1 := GetTheme("aama_emerald")
	t2 := GetTheme("pakva_gold")

	mid := InterpolateTheme(t1, t2, 0.5)

	if mid.BodyStops[0].R == t1.BodyStops[0].R && mid.BodyStops[0].R == t2.BodyStops[0].R {
		t.Errorf("expected interpolated color, got static value")
	}
}

func BenchmarkRenderFrameRGBA_720p(b *testing.B) {
	m := &StudioTimelineManifest{Title: "Bench"}
	m.EnsureDefaults()
	compiler := NewTimelineCompiler()
	state := compiler.Evaluate(m, 15.0)

	img := image.NewRGBA(image.Rect(0, 0, 1280, 720))

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		RenderFrameRGBA(img, 1280, 720, state)
	}
}

