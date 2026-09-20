package studio

import (
	"image"
	"image/color"
	"math"
	"sort"
)

// Point2D represents a subpixel Cartesian coordinate.
type Point2D struct {
	X float64
	Y float64
}

// GradientStop defines a color stop along a radial or linear gradient.
type GradientStop struct {
	Offset float64
	Color  color.RGBA
}

// ThemePalette captures the multi-stop chromatic expression of sacred objects.
type ThemePalette struct {
	ID          string
	Name        string
	BodyStops   [4]color.RGBA
	StrokeColor color.RGBA
	BijaStops   [4]color.RGBA
	BijaStroke  color.RGBA
	LeafFill    color.RGBA
	LeafStroke  color.RGBA
	AuraGlow    color.RGBA
}

// Canonical theme palettes matching the frontend visualizer.
var canonicalThemes = map[string]ThemePalette{
	"pakva_gold": {
		ID:   "pakva_gold",
		Name: "Pakva (Ripe Nectar)",
		BodyStops: [4]color.RGBA{
			{R: 254, G: 240, B: 138, A: 250}, // #fef08a
			{R: 245, G: 158, B: 11, A: 245},  // #f59e0b
			{R: 180, G: 83, B: 9, A: 235},    // #b45309
			{R: 69, G: 26, B: 3, A: 245},     // #451a03
		},
		StrokeColor: color.RGBA{R: 245, G: 158, B: 11, A: 255},
		BijaStops: [4]color.RGBA{
			{R: 255, G: 255, B: 255, A: 255}, // #ffffff
			{R: 254, G: 243, B: 199, A: 240}, // #fef3c7
			{R: 217, G: 119, B: 6, A: 210},   // #d97706
			{R: 120, G: 53, B: 15, A: 160},   // #78350f
		},
		BijaStroke: color.RGBA{R: 251, G: 191, B: 36, A: 255},
		LeafFill:   color.RGBA{R: 6, G: 95, B: 70, A: 240},
		LeafStroke: color.RGBA{R: 52, G: 211, B: 153, A: 255},
		AuraGlow:   color.RGBA{R: 245, G: 158, B: 11, A: 75},
	},
	"aama_emerald": {
		ID:   "aama_emerald",
		Name: "Āma (Raw Vitality)",
		BodyStops: [4]color.RGBA{
			{R: 236, G: 253, B: 245, A: 250}, // #ecfdf5
			{R: 16, G: 185, B: 129, A: 245},  // #10b981
			{R: 4, G: 120, B: 87, A: 235},    // #047857
			{R: 6, G: 78, B: 59, A: 245},     // #064e3b
		},
		StrokeColor: color.RGBA{R: 52, G: 211, B: 153, A: 255},
		BijaStops: [4]color.RGBA{
			{R: 255, G: 255, B: 255, A: 255}, // #ffffff
			{R: 209, G: 250, B: 229, A: 240}, // #d1fae5
			{R: 5, G: 150, B: 105, A: 210},   // #059669
			{R: 6, G: 78, B: 59, A: 160},     // #064e3b
		},
		BijaStroke: color.RGBA{R: 110, G: 231, B: 183, A: 255},
		LeafFill:   color.RGBA{R: 2, G: 44, B: 34, A: 240},
		LeafStroke: color.RGBA{R: 16, G: 185, B: 129, A: 255},
		AuraGlow:   color.RGBA{R: 16, G: 185, B: 129, A: 75},
	},
	"samudra_churning": {
		ID:   "samudra_churning",
		Name: "Samudra (Alchemical Ocean)",
		BodyStops: [4]color.RGBA{
			{R: 245, G: 243, B: 255, A: 250}, // #f5f3ff
			{R: 139, G: 92, B: 246, A: 245},  // #8b5cf6
			{R: 76, G: 29, B: 149, A: 235},   // #4c1d95
			{R: 15, G: 23, B: 42, A: 245},    // #0f172a
		},
		StrokeColor: color.RGBA{R: 192, G: 132, B: 252, A: 255},
		BijaStops: [4]color.RGBA{
			{R: 255, G: 255, B: 255, A: 255}, // #ffffff
			{R: 237, G: 233, B: 254, A: 240}, // #ede9fe
			{R: 124, G: 58, B: 237, A: 210},  // #7c3aed
			{R: 46, G: 16, B: 101, A: 160},   // #2e1065
		},
		BijaStroke: color.RGBA{R: 168, G: 85, B: 247, A: 255},
		LeafFill:   color.RGBA{R: 30, G: 27, B: 75, A: 240},
		LeafStroke: color.RGBA{R: 99, G: 102, B: 241, A: 255},
		AuraGlow:   color.RGBA{R: 139, G: 92, B: 246, A: 75},
	},
	"surya_agni": {
		ID:   "surya_agni",
		Name: "Sūrya Agni (Solar Fire)",
		BodyStops: [4]color.RGBA{
			{R: 255, G: 241, B: 242, A: 250}, // #fff1f2
			{R: 244, G: 63, B: 94, A: 245},   // #f43f5e
			{R: 190, G: 18, B: 60, A: 235},   // #be123c
			{R: 76, G: 5, B: 25, A: 245},     // #4c0519
		},
		StrokeColor: color.RGBA{R: 251, G: 113, B: 133, A: 255},
		BijaStops: [4]color.RGBA{
			{R: 255, G: 255, B: 255, A: 255}, // #ffffff
			{R: 255, G: 247, B: 237, A: 240}, // #fff7ed
			{R: 234, G: 88, B: 12, A: 210},   // #ea580c
			{R: 124, G: 45, B: 18, A: 160},   // #7c2d12
		},
		BijaStroke: color.RGBA{R: 253, G: 186, B: 116, A: 255},
		LeafFill:   color.RGBA{R: 120, G: 53, B: 15, A: 240},
		LeafStroke: color.RGBA{R: 245, G: 158, B: 11, A: 255},
		AuraGlow:   color.RGBA{R: 244, G: 63, B: 94, A: 75},
	},
	"amara_pearl": {
		ID:   "amara_pearl",
		Name: "Amara (Transcendent Pearl)",
		BodyStops: [4]color.RGBA{
			{R: 255, G: 255, B: 255, A: 255}, // #ffffff
			{R: 241, G: 245, B: 249, A: 245}, // #f1f5f9
			{R: 203, G: 213, B: 225, A: 235}, // #cbd5e1
			{R: 51, G: 65, B: 85, A: 245},    // #334155
		},
		StrokeColor: color.RGBA{R: 226, G: 232, B: 240, A: 255},
		BijaStops: [4]color.RGBA{
			{R: 255, G: 255, B: 255, A: 255}, // #ffffff
			{R: 255, G: 255, B: 255, A: 245}, // #ffffff
			{R: 226, G: 232, B: 240, A: 220}, // #e2e8f0
			{R: 100, G: 116, B: 139, A: 160}, // #64748b
		},
		BijaStroke: color.RGBA{R: 248, G: 250, B: 252, A: 255},
		LeafFill:   color.RGBA{R: 15, G: 23, B: 42, A: 240},
		LeafStroke: color.RGBA{R: 148, G: 163, B: 184, A: 255},
		AuraGlow:   color.RGBA{R: 255, G: 255, B: 255, A: 60},
	},
}

