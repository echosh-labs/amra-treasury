package amra

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

// ToroidParams defines the mathematical parameters of the Toroidal Singularity geometry.
type ToroidParams struct {
	MajorRadius float64 `json:"major_radius"` // Distance from origin to tube center (R)
	MinorRadius float64 `json:"minor_radius"` // Tube radius / ring radius (r)
	LineCount   int     `json:"line_count"`   // Number of circumscribed lines / loops (N)
	MissMargin  float64 `json:"miss_margin"`  // Precession angle offset (degrees) causing each loop to miss closure (δ)
	TiltAngle   float64 `json:"tilt_angle"`   // Projection tilt angle in degrees (0 = flat face-on, 60 = 3D isometric)
	WindingStep int     `json:"winding_step"` // Step resolution for curve rendering
	Mode        string  `json:"mode"`         // "continuous", "discrete_rings", "chords"
	Scale       float64 `json:"scale"`        // Global spatial multiplier
}

// DefaultToroidParams returns canonical parameters for the Sacred Toroidal Singularity.
func DefaultToroidParams() ToroidParams {
	return ToroidParams{
		MajorRadius: 130.0,
		MinorRadius: 95.0,
		LineCount:   108,  // Sacred Vedic 108 filaments
		MissMargin:  7.5,  // Degrees of precession offset per loop
		TiltAngle:   0.0,  // Flat face-on view
		WindingStep: 64,   // Points per individual loop
		Mode:        "discrete_rings",
		Scale:       1.0,
	}
}

// ToroidLoop encapsulates an individual circumscribed loop path.
type ToroidLoop struct {
	Index   int       `json:"index"`
	Angle   float64   `json:"angle_deg"`
	Center  Point2D   `json:"center"`
	SVGPath string    `json:"svg_path"`
	Points  []Point2D `json:"points,omitempty"`
}

// ToroidGeometryResult encapsulates the complete generated toroidal artwork.
type ToroidGeometryResult struct {
	Params           ToroidParams      `json:"params"`
	SVGPath          string            `json:"svg_path"`          // Unified SVG path combining all lines
	Loops            []ToroidLoop      `json:"loops"`             // Individual loop definitions
	BoundingBox      BoundingBox       `json:"bounding_box"`      // Spatial bounds
	InnerHoleRadius  float64           `json:"inner_hole_radius"` // Event horizon radius (R - r)
	OuterRadius      float64           `json:"outer_radius"`      // Outer boundary radius (R + r)
	ClosureGap       float64           `json:"closure_gap"`       // Distance between start of loop 0 and its return point
	TotalFilaments   int               `json:"total_filaments"`   // Total line segments rendered
	Formulas         map[string]string `json:"formulas"`          // Mathematical formulations
	SacredPhilosophy string            `json:"sacred_philosophy"` // Contemplative description
}

