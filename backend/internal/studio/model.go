package studio

import (
	"encoding/json"
	"fmt"
	"time"
)

// Orientation defines the aspect ratio standard for video compilation.
type Orientation string

const (
	OrientationLandscape16x9 Orientation = "16:9" // Standard YouTube / Desktop (1920x1080)
	OrientationPortrait9x16  Orientation = "9:16" // YouTube Shorts / Mobile (1080x1920)
	OrientationSquare1x1     Orientation = "1:1"  // Sacred Mandala / Social (1080x1080)
)

// CanvasConfig defines dimensions, frame rate, and canvas standard.
type CanvasConfig struct {
	Orientation     Orientation `json:"orientation"`
	Width           int         `json:"width"`
	Height          int         `json:"height"`
	FPS             int         `json:"fps"`
	BackgroundColor string      `json:"background_color"` // Default: "#020617" (Obsidian Abyss)
}

// EnsureDefaults applies standard defaults to the canvas configuration.
func (c *CanvasConfig) EnsureDefaults() {
	if c.Orientation == "" {
		c.Orientation = OrientationLandscape16x9
	}
	if c.FPS <= 0 {
		c.FPS = 30
	}
	if c.BackgroundColor == "" {
		c.BackgroundColor = "#020617"
	}
	if c.Width <= 0 || c.Height <= 0 {
		switch c.Orientation {
		case OrientationPortrait9x16:
			c.Width = 1080
			c.Height = 1920
		case OrientationSquare1x1:
			c.Width = 1080
			c.Height = 1080
		case OrientationLandscape16x9:
			fallthrough
		default:
			c.Width = 1920
			c.Height = 1080
		}
	}
}

// PatternLoopConfig governs rhythmic macro-cycle recurrence with progressive modulation.
type PatternLoopConfig struct {
	BaseCycleSec         float64 `json:"base_cycle_sec"`           // Duration of one base pattern (e.g. 108.0s)
	RepeatCount          int     `json:"repeat_count"`             // Number of pattern repetitions (e.g. 8x -> 14.4 mins)
	OctaveModulation     bool    `json:"octave_modulation"`        // Progressive audio octave elevation per cycle
	HueShiftDegPerCycle  float64 `json:"hue_shift_deg_per_cycle"`  // Degree of color wheel rotation per cycle (e.g. 30°)
	PranaHeatIncrement   float64 `json:"prana_heat_increment"`     // Rate of alchemical ripening heat per cycle (e.g. +0.05)
}

// EnsureDefaults applies sensible defaults to the pattern loop engine.
func (p *PatternLoopConfig) EnsureDefaults() {
	if p.BaseCycleSec <= 0 {
		p.BaseCycleSec = 108.0 // Sacred 108-second cycle
	}
	if p.RepeatCount <= 0 {
		p.RepeatCount = 1
	}
	if p.HueShiftDegPerCycle == 0 {
		p.HueShiftDegPerCycle = 15.0
	}
}

// BackgroundTrackConfig defines the toroidal harmonic background geometry and color dynamics.
type BackgroundTrackConfig struct {
	PresetID         string   `json:"preset_id"`          // "canonical_akasha", "black_hole", "golden_phi", etc.
	MajorRadius      float64  `json:"major_radius"`       // e.g. 130
	MinorRadius      float64  `json:"minor_radius"`       // e.g. 95
	LineCount        int      `json:"line_count"`         // e.g. 108, 144, 180
	MissMargin       float64  `json:"miss_margin"`        // Delta angle in degrees, e.g. 7.5°
	TiltAngle        float64  `json:"tilt_angle"`         // Isometric tilt, e.g. 35.0°
	WaveMode         string   `json:"wave_mode"`          // "orbital_swirl", "singularity_ingestion", "standing_wave", "doppler_vortex"
	Palette          string   `json:"palette"`            // "multivariate_facets", "solfeggio", "synesthesia", etc.
	ActiveFacetIDs   []string `json:"active_facet_ids"`   // Curated harmonic facet IDs
	BackdropStyle    string   `json:"backdrop_style"`     // "obsidian", "cosmic_aurora", "emerald_matrix", "solar_corona"
	CirculationSpeed float64  `json:"circulation_speed"`  // Speed multiplier (e.g. 1.0)
	SpaceGlow        float64  `json:"space_glow"`         // Caustic inter-filament luminescence (0.0 to 1.0)
}