// GetTheme returns the palette for themeID, falling back to pakva_gold.
func GetTheme(themeID string) ThemePalette {
	if t, ok := canonicalThemes[themeID]; ok {
		return t
	}
	return canonicalThemes["pakva_gold"]
}

// InterpolateColor blends two RGBA colors linearly.
func InterpolateColor(c1, c2 color.RGBA, t float64) color.RGBA {
	if t <= 0 {
		return c1
	}
	if t >= 1 {
		return c2
	}
	inv := 1.0 - t
	return color.RGBA{
		R: uint8(float64(c1.R)*inv + float64(c2.R)*t),
		G: uint8(float64(c1.G)*inv + float64(c2.G)*t),
		B: uint8(float64(c1.B)*inv + float64(c2.B)*t),
		A: uint8(float64(c1.A)*inv + float64(c2.A)*t),
	}
}

// InterpolateTheme smoothly morphs from t1 to t2 along factor [0, 1].
func InterpolateTheme(t1, t2 ThemePalette, factor float64) ThemePalette {
	if factor <= 0 {
		return t1
	}
	if factor >= 1 {
		return t2
	}
	var res ThemePalette
	res.ID = t1.ID
	for i := 0; i < 4; i++ {
		res.BodyStops[i] = InterpolateColor(t1.BodyStops[i], t2.BodyStops[i], factor)
		res.BijaStops[i] = InterpolateColor(t1.BijaStops[i], t2.BijaStops[i], factor)
	}
	res.StrokeColor = InterpolateColor(t1.StrokeColor, t2.StrokeColor, factor)
	res.BijaStroke = InterpolateColor(t1.BijaStroke, t2.BijaStroke, factor)
	res.LeafFill = InterpolateColor(t1.LeafFill, t2.LeafFill, factor)
	res.LeafStroke = InterpolateColor(t1.LeafStroke, t2.LeafStroke, factor)
	res.AuraGlow = InterpolateColor(t1.AuraGlow, t2.AuraGlow, factor)
	return res
}

