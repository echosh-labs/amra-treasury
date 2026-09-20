package amra

import (
	"math"
	"testing"
)

func TestCalculateToroidGeometry(t *testing.T) {
	// 1. Default parameters
	params := DefaultToroidParams()
	res := CalculateToroidGeometry(params)

	if len(res.Loops) != 108 {
		t.Fatalf("expected 108 loops, got %d", len(res.Loops))
	}
	if res.InnerHoleRadius <= 0 {
		t.Fatalf("expected positive inner hole radius, got %f", res.InnerHoleRadius)
	}
	expectedHole := math.Abs(params.MajorRadius - params.MinorRadius)
	if math.Abs(res.InnerHoleRadius-expectedHole) > 0.01 {
		t.Errorf("inner hole radius mismatch: expected %f, got %f", expectedHole, res.InnerHoleRadius)
	}
	if res.SVGPath == "" {
		t.Error("expected non-empty SVGPath")
	}
	if res.ClosureGap <= 0 {
		t.Error("expected non-zero closure gap with miss margin > 0")
	}
	if len(res.Formulas) == 0 {
		t.Error("expected mathematical formulas in response")
	}

	// 2. Continuous mode
	paramsCont := DefaultToroidParams()
	paramsCont.Mode = "continuous"
	paramsCont.LineCount = 36
	resCont := CalculateToroidGeometry(paramsCont)
	if resCont.SVGPath == "" {
		t.Error("expected non-empty SVGPath in continuous mode")
	}

	// 3. Chords mode
	paramsChords := DefaultToroidParams()
	paramsChords.Mode = "chords"
	paramsChords.LineCount = 48
	resChords := CalculateToroidGeometry(paramsChords)
	if len(resChords.Loops) != 48 {
		t.Errorf("expected 48 loops in chords mode, got %d", len(resChords.Loops))
	}
	if resChords.SVGPath == "" {
		t.Error("expected non-empty SVGPath in chords mode")
	}
}