// EnsureDefaults initializes standard background track settings.
func (b *BackgroundTrackConfig) EnsureDefaults() {
	if b.PresetID == "" {
		b.PresetID = "canonical_akasha"
	}
	if b.MajorRadius <= 0 {
		b.MajorRadius = 130
	}
	if b.MinorRadius <= 0 {
		b.MinorRadius = 95
	}
	if b.LineCount <= 0 {
		b.LineCount = 108
	}
	if b.MissMargin <= 0 {
		b.MissMargin = 7.5
	}
	if b.TiltAngle <= 0 {
		b.TiltAngle = 35.0
	}
	if b.WaveMode == "" {
		b.WaveMode = "orbital_swirl"
	}
	if b.Palette == "" {
		b.Palette = "multivariate_facets"
	}
	if len(b.ActiveFacetIDs) == 0 {
		b.ActiveFacetIDs = []string{"chakra_muladhara", "chakra_anahata", "chakra_sahasrara"}
	}
	if b.BackdropStyle == "" {
		b.BackdropStyle = "cosmic_aurora"
	}
	if b.CirculationSpeed <= 0 {
		b.CirculationSpeed = 1.0
	}
	if b.SpaceGlow <= 0 {
		b.SpaceGlow = 0.45
	}
}

// ObjectKeyframe defines a temporal keyframe state for a layered sacred graphic object.
type ObjectKeyframe struct {
	TimeSec     float64 `json:"time_sec"`     // Absolute or cycle-relative time offset
	Scale       float64 `json:"scale"`        // Object scale multiplier (1.0 = baseline)
	PositionX   float64 `json:"position_x"`   // Center offset X in pixels
	PositionY   float64 `json:"position_y"`   // Center offset Y in pixels
	Opacity     float64 `json:"opacity"`      // 0.0 (invisible) to 1.0 (fully opaque)
	PranaRate   float64 `json:"prana_rate"`   // Organic breathing frequency (e.g. 1.0)
	ThemeID     string  `json:"theme_id"`     // Expression palette ID (e.g. "pakva_gold", "samudra_churning")
	Transition  string  `json:"transition"`   // "linear", "ease_in_out", "instant"
}

// ObjectTrackConfig defines an autonomous graphical object layered over the background.
type ObjectTrackConfig struct {
	ID          string           `json:"id"`           // e.g. "track_amra_fruit"
	ObjectID    string           `json:"object_id"`    // e.g. "amra_fruit"
	Name        string           `json:"name"`         // Display name
	Enabled     bool             `json:"enabled"`
	Keyframes   []ObjectKeyframe `json:"keyframes"`
	Belly       float64          `json:"belly"`        // Parametric Garbha fullness (80-170)
	Hook        float64          `json:"hook"`         // Crest hook deflection (10-65)
	Shadow      float64          `json:"shadow"`       // Inner shadow integration (0.0-1.0)
	SolarAgni   float64          `json:"solar_agni"`   // Ripening heat (0.1-1.0)
}

// AudioTrackConfig defines harmonic tones, frequency beds, and voice narration.
type AudioTrackConfig struct {
	ID             string  `json:"id"`
	Role           string  `json:"role"`            // "harmonic_drone", "binaural_bed", "voiceover"
	FrequencyHz    float64 `json:"frequency_hz"`    // Primary frequency station (e.g. 432.0, 528.0)
	BinauralBeatHz float64 `json:"binaural_beat_hz"`// Delta offset for brainwave entrainment (e.g. 7.83Hz Schumann)
	Volume         float64 `json:"volume"`          // 0.0 to 1.0
	AudioFilePath  string  `json:"audio_file_path"` // Optional local audio asset path
	Loop           bool    `json:"loop"`
}

