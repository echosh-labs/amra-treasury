package studio

import (
	"context"
	"fmt"
	"image"
	"image/color"
	"io"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"
)

// RenderJobStatus reflects the lifecycle state of a headless video compilation job.
type RenderJobStatus string

const (
	JobStatusQueued    RenderJobStatus = "queued"
	JobStatusRendering RenderJobStatus = "rendering"
	JobStatusCompleted RenderJobStatus = "completed"
	JobStatusFailed    RenderJobStatus = "failed"
	JobStatusCancelled RenderJobStatus = "cancelled"
)

// RenderJob tracks an asynchronous video encoding job.
type RenderJob struct {
	ID           string                 `json:"id"`
	ManifestID   string                 `json:"manifest_id"`
	Status       RenderJobStatus        `json:"status"`
	ProgressPct  float64                `json:"progress_pct"`
	CurrentFrame int                    `json:"current_frame"`
	TotalFrames  int                    `json:"total_frames"`
	DurationSec  float64                `json:"duration_sec"`
	OutputPath   string                 `json:"output_path,omitempty"`
	ErrorMessage string                 `json:"error_message,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	CompletedAt  *time.Time             `json:"completed_at,omitempty"`
	Manifest     StudioTimelineManifest `json:"manifest"`
}

// HeadlessRenderer manages background video encoding via FFmpeg pipes.
type HeadlessRenderer struct {
	compiler   *TimelineCompiler
	rendersDir string
	jobsMu     sync.RWMutex
	jobs       map[string]*RenderJob
	ffmpegPath string
}

// NewHeadlessRenderer creates a renderer instance.
func NewHeadlessRenderer(rendersDir string) *HeadlessRenderer {
	if rendersDir == "" {
		rendersDir = ".data/renders"
	}
	_ = os.MkdirAll(rendersDir, 0755)

	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		ffmpegPath = "/usr/bin/ffmpeg"
	}

	return &HeadlessRenderer{
		compiler:   NewTimelineCompiler(),
		rendersDir: rendersDir,
		jobs:       make(map[string]*RenderJob),
		ffmpegPath: ffmpegPath,
	}
}

// LaunchJob starts an asynchronous rendering task for the given manifest.
func (r *HeadlessRenderer) LaunchJob(ctx context.Context, m *StudioTimelineManifest) (*RenderJob, error) {
	r.jobsMu.Lock()
	defer r.jobsMu.Unlock()

	jobID := fmt.Sprintf("job_render_%d", time.Now().UnixNano())
	outputPath := filepath.Join(r.rendersDir, fmt.Sprintf("%s.mp4", jobID))

	fps := m.Canvas.FPS
	if fps <= 0 {
		fps = 30
	}
	totalSec := m.TotalDurationSec()
	totalFrames := int(math.Ceil(totalSec * float64(fps)))
	if totalFrames <= 0 {
		totalFrames = 300 // Safe default: 10s
	}

	job := &RenderJob{
		ID:           jobID,
		ManifestID:   m.ID,
		Status:       JobStatusQueued,
		ProgressPct:  0.0,
		CurrentFrame: 0,
		TotalFrames:  totalFrames,
		DurationSec:  totalSec,
		OutputPath:   outputPath,
		CreatedAt:    time.Now(),
		Manifest:     *m,
	}

	r.jobs[jobID] = job

	// Launch async execution goroutine
	go r.executeJob(job)

	return job, nil
}

// GetJob returns a copy of the specified render job.
func (r *HeadlessRenderer) GetJob(jobID string) (*RenderJob, bool) {
	r.jobsMu.RLock()
	defer r.jobsMu.RUnlock()
	j, exists := r.jobs[jobID]
	if !exists {
		return nil, false
	}
	copyJob := *j
	return &copyJob, true
}

// ListJobs returns all recorded render jobs.
func (r *HeadlessRenderer) ListJobs() []*RenderJob {
	r.jobsMu.RLock()
	defer r.jobsMu.RUnlock()

	out := make([]*RenderJob, 0, len(r.jobs))
	for _, j := range r.jobs {
		copyJob := *j
		out = append(out, &copyJob)
	}
	return out
}

// executeJob orchestrates the stdin frame streaming to /usr/bin/ffmpeg.
func (r *HeadlessRenderer) executeJob(job *RenderJob) {
	r.updateJobStatus(job.ID, JobStatusRendering, 0, 0, nil)

	m := &job.Manifest
	w := m.Canvas.Width
	h := m.Canvas.Height
	fps := m.Canvas.FPS
	totalFrames := job.TotalFrames
	freq := 432.0
	if len(m.Audio) > 0 && m.Audio[0].FrequencyHz > 0 {
		freq = m.Audio[0].FrequencyHz
	}

	// Prepare FFmpeg command with rawvideo stdin pipe + harmonic audio tone generator
	// ffmpeg -y -f rawvideo -pix_fmt rgba -s WxH -r FPS -i - -f lavfi -i "sine=frequency=FREQ:sample_rate=48000" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest output.mp4
	audioFilter := fmt.Sprintf("sine=frequency=%.1f:sample_rate=48000", freq)

	cmd := exec.Command(r.ffmpegPath,
		"-y",
		"-f", "rawvideo",
		"-pix_fmt", "rgba",
		"-s", fmt.Sprintf("%dx%d", w, h),
		"-r", fmt.Sprintf("%d", fps),
		"-i", "-", // Read raw video frames from stdin
		"-f", "lavfi",
		"-i", audioFilter,
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-crf", "20",
		"-pix_fmt", "yuv420p",
		"-c:a", "aac",
		"-b:a", "192k",
		"-shortest",
		job.OutputPath,
	)

	stdinPipe, err := cmd.StdinPipe()
	if err != nil {
		r.failJob(job.ID, fmt.Errorf("failed to open ffmpeg stdin pipe: %w", err))
		return
	}

	if err := cmd.Start(); err != nil {
		r.failJob(job.ID, fmt.Errorf("failed to start ffmpeg command: %w", err))
		return
	}

	frameImg := image.NewRGBA(image.Rect(0, 0, w, h))

	// Stream frames sequentially into ffmpeg pipe
	for frameIdx := 0; frameIdx < totalFrames; frameIdx++ {
		tSec := float64(frameIdx) / float64(fps)
		frameState := r.compiler.Evaluate(m, tSec)

		r.renderFrameRGBA(frameImg, w, h, frameState)

		if _, err := stdinPipe.Write(frameImg.Pix); err != nil {
			log.Printf("Renderer: pipe write broken at frame %d: %v", frameIdx, err)
			break
		}

		// Update progress throttled
		if frameIdx%15 == 0 || frameIdx == totalFrames-1 {
			pct := (float64(frameIdx+1) / float64(totalFrames)) * 100.0
			r.updateJobStatus(job.ID, JobStatusRendering, pct, frameIdx+1, nil)
		}
	}

	_ = stdinPipe.Close()

	if err := cmd.Wait(); err != nil {
		r.failJob(job.ID, fmt.Errorf("ffmpeg execution failed: %w", err))
		return
	}

	now := time.Now()
	r.updateJobStatus(job.ID, JobStatusCompleted, 100.0, totalFrames, &now)
	log.Printf("✔ Headless render completed cleanly: %s (Duration: %.1fs)", job.OutputPath, job.DurationSec)
}

func (r *HeadlessRenderer) renderFrameRGBA(img *image.RGBA, w, h int, state *CompiledFrameState) {
	RenderFrameRGBA(img, w, h, state)
}

// RenderFrameRGBA renders a high-fidelity visual frame with radial wallpaper shaders,
// inter-filament caustic glow resonance, precessing antialiased filaments, central event horizon void,
// and authentic parametric Āmra sacred geometry with alchemical theme transitions.
func RenderFrameRGBA(img *image.RGBA, w, h int, state *CompiledFrameState) {
	scaleFactor := math.Min(float64(w), float64(h)) / 500.0
	centerX := float64(w) / 2.0
	centerY := float64(h) / 2.0

	// 1. Deep Space Atmospheric Radial Wallpaper
	FillRadialWallpaper(img, w, h, state.BackdropStyle)

	// 2. Inter-Filament Caustic Resonance (Glow in the space between lines)
	if state.SpaceGlow > 0 {
		innerHoleR := math.Abs(state.MajorRadius-state.MinorRadius) * scaleFactor * 0.7
		outerR := (state.MajorRadius + state.MinorRadius) * scaleFactor * 1.15
		causticHue := math.Mod(state.Phase*360.0, 360.0)
		if causticHue < 0 {
			causticHue += 360.0
		}
		waveBoost := (math.Sin(2*math.Pi*state.Phase) + 1.0) * 0.5

		causticCol1 := HSLToRGBA(causticHue, 0.90, 0.55, uint8(state.SpaceGlow*(0.22+waveBoost*0.15)*255.0))
		causticCol2 := HSLToRGBA(math.Mod(causticHue+120.0, 360.0), 0.85, 0.45, uint8(state.SpaceGlow*0.12*255.0))

		causticStops := []GradientStop{
			{Offset: 0.0, Color: color.RGBA{R: 0, G: 0, B: 0, A: 0}},
			{Offset: 0.35, Color: causticCol1},
			{Offset: 0.75, Color: causticCol2},
			{Offset: 1.0, Color: color.RGBA{R: 2, G: 6, B: 23, A: 0}},
		}
		causticLUT := BuildGradientLUT(causticStops)
		DrawRadialGlow(img, centerX, centerY, innerHoleR, outerR, causticLUT, 1.0)
	}

	// 3. Render Precessing Toroidal Filaments
	lineCount := state.LineCount
	if lineCount < 12 {
		lineCount = 108
	}
	tiltRad := state.TiltAngle * math.Pi / 180.0
	cosTilt := math.Cos(tiltRad)
	if cosTilt < 0.1 {
		cosTilt = 0.1
	}
	missMarginRad := state.MissMargin * math.Pi / 180.0
	stepAngle := (2.0 * math.Pi) / float64(lineCount)
	majR := state.MajorRadius * scaleFactor
	minR := state.MinorRadius * scaleFactor

	solfeggioHues := []float64{340, 20, 48, 140, 185, 215, 260, 290, 315}
	chakraHues := []float64{0, 24, 50, 155, 190, 240, 280}
	alchemicalHues := []float64{42, 210, 28, 220, 195, 270}

	for k := 0; k < lineCount; k++ {
		frac := float64(k) / float64(lineCount)
		var waveFactor float64

		switch state.WaveMode {
		case "singularity_ingestion":
			waveFactor = math.Cos(2 * math.Pi * (frac*2.0 + state.Phase))
		case "standing_wave":
			waveFactor = math.Sin(2*math.Pi*frac) * math.Cos(2*math.Pi*state.Phase)
		case "doppler_vortex":
			waveFactor = math.Sin(2 * math.Pi * (math.Pow(frac, 1.5) - state.Phase))
		default: // "orbital_swirl"
			waveFactor = math.Sin(2 * math.Pi * (frac - state.Phase))
		}

		var hue, sat, light float64
		sat = 88.0
		light = 54.0 + waveFactor*18.0

		switch state.Palette {
		case "solfeggio":
			sLen := float64(len(solfeggioHues))
			sIdx := math.Mod(frac*sLen+state.Phase*3.0, sLen)
			if sIdx < 0 {
				sIdx += sLen
			}
			i0 := int(sIdx)
			i1 := (i0 + 1) % len(solfeggioHues)
			mix := sIdx - float64(i0)
			hue = solfeggioHues[i0]*(1.0-mix) + solfeggioHues[i1]*mix

		case "chakra":
			cLen := float64(len(chakraHues))
			cIdx := math.Mod(frac*cLen+state.Phase*2.0, cLen)
			if cIdx < 0 {
				cIdx += cLen
			}
			i0 := int(cIdx)
			i1 := (i0 + 1) % len(chakraHues)
			mix := cIdx - float64(i0)
			hue = chakraHues[i0]*(1.0-mix) + chakraHues[i1]*mix

		case "alchemical":
			aLen := float64(len(alchemicalHues))
			aIdx := math.Mod(frac*aLen+state.Phase*2.0, aLen)
			if aIdx < 0 {
				aIdx += aLen
			}
			i0 := int(aIdx)
			i1 := (i0 + 1) % len(alchemicalHues)
			mix := aIdx - float64(i0)
			hue = alchemicalHues[i0]*(1.0-mix) + alchemicalHues[i1]*mix

		case "golden_angle":
			hue = math.Mod(35.0+float64(k)*137.507764+state.Phase*360.0, 360.0)

		case "bioluminescent":
			hue = 155.0 + math.Mod(frac+state.Phase, 1.0)*65.0

		case "iridescent":
			hue = math.Mod(180.0+120.0*math.Sin(2.0*math.Pi*(frac*3.0-state.Phase))+360.0, 360.0)

		case "monochrome":
			hue = 215.0
			sat = 15.0
			light = 65.0 + waveFactor*25.0

		default: // "multivariate_facets" or "synesthesia"
			hue = math.Mod(frac*360.0+state.Phase*360.0+state.HueOffset, 360.0)
		}

		if hue < 0 {
			hue = math.Mod(hue+360.0, 360.0)
		}

		opacity := math.Max(0.18, math.Min(0.95, 0.55+waveFactor*0.35))
		strokeCol := HSLToRGBA(hue, sat/100.0, light/100.0, uint8(opacity*255.0))
		strokeWidth := math.Max(0.6, 1.0*(0.75+math.Abs(waveFactor)*0.45)*scaleFactor)

		centerAngle := float64(k) * stepAngle
		precessionAngle := float64(k) * missMarginRad

		cx := centerX + (majR * math.Cos(centerAngle))
		cy := centerY + (majR * math.Sin(centerAngle) * cosTilt)

		const steps = 48
		var firstX, firstY, prevX, prevY float64

		for s := 0; s <= steps; s++ {
			phi := (float64(s) / float64(steps)) * 2.0 * math.Pi
			lx := minR * math.Cos(phi)
			ly := minR * math.Sin(phi)

			rx := lx*math.Cos(precessionAngle) - ly*math.Sin(precessionAngle)
			ry := lx*math.Sin(precessionAngle) + ly*math.Cos(precessionAngle)

			gx := cx + rx
			gy := cy + (ry * cosTilt)

			if s == 0 {
				firstX, firstY = gx, gy
				prevX, prevY = gx, gy
			} else {
				DrawLineAA(img, prevX, prevY, gx, gy, strokeCol, strokeWidth)
				prevX, prevY = gx, gy
			}
		}
		DrawLineAA(img, prevX, prevY, firstX, firstY, strokeCol, strokeWidth)
	}

	// 4. Central Singularity Event Horizon Black Hole Void
	innerHoleRadius := math.Abs(state.MajorRadius-state.MinorRadius) * scaleFactor
	if innerHoleRadius > 4.0 {
		voidStops := []GradientStop{
			{Offset: 0.0, Color: color.RGBA{R: 0, G: 0, B: 0, A: 255}},
			{Offset: 0.75, Color: color.RGBA{R: 0, G: 0, B: 0, A: 255}},
			{Offset: 0.92, Color: color.RGBA{R: 2, G: 6, B: 23, A: 240}},
			{Offset: 1.0, Color: color.RGBA{R: 2, G: 6, B: 23, A: 0}},
		}
		voidLUT := BuildGradientLUT(voidStops)
		DrawRadialGlow(img, centerX, centerY, 0, innerHoleRadius, voidLUT, 1.0)

		// Singularity Horizon perimeter glow ring
		horizonHue := math.Mod(state.Phase*360.0, 360.0)
		horizonCol := HSLToRGBA(horizonHue, 0.80, 0.65, 120)
		const ringSteps = 60
		for s := 0; s < ringSteps; s++ {
			a1 := (float64(s) / float64(ringSteps)) * 2.0 * math.Pi
			a2 := (float64(s+1) / float64(ringSteps)) * 2.0 * math.Pi
			rx1 := centerX + innerHoleRadius*math.Cos(a1)
			ry1 := centerY + innerHoleRadius*math.Sin(a1)*cosTilt
			rx2 := centerX + innerHoleRadius*math.Cos(a2)
			ry2 := centerY + innerHoleRadius*math.Sin(a2)*cosTilt
			DrawLineAA(img, rx1, ry1, rx2, ry2, horizonCol, 0.8*scaleFactor)
		}

		// Central Divine Bindu (Pristine Starlight)
		binduR := math.Max(1.5, 2.0*scaleFactor)
		binduStops := []GradientStop{
			{Offset: 0.0, Color: color.RGBA{R: 255, G: 255, B: 255, A: 255}},
			{Offset: 0.6, Color: color.RGBA{R: 255, G: 255, B: 255, A: 220}},
			{Offset: 1.0, Color: color.RGBA{R: 255, G: 255, B: 255, A: 0}},
		}
		binduLUT := BuildGradientLUT(binduStops)
		DrawRadialGlow(img, centerX, centerY, 0, binduR, binduLUT, 1.0)
	}

	// 5. Layered Sacred Objects (e.g. Parametric Vedic Āmra Fruit)
	for _, obj := range state.Objects {
		if obj.ObjectID == "amra_fruit" && obj.Opacity > 0.02 {
			prana := 1.0 + math.Sin(state.TimeSec*1.8*obj.PranaRate)*0.045
			objScale := obj.Scale * prana * scaleFactor

			ox := centerX + obj.X*scaleFactor
			oy := centerY + obj.Y*scaleFactor

			t1 := GetTheme(obj.ThemeID)
			t2 := GetTheme(obj.NextThemeID)
			theme := InterpolateTheme(t1, t2, obj.ThemeFactor)

			belly := obj.Belly
			if belly <= 0 {
				belly = 125.0
			}
			hook := obj.Hook
			if hook <= 0 {
				hook = 35.0
			}

			// 5.1 Prāṇa Radiance Aura Halo
			auraR := belly * 1.5 * objScale
			auraStops := []GradientStop{
				{Offset: 0.0, Color: theme.AuraGlow},
				{Offset: 0.5, Color: theme.AuraGlow},
				{Offset: 1.0, Color: color.RGBA{R: theme.AuraGlow.R, G: theme.AuraGlow.G, B: theme.AuraGlow.B, A: 0}},
			}
			auraLUT := BuildGradientLUT(auraStops)
			DrawRadialGlow(img, ox, oy, 0, auraR, auraLUT, obj.Opacity)

			// 5.2 Sacred Mango Leaves (Āmra-Pallava)
			stemY := oy - (belly*1.4*0.82-30.0)*objScale
			leaves := ComputeParametricLeaves(Point2D{X: ox, Y: stemY}, objScale)
			for _, leaf := range leaves {
				FillPolygonSolid(img, leaf, theme.LeafFill)
				for li := 0; li < len(leaf)-1; li++ {
					DrawLineAA(img, leaf[li].X, leaf[li].Y, leaf[li+1].X, leaf[li+1].Y, theme.LeafStroke, 1.0*scaleFactor)
				}
			}

			// 5.3 Parametric Fruit Body
			bodyPoints := ComputeParametricKairiCurve(ox, oy, objScale, belly, belly*1.4, 0.35, 0.22, hook, 30.0, 120)

			bodyStops := []GradientStop{
				{Offset: 0.0, Color: theme.BodyStops[0]},
				{Offset: 0.40, Color: theme.BodyStops[1]},
				{Offset: 0.78, Color: theme.BodyStops[2]},
				{Offset: 1.0, Color: theme.BodyStops[3]},
			}
			bodyLUT := BuildGradientLUT(bodyStops)
			gradCenterX := ox - 12.0*objScale
			gradCenterY := oy + 12.0*objScale
			FillPolygonRadial(img, bodyPoints, gradCenterX, gradCenterY, belly*1.6*objScale, bodyLUT, obj.Opacity)

			// Perimeter Stroke
			for pi := 0; pi < len(bodyPoints)-1; pi++ {
				DrawLineAA(img, bodyPoints[pi].X, bodyPoints[pi].Y, bodyPoints[pi+1].X, bodyPoints[pi+1].Y, theme.StrokeColor, 1.8*scaleFactor)
			}

			// 5.4 Inner Indestructible Bīja Seed
			rxBija := belly * 0.38
			ryBija := belly * 1.4 * 0.42
			bijaPoints := ComputeParametricKairiCurve(ox, oy, objScale*0.72, rxBija, ryBija, 0.18, 0.10, hook*0.3, 25.0, 80)

			bijaStops := []GradientStop{
				{Offset: 0.0, Color: theme.BijaStops[0]},
				{Offset: 0.35, Color: theme.BijaStops[1]},
				{Offset: 0.75, Color: theme.BijaStops[2]},
				{Offset: 1.0, Color: theme.BijaStops[3]},
			}
			bijaLUT := BuildGradientLUT(bijaStops)
			FillPolygonRadial(img, bijaPoints, ox, oy+5.0*objScale, rxBija*1.5*objScale*0.72, bijaLUT, obj.Opacity)

			for bi := 0; bi < len(bijaPoints)-1; bi++ {
				DrawLineAA(img, bijaPoints[bi].X, bijaPoints[bi].Y, bijaPoints[bi+1].X, bijaPoints[bi+1].Y, theme.BijaStroke, 1.2*scaleFactor)
			}
		}
	}
}

func (r *HeadlessRenderer) updateJobStatus(id string, status RenderJobStatus, pct float64, curFrame int, completedAt *time.Time) {
	r.jobsMu.Lock()
	defer r.jobsMu.Unlock()
	if j, exists := r.jobs[id]; exists {
		j.Status = status
		j.ProgressPct = pct
		j.CurrentFrame = curFrame
		if completedAt != nil {
			j.CompletedAt = completedAt
		}
	}
}

func (r *HeadlessRenderer) failJob(id string, err error) {
	r.jobsMu.Lock()
	defer r.jobsMu.Unlock()
	if j, exists := r.jobs[id]; exists {
		j.Status = JobStatusFailed
		j.ErrorMessage = err.Error()
	}
	log.Printf("❌ Render job [%s] failed: %v", id, err)
}

// Silence unused io import warning
var _ = io.EOF
