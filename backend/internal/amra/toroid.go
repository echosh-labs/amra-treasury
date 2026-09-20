package amra

import (
	"fmt"
	"math"
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
