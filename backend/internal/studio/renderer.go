package studio

import (
	"context"
	"fmt"
	"image"
	"image/color"
	"image/draw"
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
	// Background fill
	bgCol := color.RGBA{R: 2, G: 6, B: 23, A: 255}
	switch state.BackdropStyle {
	case "cosmic_aurora":
		bgCol = color.RGBA{R: 28, G: 14, B: 52, A: 255}
	case "emerald_matrix":
		bgCol = color.RGBA{R: 5, G: 42, B: 32, A: 255}
	case "solar_corona":
		bgCol = color.RGBA{R: 50, G: 18, B: 0, A: 255}
	}
	draw.Draw(img, img.Bounds(), &image.Uniform{C: bgCol}, image.Point{}, draw.Src)

	centerX := float64(w) / 2
	centerY := float64(h) / 2
	radius := float64(h) * 0.38

	// Render Toroidal Filaments
	lines := 72
	for i := 0; i < lines; i++ {
		angle := (float64(i)/float64(lines))*2*math.Pi + state.Phase*2*math.Pi
		cx := centerX + math.Cos(angle)*(radius*0.42)
		cy := centerY + math.Sin(angle)*(radius*0.28)
		ringR := radius * 0.52

		hue := math.Mod(float64(i*8)+state.HueOffset+state.Phase*360.0, 360.0)
		red, grn, blu := hslToRgb(hue, 0.88, 0.58)
		strokeCol := color.RGBA{R: red, G: grn, B: blu, A: 175}

		drawCircleRing(img, int(cx), int(cy), int(ringR), strokeCol)
	}

	// Black Hole Event Horizon
	drawFilledCircle(img, int(centerX), int(centerY), int(radius*0.26), color.RGBA{R: 0, G: 0, B: 0, A: 255})

	// Render Layered Objects (e.g. Āmra Mango fruit)
	for _, obj := range state.Objects {
		if obj.ObjectID == "amra_fruit" && obj.Opacity > 0.05 {
			prana := 1.0 + math.Sin(state.TimeSec*1.8*obj.PranaRate)*0.045
			fruitR := radius * 0.28 * obj.Scale * prana

			fruitCol := color.RGBA{R: 245, G: 158, B: 11, A: uint8(obj.Opacity * 240)}
			bijaCol := color.RGBA{R: 255, G: 255, B: 255, A: uint8(obj.Opacity * 250)}

			drawFilledCircle(img, int(centerX+obj.X), int(centerY+obj.Y), int(fruitR), fruitCol)
			drawFilledCircle(img, int(centerX+obj.X), int(centerY+obj.Y), int(fruitR*0.35), bijaCol)
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
