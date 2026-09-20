package studio

import (
	"context"
	"fmt"
	"time"

	"github.com/echosh-labs/amra-treasury/internal/youtube"
)

// YouTubeBridge coordinates the publishing of rendered video artifacts to YouTube.
type YouTubeBridge struct {
	uploader *youtube.Uploader
	step     *youtube.YouTubeUploadStep
}

// NewYouTubeBridge instantiates the bridge.
func NewYouTubeBridge(uploader *youtube.Uploader) *YouTubeBridge {
	step := youtube.NewYouTubeUploadStep(uploader, func() string {
		return fmt.Sprintf("Rendered via AMRA Creative Studio on %s", time.Now().Format(time.RFC3339))
	})
	return &YouTubeBridge{
		uploader: uploader,
		step:     step,
	}
}

// DispatchRenderJob pushes a completed render job to the YouTube upload pipeline.
func (b *YouTubeBridge) DispatchRenderJob(ctx context.Context, job *RenderJob, privacyStatus string, categoryID string) (*youtube.PipelineResult, error) {
	if job.Status != JobStatusCompleted {
		return nil, fmt.Errorf("job is in status '%s', expected 'completed'", job.Status)
	}

	if privacyStatus == "" {
		privacyStatus = "private" // Safe default
	}
	if categoryID == "" {
		categoryID = "24" // Entertainment / Creative Art standard
	}

	artifact := youtube.PipelineArtifact{
		JobID:               fmt.Sprintf("yt_pub_%s", job.ID),
		SourcePath:          job.OutputPath,
		Title:               job.Manifest.Title,
		Description:         job.Manifest.Description,
		Tags:                job.Manifest.Tags,
		CategoryID:          categoryID,
		PrivacyStatus:       privacyStatus,
		AttachChronoContext: true,
		Metadata: map[string]string{
			"studio_manifest_id": job.Manifest.ID,
			"render_job_id":      job.ID,
			"duration_sec":       fmt.Sprintf("%.1f", job.DurationSec),
		},
	}

	return b.step.Execute(ctx, artifact)
}