// CalculateToroidGeometry computes the sacred geometry toroidal field.
func CalculateToroidGeometry(params ToroidParams) ToroidGeometryResult {
	// Sanitize inputs
	if params.LineCount < 12 {
		params.LineCount = 108
	}
	if params.MajorRadius <= 0 {
		params.MajorRadius = 130.0
	}
	if params.MinorRadius <= 0 {
		params.MinorRadius = 95.0
	}
	if params.Scale <= 0 {
		params.Scale = 1.0
	}
	if params.WindingStep < 16 {
		params.WindingStep = 64
	}
	if params.Mode == "" {
		params.Mode = "discrete_rings"
	}

	tiltRad := params.TiltAngle * math.Pi / 180.0
	cosTilt := math.Cos(tiltRad)
	if cosTilt < 0.1 {
		cosTilt = 0.1
	}

	missMarginRad := params.MissMargin * math.Pi / 180.0
	N := params.LineCount
	stepAngle := (2.0 * math.Pi) / float64(N)

	loops := make([]ToroidLoop, N)
	var unifiedPath strings.Builder

	minX, maxX := math.MaxFloat64, -math.MaxFloat64
	minY, maxY := math.MaxFloat64, -math.MaxFloat64

	switch params.Mode {
	case "continuous":
		// A single unbroken filament that travels around the torus,
		// where each turn misses its starting point by MissMargin.
		totalSteps := N * params.WindingStep
		for i := 0; i <= totalSteps; i++ {
			loopIdx := float64(i) / float64(params.WindingStep)
			turnFraction := float64(i%params.WindingStep) / float64(params.WindingStep)

			centerAngle := loopIdx * (stepAngle + missMarginRad/float64(N))
			cx := (params.MajorRadius * math.Cos(centerAngle)) * params.Scale
			cy := (params.MajorRadius * math.Sin(centerAngle) * cosTilt) * params.Scale

			phi := turnFraction * 2.0 * math.Pi
			px := cx + (params.MinorRadius * math.Cos(phi)) * params.Scale
			py := cy + (params.MinorRadius * math.Sin(phi) * cosTilt) * params.Scale

			p := Point2D{
				X: math.Round(px*100) / 100,
				Y: math.Round(py*100) / 100,
			}

			if p.X < minX {
				minX = p.X
			}
			if p.X > maxX {
				maxX = p.X
			}
			if p.Y < minY {
				minY = p.Y
			}
			if p.Y > maxY {
				maxY = p.Y
			}

			if i == 0 {
				unifiedPath.WriteString(fmt.Sprintf("M %.2f %.2f", p.X, p.Y))
			} else {
				unifiedPath.WriteString(fmt.Sprintf(" L %.2f %.2f", p.X, p.Y))
			}
		}

	case "chords":
		// Circumscribed chord tangents connecting an inner event horizon circle to an outer circle,
		// with stepping that misses by MissMargin.
		innerR := math.Abs(params.MajorRadius-params.MinorRadius) * params.Scale
		outerR := (params.MajorRadius + params.MinorRadius) * params.Scale

		for k := 0; k < N; k++ {
			theta1 := float64(k) * stepAngle
			theta2 := float64(k)*stepAngle + float64(k)*missMarginRad + math.Pi/2.0

			p1 := Point2D{
				X: math.Round(innerR*math.Cos(theta1)*100) / 100,
				Y: math.Round(innerR*math.Sin(theta1)*cosTilt*100) / 100,
			}
			p2 := Point2D{
				X: math.Round(outerR*math.Cos(theta2)*100) / 100,
				Y: math.Round(outerR*math.Sin(theta2)*cosTilt*100) / 100,
			}

			for _, p := range []Point2D{p1, p2} {
				if p.X < minX {
					minX = p.X
				}
				if p.X > maxX {
					maxX = p.X
				}
				if p.Y < minY {
					minY = p.Y
				}
				if p.Y > maxY {
					maxY = p.Y
				}
			}

			chordPath := fmt.Sprintf("M %.2f %.2f L %.2f %.2f", p1.X, p1.Y, p2.X, p2.Y)
			unifiedPath.WriteString(chordPath + " ")

			loops[k] = ToroidLoop{
				Index:   k + 1,
				Angle:   math.Round(theta1*180.0/math.Pi*10) / 10,
				Center:  Point2D{X: 0, Y: 0},
				SVGPath: chordPath,
			}
		}

	default: // "discrete_rings" (default): Circumscribed precessing rings that fail to close to the same origin
		for k := 0; k < N; k++ {
			centerAngle := float64(k) * stepAngle
			precessionAngle := float64(k) * missMarginRad

			cx := (params.MajorRadius * math.Cos(centerAngle)) * params.Scale
			cy := (params.MajorRadius * math.Sin(centerAngle) * cosTilt) * params.Scale

			var loopPath strings.Builder
			loopPoints := make([]Point2D, params.WindingStep+1)

			for s := 0; s <= params.WindingStep; s++ {
				phi := (float64(s) / float64(params.WindingStep)) * 2.0 * math.Pi

				localX := params.MinorRadius * math.Cos(phi)
				localY := params.MinorRadius * math.Sin(phi)

				rotX := localX*math.Cos(precessionAngle) - localY*math.Sin(precessionAngle)
				rotY := localX*math.Sin(precessionAngle) + localY*math.Cos(precessionAngle)

				gx := cx + rotX*params.Scale
				gy := cy + (rotY*cosTilt)*params.Scale

				pt := Point2D{
					X: math.Round(gx*100) / 100,
					Y: math.Round(gy*100) / 100,
				}
				loopPoints[s] = pt

				if pt.X < minX {
					minX = pt.X
				}
				if pt.X > maxX {
					maxX = pt.X
				}
				if pt.Y < minY {
					minY = pt.Y
				}
				if pt.Y > maxY {
					maxY = pt.Y
				}

				if s == 0 {
					loopPath.WriteString(fmt.Sprintf("M %.2f %.2f", pt.X, pt.Y))
				} else {
					loopPath.WriteString(fmt.Sprintf(" L %.2f %.2f", pt.X, pt.Y))
				}
			}
			loopPath.WriteString(" Z")

			lpStr := loopPath.String()
			unifiedPath.WriteString(lpStr + " ")

			loops[k] = ToroidLoop{
				Index:   k + 1,
				Angle:   math.Round(centerAngle*180.0/math.Pi*10) / 10,
				Center:  Point2D{X: math.Round(cx*100) / 100, Y: math.Round(cy*100) / 100},
				SVGPath: lpStr,
			}
		}
	}

	closureGap := 2.0 * params.MinorRadius * math.Sin(missMarginRad/2.0) * params.Scale
	innerHoleRadius := math.Abs(params.MajorRadius-params.MinorRadius) * params.Scale
	outerRadius := (params.MajorRadius + params.MinorRadius) * params.Scale

	formulas := map[string]string{
		"toroid_orbit_center": "C_k = (R · cos(k · Δθ), R · sin(k · Δθ) · cos(α))",
		"precession_advance":  "θ_precess = k · (2π / N + δ_miss)",
		"event_horizon_void":  "r_hole = |R - r| · Scale  [Singularity Boundary / Void]",
		"outer_perimeter":     "r_outer = (R + r) · Scale  [Perceptual Torus Boundary]",
		"miss_margin_closure": "Gap = 2 · r · sin(δ_miss / 2)  [Non-closure spatial deviation]",
		"sacred_ratio":        "Toroidal Aspect Ratio = R / r ≈ 1.368 (Harmonic Akasha Balance)",
	}

	philosophy := "The Toroidal Singularity represents the primordial pulse of Akasha (Spanda)—the self-organizing vortex of all sovereign creation. Each circumscribed line traces an orbit around the central void, yet by design, intentionally misses its origin point by a deliberate margin (δ). This non-closure prevents inert stagnation and drives continuous eternal renewal. At the center lies the pitch-black Event Horizon—the unmanifest Bindu—surrounded by a shimmering luminous mesh of circumscribed light."

	return ToroidGeometryResult{
		Params:           params,
		SVGPath:          strings.TrimSpace(unifiedPath.String()),
		Loops:            loops,
		BoundingBox:      BoundingBox{MinX: minX, MaxX: maxX, MinY: minY, MaxY: maxY},
		InnerHoleRadius:  math.Round(innerHoleRadius*100) / 100,
		OuterRadius:      math.Round(outerRadius*100) / 100,
		ClosureGap:       math.Round(closureGap*100) / 100,
		TotalFilaments:   N,
		Formulas:         formulas,
		SacredPhilosophy: philosophy,
	}
}

