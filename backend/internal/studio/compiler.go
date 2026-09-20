package studio

import (
	"math"
)

// CompiledObjectState represents the exact interpolated transform of a graphic object at time t.
type CompiledObjectState struct {
	ObjectID  string  `json:"object_id"`
	Scale     float64 `json:"scale"`
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	Opacity   float64 `json:"opacity"`
	PranaRate float64 `json:"prana_rate"`
	ThemeID   string  `json:"theme_id"`
}

// CompiledFrameState captures the complete rendered state of the composition at any second t.
type CompiledFrameState struct {
	TimeSec       float64               `json:"time_sec"`
	CycleIndex    int                   `json:"cycle_index"`
	CycleTime     float64               `json:"cycle_time"`
	TotalDuration float64               `json:"total_duration"`
	Phase         float64               `json:"phase"`
	HueOffset     float64               `json:"hue_offset"`
	BackdropStyle string                `json:"backdrop_style"`
	Palette       string                `json:"palette"`
	Objects       []CompiledObjectState `json:"objects"`
	PrimaryFreqHz float64               `json:"primary_freq_hz"`
}

// TimelineCompiler handles temporal evaluation and keyframe interpolation.
type TimelineCompiler struct{}

// NewTimelineCompiler instantiates a timeline compiler.
func NewTimelineCompiler() *TimelineCompiler {
	return &TimelineCompiler{}
}

// Evaluate returns the composite state at timestamp tSec.
func (c *TimelineCompiler) Evaluate(m *StudioTimelineManifest, tSec float64) *CompiledFrameState {
	totalDur := m.TotalDurationSec()
	if tSec < 0 {
		tSec = 0
	}
	if tSec > totalDur && totalDur > 0 {
		tSec = totalDur
	}

	baseCycle := m.PatternLoop.BaseCycleSec
	if baseCycle <= 0 {
		baseCycle = 108.0
	}

	cycleIndex := int(tSec / baseCycle)
	if cycleIndex >= m.PatternLoop.RepeatCount && m.PatternLoop.RepeatCount > 0 {
		cycleIndex = m.PatternLoop.RepeatCount - 1
	}

	cycleTime := math.Mod(tSec, baseCycle)
	hueOffset := math.Mod(float64(cycleIndex)*m.PatternLoop.HueShiftDegPerCycle, 360.0)

	// Background harmonic phase
	circulationSpeed := m.Background.CirculationSpeed
	if circulationSpeed <= 0 {
		circulationSpeed = 1.0
	}
	phase := math.Mod(tSec*circulationSpeed*0.065, 1.0)

	// Compile layered objects
	compiledObjects := make([]CompiledObjectState, 0, len(m.Objects))
	for _, objTrack := range m.Objects {
		if !objTrack.Enabled || len(objTrack.Keyframes) == 0 {
			continue
		}

		state := c.interpolateKeyframes(objTrack.Keyframes, cycleTime, baseCycle)
		state.ObjectID = objTrack.ObjectID
		compiledObjects = append(compiledObjects, state)
	}

	// Audio primary frequency with octave modulation
	freq := 432.0
	if len(m.Audio) > 0 && m.Audio[0].FrequencyHz > 0 {
		freq = m.Audio[0].FrequencyHz
	}
	if m.PatternLoop.OctaveModulation && cycleIndex > 0 {
		// e.g. subtle progression up harmonic fifths (1.5x) or harmonic intervals
		octaveShift := math.Pow(1.059463, float64(cycleIndex%12)) // Chromatic semi-tone elevation
		freq = freq * octaveShift
	}

	return &CompiledFrameState{
		TimeSec:       tSec,
		CycleIndex:    cycleIndex,
		CycleTime:     cycleTime,
		TotalDuration: totalDur,
		Phase:         phase,
		HueOffset:     hueOffset,
		BackdropStyle: m.Background.BackdropStyle,
		Palette:       m.Background.Palette,
		Objects:       compiledObjects,
		PrimaryFreqHz: freq,
	}
}

// interpolateKeyframes interpolates object parameters along the cycle timeline.
func (c *TimelineCompiler) interpolateKeyframes(kfs []ObjectKeyframe, cycleTime, baseCycle float64) CompiledObjectState {
	if len(kfs) == 1 {
		k := kfs[0]
		return CompiledObjectState{
			Scale:     k.Scale,
			X:         k.PositionX,
			Y:         k.PositionY,
			Opacity:   k.Opacity,
			PranaRate: k.PranaRate,
			ThemeID:   k.ThemeID,
		}
	}

	// Find the surrounding keyframes
	var prev, next ObjectKeyframe
	prev = kfs[0]
	next = kfs[len(kfs)-1]

	for i := 0; i < len(kfs)-1; i++ {
		if cycleTime >= kfs[i].TimeSec && cycleTime <= kfs[i+1].TimeSec {
			prev = kfs[i]
			next = kfs[i+1]
			break
		}
	}

	segmentDur := next.TimeSec - prev.TimeSec
	var factor float64
	if segmentDur <= 0 {
		factor = 0
	} else {
		factor = (cycleTime - prev.TimeSec) / segmentDur
		if factor < 0 {
			factor = 0
		}
		if factor > 1 {
			factor = 1
		}
	}

	// Smooth easing
	if prev.Transition == "ease_in_out" {
		factor = 0.5 - 0.5*math.Cos(factor*math.Pi)
	}

	scale := prev.Scale + (next.Scale-prev.Scale)*factor
	x := prev.PositionX + (next.PositionX-prev.PositionX)*factor
	y := prev.PositionY + (next.PositionY-prev.PositionY)*factor
	opacity := prev.Opacity + (next.Opacity-prev.Opacity)*factor
	prana := prev.PranaRate + (next.PranaRate-prev.PranaRate)*factor

	themeID := prev.ThemeID
	if factor > 0.5 && next.ThemeID != "" {
		themeID = next.ThemeID
	}

	return CompiledObjectState{
		Scale:     scale,
		X:         x,
		Y:         y,
		Opacity:   opacity,
		PranaRate: prana,
		ThemeID:   themeID,
	}
}