// BlendOver blends src over dst in place.
func BlendOver(dst *color.RGBA, src color.RGBA) {
	if src.A == 0 {
		return
	}
	if src.A == 255 {
		*dst = src
		return
	}
	sa := float64(src.A) / 255.0
	da := float64(dst.A) / 255.0
	outA := sa + da*(1.0-sa)
	if outA <= 0 {
		return
	}

	outR := (float64(src.R)*sa + float64(dst.R)*da*(1.0-sa)) / outA
	outG := (float64(src.G)*sa + float64(dst.G)*da*(1.0-sa)) / outA
	outB := (float64(src.B)*sa + float64(dst.B)*da*(1.0-sa)) / outA

	dst.R = uint8(math.Min(255, math.Max(0, outR)))
	dst.G = uint8(math.Min(255, math.Max(0, outG)))
	dst.B = uint8(math.Min(255, math.Max(0, outB)))
	dst.A = uint8(math.Min(255, math.Max(0, outA*255.0)))
}

// BuildGradientLUT produces a 256-entry lookup table for radial gradient sampling.
func BuildGradientLUT(stops []GradientStop) [256]color.RGBA {
	var lut [256]color.RGBA
	if len(stops) == 0 {
		return lut
	}
	if len(stops) == 1 {
		for i := range lut {
			lut[i] = stops[0].Color
		}
		return lut
	}

	for i := 0; i < 256; i++ {
		t := float64(i) / 255.0
		if t <= stops[0].Offset {
			lut[i] = stops[0].Color
			continue
		}
		if t >= stops[len(stops)-1].Offset {
			lut[i] = stops[len(stops)-1].Color
			continue
		}

		for j := 0; j < len(stops)-1; j++ {
			if t >= stops[j].Offset && t <= stops[j+1].Offset {
				span := stops[j+1].Offset - stops[j].Offset
				localT := 0.0
				if span > 0 {
					localT = (t - stops[j].Offset) / span
				}
				lut[i] = InterpolateColor(stops[j].Color, stops[j+1].Color, localT)
				break
			}
		}
	}
	return lut
}

