package studio

import (
	"context"
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