// StudioTimelineManifest is the master declarative document describing a long-form video composition.
type StudioTimelineManifest struct {
	ID          string                `json:"id"`
	Title       string                `json:"title"`
	Description string                `json:"description"`
	Tags        []string              `json:"tags"`
	Canvas      CanvasConfig          `json:"canvas"`
	PatternLoop PatternLoopConfig     `json:"pattern_loop"`
	Background  BackgroundTrackConfig `json:"background"`
	Objects     []ObjectTrackConfig   `json:"objects"`
	Audio       []AudioTrackConfig    `json:"audio"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
}

// TotalDurationSec returns the total presentation length derived from PatternLoop.
func (m *StudioTimelineManifest) TotalDurationSec() float64 {
	return m.PatternLoop.BaseCycleSec * float64(m.PatternLoop.RepeatCount)
}

// EnsureDefaults applies defaults across all manifest tracks.
func (m *StudioTimelineManifest) EnsureDefaults() {
	if m.ID == "" {
		m.ID = fmt.Sprintf("manifest_%d", time.Now().Unix())
	}
	if m.Title == "" {
		m.Title = "Sacred Toroidal Long-Form Chronicle"
	}
	m.Canvas.EnsureDefaults()
	m.PatternLoop.EnsureDefaults()
	m.Background.EnsureDefaults()

	if len(m.Objects) == 0 {
		m.Objects = []ObjectTrackConfig{
			{
				ID:        "amra_fruit_primary",
				ObjectID:  "amra_fruit",
				Name:      "Āmra Rūpa (Mango Fruit)",
				Enabled:   true,
				Belly:     125,
				Hook:      35,
				Shadow:    0.35,
				SolarAgni: 0.85,
				Keyframes: []ObjectKeyframe{
					{TimeSec: 0.0, Scale: 0.85, PositionX: 0, PositionY: 0, Opacity: 0.0, PranaRate: 0.8, ThemeID: "aama_emerald", Transition: "ease_in_out"},
					{TimeSec: 15.0, Scale: 1.0, PositionX: 0, PositionY: 0, Opacity: 0.95, PranaRate: 1.0, ThemeID: "pakva_gold", Transition: "ease_in_out"},
					{TimeSec: 60.0, Scale: 1.05, PositionX: 0, PositionY: 0, Opacity: 0.95, PranaRate: 1.2, ThemeID: "samudra_churning", Transition: "ease_in_out"},
					{TimeSec: 90.0, Scale: 1.0, PositionX: 0, PositionY: 0, Opacity: 0.95, PranaRate: 1.0, ThemeID: "surya_agni", Transition: "ease_in_out"},
					{TimeSec: 108.0, Scale: 0.9, PositionX: 0, PositionY: 0, Opacity: 0.2, PranaRate: 0.8, ThemeID: "amara_pearl", Transition: "ease_in_out"},
				},
			},
		}
	}

	if len(m.Audio) == 0 {
		m.Audio = []AudioTrackConfig{
			{
				ID:             "harmonic_drone_432",
				Role:           "harmonic_drone",
				FrequencyHz:    432.0,
				BinauralBeatHz: 7.83,
				Volume:         0.80,
				Loop:           true,
			},
		}
	}
}

// ToJSON marshals the manifest to indented JSON bytes.
func (m *StudioTimelineManifest) ToJSON() ([]byte, error) {
	return json.MarshalIndent(m, "", "  ")
}

// FromJSON unmarshals a JSON byte slice into a validated StudioTimelineManifest.
func FromJSON(data []byte) (*StudioTimelineManifest, error) {
	var m StudioTimelineManifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("failed to parse timeline manifest JSON: %w", err)
	}
	m.EnsureDefaults()
	return &m, nil
}