// FillRadialWallpaper rasterizes the multi-stop atmospheric cosmic background directly into img.Pix.
func FillRadialWallpaper(img *image.RGBA, w, h int, style string) {
	var stops []GradientStop
	switch style {
	case "emerald_matrix":
		stops = []GradientStop{
			{Offset: 0.0, Color: color.RGBA{R: 6, G: 48, B: 36, A: 255}},  // #063024
			{Offset: 0.5, Color: color.RGBA{R: 2, G: 22, B: 16, A: 255}},  // #021610
			{Offset: 1.0, Color: color.RGBA{R: 2, G: 6, B: 23, A: 255}},   // #020617
		}
	case "solar_corona":
		stops = []GradientStop{
			{Offset: 0.0, Color: color.RGBA{R: 56, G: 20, B: 0, A: 255}},  // #381400
			{Offset: 0.5, Color: color.RGBA{R: 28, G: 7, B: 0, A: 255}},   // #1c0700
			{Offset: 1.0, Color: color.RGBA{R: 2, G: 6, B: 23, A: 255}},   // #020617
		}
	case "obsidian":
		stops = []GradientStop{
			{Offset: 0.0, Color: color.RGBA{R: 2, G: 6, B: 23, A: 255}},
			{Offset: 1.0, Color: color.RGBA{R: 2, G: 6, B: 23, A: 255}},
		}
	default: // "cosmic_aurora" (default)
		stops = []GradientStop{
			{Offset: 0.0, Color: color.RGBA{R: 31, G: 15, B: 56, A: 255}}, // #1f0f38
			{Offset: 0.5, Color: color.RGBA{R: 13, G: 6, B: 28, A: 255}},  // #0d061c
			{Offset: 1.0, Color: color.RGBA{R: 2, G: 6, B: 23, A: 255}},   // #020617
		}
	}

	lut := BuildGradientLUT(stops)
	cx := float64(w) / 2.0
	cy := float64(h) / 2.0
	rMax := math.Max(float64(w), float64(h)) * 0.75
	invRMax := 1.0 / rMax

	stride := img.Stride
	pix := img.Pix

	for y := 0; y < h; y++ {
		dy := float64(y) - cy
		dy2 := dy * dy
		rowOffset := y * stride

		for x := 0; x < w; x++ {
			dx := float64(x) - cx
			dist := math.Sqrt(dx*dx + dy2)
			t := dist * invRMax
			if t > 1.0 {
				t = 1.0
			}
			idx := int(t * 255.0)

			c := lut[idx]
			pixOffset := rowOffset + x*4
			pix[pixOffset] = c.R
			pix[pixOffset+1] = c.G
			pix[pixOffset+2] = c.B
			pix[pixOffset+3] = 255
		}
	}
}

// DrawRadialGlow renders a smooth radial gradient wash into the image buffer with alpha blending.
func DrawRadialGlow(img *image.RGBA, cx, cy, r0, r1 float64, lut [256]color.RGBA, opacity float64) {
	if r1 <= r0 || opacity <= 0 {
		return
	}
	span := r1 - r0
	invSpan := 1.0 / span

	minX := int(math.Max(0, math.Floor(cx-r1)))
	maxX := int(math.Min(float64(img.Bounds().Dx()-1), math.Ceil(cx+r1)))
	minY := int(math.Max(0, math.Floor(cy-r1)))
	maxY := int(math.Min(float64(img.Bounds().Dy()-1), math.Ceil(cy+r1)))

	stride := img.Stride
	pix := img.Pix

	for y := minY; y <= maxY; y++ {
		dy := float64(y) - cy
		dy2 := dy * dy
		rowOffset := y * stride

		for x := minX; x <= maxX; x++ {
			dx := float64(x) - cx
			dist := math.Sqrt(dx*dx + dy2)

			if dist < r0 || dist > r1 {
				continue
			}

			t := (dist - r0) * invSpan
			if t < 0 {
				t = 0
			} else if t > 1.0 {
				t = 1.0
			}
			idx := int(t * 255.0)
			src := lut[idx]
			if src.A == 0 {
				continue
			}

			srcA := uint8(float64(src.A) * opacity)
			if srcA == 0 {
				continue
			}
			src.A = srcA

			pixOffset := rowOffset + x*4
			dst := color.RGBA{
				R: pix[pixOffset],
				G: pix[pixOffset+1],
				B: pix[pixOffset+2],
				A: pix[pixOffset+3],
			}
			BlendOver(&dst, src)
			pix[pixOffset] = dst.R
			pix[pixOffset+1] = dst.G
			pix[pixOffset+2] = dst.B
			pix[pixOffset+3] = dst.A
		}
	}
}