// HarmonicLineState represents the real-time continuous wave state for an individual filament.
type HarmonicLineState struct {
	Index       int     `json:"index"`
	Hue         float64 `json:"hue"`
	Saturation  float64 `json:"saturation"`
	Lightness   float64 `json:"lightness"`
	Opacity     float64 `json:"opacity"`
	StrokeWidth float64 `json:"stroke_width"`
	FrequencyHz float64 `json:"frequency_hz"`
}

// ContinuousHarmonicFrame encapsulates a live continuous flow frame computed by the engine.
type ContinuousHarmonicFrame struct {
	FrameIndex   int64               `json:"frame_index"`
	TimestampSec float64             `json:"timestamp_sec"`
	Phase        float64             `json:"phase"`
	CausticLevel float64             `json:"caustic_level"`
	LineStates   []HarmonicLineState `json:"line_states"`
}

var solfeggioBase = []struct {
	Hz  float64
	Hue float64
}{
	{174, 0},
	{285, 30},
	{396, 45},
	{417, 90},
	{528, 155},
	{639, 195},
	{741, 235},
	{852, 275},
	{963, 320},
}

var chakraBase = []struct {
	Name string
	Hue  float64
}{
	{"Muladhara", 0},     // Root (Red)
	{"Svadhisthana", 24},  // Sacral (Orange)
	{"Manipura", 50},      // Solar Plexus (Gold/Yellow)
	{"Anahata", 155},      // Heart (Emerald)
	{"Vishuddha", 190},    // Throat (Cyan)
	{"Ajna", 240},         // Third Eye (Indigo)
	{"Sahasrara", 280},    // Crown (Violet)
}