// DrawLineAA draws a high-precision antialiased line segment using the Xiaolin Wu algorithm.
func DrawLineAA(img *image.RGBA, x0, y0, x1, y1 float64, col color.RGBA, width float64) {
	if col.A == 0 {
		return
	}

	w := img.Bounds().Dx()
	h := img.Bounds().Dy()

	plot := func(x, y int, c float64) {
		if x < 0 || x >= w || y < 0 || y >= h || c <= 0 {
			return
		}
		pixOffset := y*img.Stride + x*4
		alpha := uint8(math.Min(255, float64(col.A)*c))
		if alpha == 0 {
			return
		}
		src := color.RGBA{R: col.R, G: col.G, B: col.B, A: alpha}
		dst := color.RGBA{
			R: img.Pix[pixOffset],
			G: img.Pix[pixOffset+1],
			B: img.Pix[pixOffset+2],
			A: img.Pix[pixOffset+3],
		}
		BlendOver(&dst, src)
		img.Pix[pixOffset] = dst.R
		img.Pix[pixOffset+1] = dst.G
		img.Pix[pixOffset+2] = dst.B
		img.Pix[pixOffset+3] = dst.A
	}

	steep := math.Abs(y1-y0) > math.Abs(x1-x0)
	if steep {
		x0, y0 = y0, x0
		x1, y1 = y1, x1
	}
	if x0 > x1 {
		x0, x1 = x1, x0
		y0, y1 = y1, y0
	}

	dx := x1 - x0
	dy := y1 - y0
	gradient := 0.0
	if dx != 0 {
		gradient = dy / dx
	}

	// Handle first endpoint
	xend := math.Round(x0)
	yend := y0 + gradient*(xend-x0)
	xgap := 1.0 - (x0+0.5-math.Floor(x0+0.5))
	xpxl1 := int(xend)
	ypxl1 := int(math.Floor(yend))

	rfpart := func(v float64) float64 { return 1.0 - (v - math.Floor(v)) }
	fpart := func(v float64) float64 { return v - math.Floor(v) }

	if steep {
		plot(ypxl1, xpxl1, rfpart(yend)*xgap)
		plot(ypxl1+1, xpxl1, fpart(yend)*xgap)
	} else {
		plot(xpxl1, ypxl1, rfpart(yend)*xgap)
		plot(xpxl1, ypxl1+1, fpart(yend)*xgap)
	}
	intery := yend + gradient

	// Handle second endpoint
	xend = math.Round(x1)
	yend = y1 + gradient*(xend-x1)
	xgap = x1 + 0.5 - math.Floor(x1+0.5)
	xpxl2 := int(xend)
	ypxl2 := int(math.Floor(yend))

	if steep {
		plot(ypxl2, xpxl2, rfpart(yend)*xgap)
		plot(ypxl2+1, xpxl2, fpart(yend)*xgap)
	} else {
		plot(xpxl2, ypxl2, rfpart(yend)*xgap)
		plot(xpxl2, ypxl2+1, fpart(yend)*xgap)
	}

	// Main loop along line length
	if steep {
		for x := xpxl1 + 1; x < xpxl2; x++ {
			yp := int(math.Floor(intery))
			plot(yp, x, rfpart(intery))
			plot(yp+1, x, fpart(intery))
			intery += gradient
		}
	} else {
		for x := xpxl1 + 1; x < xpxl2; x++ {
			yp := int(math.Floor(intery))
			plot(x, yp, rfpart(intery))
			plot(x, yp+1, fpart(intery))
			intery += gradient
		}
	}
}

// FillPolygonRadial fills an arbitrary closed polygon with a radial gradient centered at (cx, cy).
func FillPolygonRadial(img *image.RGBA, poly []Point2D, cx, cy, rMax float64, lut [256]color.RGBA, opacity float64) {
	if len(poly) < 3 || opacity <= 0 {
		return
	}

	// Find bounding box
	minY, maxY := poly[0].Y, poly[0].Y
	minX, maxX := poly[0].X, poly[0].X
	for _, p := range poly[1:] {
		if p.Y < minY {
			minY = p.Y
		}
		if p.Y > maxY {
			maxY = p.Y
		}
		if p.X < minX {
			minX = p.X
		}
		if p.X > maxX {
			maxX = p.X
		}
	}

	iMinY := int(math.Max(0, math.Floor(minY)))
	iMaxY := int(math.Min(float64(img.Bounds().Dy()-1), math.Ceil(maxY)))
	iMinX := int(math.Max(0, math.Floor(minX)))
	iMaxX := int(math.Min(float64(img.Bounds().Dx()-1), math.Ceil(maxX)))

	invRMax := 1.0 / rMax
	stride := img.Stride
	pix := img.Pix
	n := len(poly)

	var nodeX []float64

	for y := iMinY; y <= iMaxY; y++ {
		scanY := float64(y) + 0.5
		nodeX = nodeX[:0]

		// Find polygon edge crossings at scanY
		j := n - 1
		for i := 0; i < n; i++ {
			yi := poly[i].Y
			yj := poly[j].Y
			if (yi < scanY && yj >= scanY) || (yj < scanY && yi >= scanY) {
				xi := poly[i].X
				xj := poly[j].X
				interX := xi + (scanY-yi)/(yj-yi)*(xj-xi)
				nodeX = append(nodeX, interX)
			}
			j = i
		}

		if len(nodeX) < 2 {
			continue
		}
		sort.Float64s(nodeX)

		dy := scanY - cy
		dy2 := dy * dy
		rowOffset := y * stride

		// Fill spans
		for k := 0; k < len(nodeX)-1; k += 2 {
			start := int(math.Max(float64(iMinX), math.Ceil(nodeX[k])))
			end := int(math.Min(float64(iMaxX), math.Floor(nodeX[k+1])))

			for x := start; x <= end; x++ {
				dx := float64(x) - cx
				dist := math.Sqrt(dx*dx + dy2)
				t := dist * invRMax
				if t < 0 {
					t = 0
				} else if t > 1.0 {
					t = 1.0
				}
				idx := int(t * 255.0)
				src := lut[idx]
				if src.A == 0 {
					continue
				}

				src.A = uint8(float64(src.A) * opacity)
				pixOffset := rowOffset + x*4
				dst := color.RGBA{
					R: pix[pixOffset],
					G: pix[pixOffset+1],
					B: pix[pixOffset+2],
					A: pix[pixOffset+3],
				}
				BlendOver(&dst, src)
				pix[pixOffset] = dst.R
				pix[pixOffset+1] = dst.G
				pix[pixOffset+2] = dst.B
				pix[pixOffset+3] = dst.A
			}
		}
	}
}

// FillPolygonSolid fills an arbitrary closed polygon with a solid color.
func FillPolygonSolid(img *image.RGBA, poly []Point2D, col color.RGBA) {
	if len(poly) < 3 || col.A == 0 {
		return
	}

	minY, maxY := poly[0].Y, poly[0].Y
	minX, maxX := poly[0].X, poly[0].X
	for _, p := range poly[1:] {
		if p.Y < minY {
			minY = p.Y
		}
		if p.Y > maxY {
			maxY = p.Y
		}
		if p.X < minX {
			minX = p.X
		}
		if p.X > maxX {
			maxX = p.X
		}
	}

	iMinY := int(math.Max(0, math.Floor(minY)))
	iMaxY := int(math.Min(float64(img.Bounds().Dy()-1), math.Ceil(maxY)))
	iMinX := int(math.Max(0, math.Floor(minX)))
	iMaxX := int(math.Min(float64(img.Bounds().Dx()-1), math.Ceil(maxX)))

	stride := img.Stride
	pix := img.Pix
	n := len(poly)
	var nodeX []float64

	for y := iMinY; y <= iMaxY; y++ {
		scanY := float64(y) + 0.5
		nodeX = nodeX[:0]

		j := n - 1
		for i := 0; i < n; i++ {
			yi := poly[i].Y
			yj := poly[j].Y
			if (yi < scanY && yj >= scanY) || (yj < scanY && yi >= scanY) {
				xi := poly[i].X
				xj := poly[j].X
				interX := xi + (scanY-yi)/(yj-yi)*(xj-xi)
				nodeX = append(nodeX, interX)
			}
			j = i
		}

		if len(nodeX) < 2 {
			continue
		}
		sort.Float64s(nodeX)
		rowOffset := y * stride

		for k := 0; k < len(nodeX)-1; k += 2 {
			start := int(math.Max(float64(iMinX), math.Ceil(nodeX[k])))
			end := int(math.Min(float64(iMaxX), math.Floor(nodeX[k+1])))

			for x := start; x <= end; x++ {
				pixOffset := rowOffset + x*4
				dst := color.RGBA{
					R: pix[pixOffset],
					G: pix[pixOffset+1],
					B: pix[pixOffset+2],
					A: pix[pixOffset+3],
				}
				BlendOver(&dst, col)
				pix[pixOffset] = dst.R
				pix[pixOffset+1] = dst.G
				pix[pixOffset+2] = dst.B
				pix[pixOffset+3] = dst.A
			}
		}
	}
}