var alchemicalBase = []struct {
	Name string
	Hue  float64
}{
	{"Aurum_Gold", 42},
	{"Argentum_Silver", 210},
	{"Cuprum_Copper", 28},
	{"Ferrum_Iron", 220},
	{"Hydrargyrum_Quicksilver", 195},
	{"Aether_Violet", 270},
}

// HexToRGB parses a hex color string (#RGB or #RRGGBB) to 0.0-1.0 float RGB values.
func HexToRGB(hex string) (r, g, b float64) {
	hex = strings.TrimPrefix(hex, "#")
	if len(hex) == 3 {
		hex = string([]byte{hex[0], hex[0], hex[1], hex[1], hex[2], hex[2]})
	}
	if len(hex) != 6 {
		return 0.8, 0.8, 0.9 // fallback light slate
	}
	val, err := strconv.ParseUint(hex, 16, 32)
	if err != nil {
		return 0.8, 0.8, 0.9
	}
	r = float64((val>>16)&0xFF) / 255.0
	g = float64((val>>8)&0xFF) / 255.0
	b = float64(val&0xFF) / 255.0
	return
}

// RGBToHSL converts float RGB (0-1) to HSL (H: 0-360, S: 0-100, L: 0-100).
func RGBToHSL(r, g, b float64) (h, s, l float64) {
	max := math.Max(r, math.Max(g, b))
	min := math.Min(r, math.Min(g, b))
	delta := max - min
	l = (max + min) / 2.0

	if delta == 0 {
		return 0, 0, l * 100.0
	}

	if l < 0.5 {
		s = delta / (max + min)
	} else {
		s = delta / (2.0 - max - min)
	}

	if max == r {
		h = (g - b) / delta
		if g < b {
			h += 6.0
		}
	} else if max == g {
		h = (b-r)/delta + 2.0
	} else {
		h = (r-g)/delta + 4.0
	}
	h *= 60.0
	s *= 100.0
	l *= 100.0
	return
}