// ComputeParametricKairiCurve evaluates the sacred Vedic Āmra geometry.
func ComputeParametricKairiCurve(
	cx, cy float64,
	scale, rx, ry, alpha, beta, gamma, offsetY float64,
	steps int,
) []Point2D {
	if steps < 20 {
		steps = 60
	}
	points := make([]Point2D, steps+1)

	for i := 0; i <= steps; i++ {
		t := (float64(i)/float64(steps))*2.0*math.Pi - math.Pi
		sinT := math.Sin(t)
		cosT := math.Cos(t)

		baseX := rx * sinT * (1.0 + alpha*cosT)
		crestEnvelope := math.Pow(1.0+cosT, 2) / 4.0
		hookX := gamma * crestEnvelope * (1.0 - 0.5*sinT)

		x := scale * (baseX + hookX)
		y := scale * (-ry*cosT + (ry*beta)*math.Pow(math.Sin(t/2.0), 2)*cosT + offsetY)

		points[i] = Point2D{X: cx + x, Y: cy + y}
	}
	return points
}

// ComputeParametricLeaves generates the 5 sacred crowning mango leaves.
func ComputeParametricLeaves(stemOrigin Point2D, scale float64) [][]Point2D {
	angles := []float64{-35.0, -18.0, 0.0, 18.0, 35.0}
	lengths := []float64{75.0, 95.0, 110.0, 95.0, 75.0}
	leaves := make([][]Point2D, 5)

	for i := 0; i < 5; i++ {
		rad := (angles[i] - 90.0) * math.Pi / 180.0
		lenPx := lengths[i] * scale

		tipX := stemOrigin.X + lenPx*math.Cos(rad)
		tipY := stemOrigin.Y + lenPx*math.Sin(rad)

		cp1x := stemOrigin.X + (lenPx*0.5)*math.Cos(rad-0.25)
		cp1y := stemOrigin.Y + (lenPx*0.5)*math.Sin(rad-0.25)
		cp2x := stemOrigin.X + (lenPx*0.5)*math.Cos(rad+0.25)
		cp2y := stemOrigin.Y + (lenPx*0.5)*math.Sin(rad+0.25)

		// Sample quadratic curve
		leafPoly := make([]Point2D, 24)
		for s := 0; s <= 10; s++ {
			t := float64(s) / 10.0
			invT := 1.0 - t
			px := invT*invT*stemOrigin.X + 2.0*invT*t*cp1x + t*t*tipX
			py := invT*invT*stemOrigin.Y + 2.0*invT*t*cp1y + t*t*tipY
			leafPoly[s] = Point2D{X: px, Y: py}
		}
		for s := 1; s <= 10; s++ {
			t := float64(s) / 10.0
			invT := 1.0 - t
			px := invT*invT*tipX + 2.0*invT*t*cp2x + t*t*stemOrigin.X
			py := invT*invT*tipY + 2.0*invT*t*cp2y + t*t*stemOrigin.Y
			leafPoly[10+s] = Point2D{X: px, Y: py}
		}
		leafPoly[21] = stemOrigin
		leaves[i] = leafPoly[:22]
	}
	return leaves
}

// HSLToRGBA converts hue (0-360), saturation (0-1), lightness (0-1), and alpha to color.RGBA.
func HSLToRGBA(h, s, l float64, a uint8) color.RGBA {
	h = math.Mod(h, 360.0)
	if h < 0 {
		h += 360.0
	}
	c := (1.0 - math.Abs(2.0*l-1.0)) * s
	x := c * (1.0 - math.Abs(math.Mod(h/60.0, 2.0)-1.0))
	m := l - c/2.0

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

	return color.RGBA{
		R: uint8(math.Min(255, math.Max(0, (rPrime+m)*255.0))),
		G: uint8(math.Min(255, math.Max(0, (gPrime+m)*255.0))),
		B: uint8(math.Min(255, math.Max(0, (bPrime+m)*255.0))),
		A: a,
	}
}