// ComputeContinuousHarmonicFrame generates mathematical frequency states for N lines at continuous time tSec.
func ComputeContinuousHarmonicFrame(
	lineCount int,
	tSec float64,
	waveMode string,
	multiplier int,
	palette string,
	frameIdx int64,
	customColors ...string,
) ContinuousHarmonicFrame {
	if lineCount < 12 {
		lineCount = 108
	}
	if multiplier < 1 {
		multiplier = 1
	}

	phase := math.Mod(tSec*0.125, 1.0) // Continuous 8-second base cycle without discontinuities
	if phase < 0 {
		phase += 1.0
	}

	// Pre-parse custom colors if provided
	parsedCustom := make([]struct{ r, g, b, h, s, l float64 }, 0, len(customColors))
	for _, c := range customColors {
		trimmed := strings.TrimSpace(c)
		if trimmed != "" {
			cr, cg, cb := HexToRGB(trimmed)
			ch, cs, cl := RGBToHSL(cr, cg, cb)
			parsedCustom = append(parsedCustom, struct{ r, g, b, h, s, l float64 }{cr, cg, cb, ch, cs, cl})
		}
	}

	lineStates := make([]HarmonicLineState, lineCount)
	caustic := (math.Sin(2*math.Pi*phase) + 1.0) * 0.5

	for k := 0; k < lineCount; k++ {
		frac := float64(k) / float64(lineCount)
		var waveFactor float64

		switch waveMode {
		case "singularity_ingestion":
			waveFactor = math.Cos(2 * math.Pi * (frac*2.0 + phase*float64(multiplier)))
		case "standing_wave":
			waveFactor = math.Sin(2*math.Pi*frac*float64(multiplier)) * math.Cos(2*math.Pi*phase)
		case "doppler_vortex":
			waveFactor = math.Sin(2 * math.Pi * (math.Pow(frac, 1.5)*float64(multiplier) - phase))
		default: // "orbital_swirl"
			waveFactor = math.Sin(2 * math.Pi * (frac*float64(multiplier) - phase))
		}

		var hue, sat, light float64
		switch palette {
		case "solfeggio":
			solfLen := float64(len(solfeggioBase))
			sIdx := math.Mod(frac*solfLen+phase*3.0, solfLen)
			if sIdx < 0 {
				sIdx += solfLen
			}
			i0 := int(sIdx)
			i1 := (i0 + 1) % len(solfeggioBase)
			mix := sIdx - float64(i0)
			hue = solfeggioBase[i0].Hue*(1.0-mix) + solfeggioBase[i1].Hue*mix
			sat = 90.0
			light = 50.0 + waveFactor*18.0

		case "chakra":
			chkLen := float64(len(chakraBase))
			cIdx := math.Mod(frac*chkLen+phase*2.0, chkLen)
			if cIdx < 0 {
				cIdx += chkLen
			}
			i0 := int(cIdx)
			i1 := (i0 + 1) % len(chakraBase)
			mix := cIdx - float64(i0)
			hue = chakraBase[i0].Hue*(1.0-mix) + chakraBase[i1].Hue*mix
			sat = 92.0
			light = 52.0 + waveFactor*16.0

		case "alchemical":
			alcLen := float64(len(alchemicalBase))
			aIdx := math.Mod(frac*alcLen+phase*2.0, alcLen)
			if aIdx < 0 {
				aIdx += alcLen
			}
			i0 := int(aIdx)
			i1 := (i0 + 1) % len(alchemicalBase)
			mix := aIdx - float64(i0)
			hue = alchemicalBase[i0].Hue*(1.0-mix) + alchemicalBase[i1].Hue*mix
			sat = 88.0
			light = 54.0 + waveFactor*18.0

		case "pythagorean":
			pythSteps := (k * 7) % 12
			hue = math.Mod((float64(pythSteps)/12.0)*360.0+phase*180.0, 360.0)
			sat = 80.0
			light = 52.0 + waveFactor*15.0

		case "synesthesia":
			hue = math.Mod(frac*360.0+phase*360.0, 360.0)
			sat = 95.0
			light = 55.0 + waveFactor*15.0

		case "bioluminescent":
			hue = 155.0 + math.Mod((frac+phase), 1.0)*65.0
			sat = 95.0
			light = 58.0 + waveFactor*20.0

		case "golden_angle":
			// 137.507764° Golden Angle phyllotaxis stepping
			baseH := 35.0 // Warm solar default
			if len(parsedCustom) > 0 {
				baseH = parsedCustom[0].h
			}
			hue = math.Mod(baseH+float64(k)*137.507764+phase*360.0, 360.0)
			if hue < 0 {
				hue += 360.0
			}
			sat = 90.0
			light = 52.0 + waveFactor*18.0

		case "iridescent":
			// Thin-film optical interference
			baseH := 180.0
			if len(parsedCustom) > 0 {
				baseH = parsedCustom[0].h
			}
			hue = math.Mod(baseH+120.0*math.Sin(2.0*math.Pi*(frac*3.0-phase))+360.0, 360.0)
			sat = 95.0
			light = 55.0 + waveFactor*20.0

		case "dual_zone":
			// Core vs Perimeter blend
			h0, s0 := 40.0, 90.0
			h1, s1 := 200.0, 85.0
			if len(parsedCustom) >= 2 {
				h0, s0 = parsedCustom[0].h, parsedCustom[0].s
				h1, s1 = parsedCustom[1].h, parsedCustom[1].s
			} else if len(parsedCustom) == 1 {
				h0, s0 = parsedCustom[0].h, parsedCustom[0].s
			}
			// Falloff along radius fraction
			blend := math.Sin(frac * math.Pi * 0.5)
			hue = math.Mod(h0*(1.0-blend)+h1*blend+phase*60.0, 360.0)
			sat = s0*(1.0-blend) + s1*blend
			light = 50.0 + waveFactor*18.0

		case "solid_tint":
			if len(parsedCustom) > 0 {
				hue = parsedCustom[0].h
				sat = parsedCustom[0].s
				light = math.Min(90.0, math.Max(20.0, parsedCustom[0].l+waveFactor*18.0))
			} else {
				hue = 210.0
				sat = 75.0
				light = 55.0 + waveFactor*20.0
			}

		case "custom_spectrum":
			if len(parsedCustom) >= 2 {
				numStops := float64(len(parsedCustom))
				pos := math.Mod(frac*numStops+phase*float64(multiplier), numStops)
				if pos < 0 {
					pos += numStops
				}
				i0 := int(pos)
				i1 := (i0 + 1) % len(parsedCustom)
				t := pos - float64(i0)

				// Direct RGB interpolation then convert to HSL for uniform brightness
				ir := parsedCustom[i0].r*(1.0-t) + parsedCustom[i1].r*t
				ig := parsedCustom[i0].g*(1.0-t) + parsedCustom[i1].g*t
				ib := parsedCustom[i0].b*(1.0-t) + parsedCustom[i1].b*t
				hue, sat, light = RGBToHSL(ir, ig, ib)
				light = math.Min(90.0, math.Max(20.0, light+waveFactor*15.0))
			} else if len(parsedCustom) == 1 {
				hue = parsedCustom[0].h
				sat = parsedCustom[0].s
				light = math.Min(90.0, math.Max(20.0, parsedCustom[0].l+waveFactor*18.0))
			} else {
				hue = math.Mod(frac*360.0+phase*360.0, 360.0)
				sat = 90.0
				light = 52.0 + waveFactor*18.0
			}

		default: // "monochrome"
			hue = 215.0
			sat = 15.0
			light = 65.0 + waveFactor*25.0
		}

		if hue < 0 {
			hue = math.Mod(hue+360.0, 360.0)
		}

		opacity := 0.20 + (waveFactor+1.0)*0.38
		if opacity < 0.15 {
			opacity = 0.15
		} else if opacity > 0.98 {
			opacity = 0.98
		}

		strokeW := 0.65 + math.Abs(waveFactor)*0.65

		// Musical audio frequency mapping (174Hz to 963Hz logarithmic)
		freqHz := 174.0 * math.Pow(963.0/174.0, frac)

		lineStates[k] = HarmonicLineState{
			Index:       k + 1,
			Hue:         math.Round(hue*10) / 10,
			Saturation:  math.Round(sat*10) / 10,
			Lightness:   math.Round(light*10) / 10,
			Opacity:     math.Round(opacity*100) / 100,
			StrokeWidth: math.Round(strokeW*100) / 100,
			FrequencyHz: math.Round(freqHz*10) / 10,
		}
	}

	return ContinuousHarmonicFrame{
		FrameIndex:   frameIdx,
		TimestampSec: math.Round(tSec*1000) / 1000,
		Phase:        math.Round(phase*1000) / 1000,
		CausticLevel: math.Round(caustic*1000) / 1000,
		LineStates:   lineStates,
	}
}

