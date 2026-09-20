package db

import (
	"encoding/json"
	"errors"
	"fmt"
)

// ArishadvargaDemon defines a classical inner adversary and its sovereign dharmic transmutation.
type ArishadvargaDemon struct {
	Index            int    `json:"index"`
	Key              string `json:"key"`               // "kama", "krodha", "lobha", "moha", "mada", "matsarya"
	Name             string `json:"name"`              // Sanskrit title with script
	ShadowDistortion string `json:"shadow_distortion"` // e.g. "Lust / Craving"
	TransmutedVirtue string `json:"transmuted_virtue"` // e.g. "Prema & Sankalpa"
	Teaching         string `json:"teaching"`          // Canonical spiritual transmutation guidance
}

// EsotericPhilosophyDoc stores the authoritative Āmra philosophy.
type EsotericPhilosophyDoc struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Subtitle    string   `json:"subtitle"`
	KarmaPhala  string   `json:"karma_phala"`
	PurnaKumbha string   `json:"purna_kumbha"`
	AmaraAmrta  string   `json:"amara_amrta"`
	Summary     string   `json:"summary"`
	Tags        []string `json:"tags"`
}

// TransmutationStage models one station in the alchemical triad.
type TransmutationStage struct {
	Stage       string `json:"stage"`       // "ama", "amra", "amara"
	Sanskrit    string `json:"sanskrit"`    // आम, आम्र, अमर
	Title       string `json:"title"`       // Stage designation
	Description string `json:"description"` // Esoteric explanation
}

// TransmutationTriadDoc stores the 3-stage alchemical progression.
type TransmutationTriadDoc struct {
	Key         string               `json:"key"`
	Title       string               `json:"title"`
	Stages      []TransmutationStage `json:"stages"`
	ChurningLaw string               `json:"churning_law"`
}

// MathematicalFoundationsDoc stores the sacred geometry formulas and parameters.
type MathematicalFoundationsDoc struct {
	Key               string            `json:"key"`
	Title             string            `json:"title"`
	ParametricX       string            `json:"parametric_x"`
	ParametricY       string            `json:"parametric_y"`
	CrestEnvelope     string            `json:"crest_envelope"`
	PratyaharaSpiral  string            `json:"pratyahara_spiral"`
	SamudraManthanLaw string            `json:"samudra_manthan_law"`
	Formulas          map[string]string `json:"formulas"`
}

// ToroidPresetDoc defines a stored preset configuration for the Toroidal Singularity.
type ToroidPresetDoc struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	MajorRadius float64 `json:"major_radius"`
	MinorRadius float64 `json:"minor_radius"`
	LineCount   int     `json:"line_count"`
	MissMargin  float64 `json:"miss_margin"`
	TiltAngle   float64 `json:"tilt_angle"`
	Mode        string  `json:"mode"`
}

// ToroidArtworkDoc stores the metadata, formulas, and presets for the Toroidal Singularity sacred geometry.
type ToroidArtworkDoc struct {
	Key         string            `json:"key"`
	Title       string            `json:"title"`
	Subtitle    string            `json:"subtitle"`
	Description string            `json:"description"`
	Formulas    map[string]string `json:"formulas"`
	Presets     []ToroidPresetDoc `json:"presets"`
}

// DefaultArishadvargaDemons returns the 6 classical inner adversaries with authoritative transmutations.
func DefaultArishadvargaDemons() []ArishadvargaDemon {
	return []ArishadvargaDemon{
		{
			Index:            1,
			Key:              "kama",
			Name:             "Kāma (काम)",
			ShadowDistortion: "Lust / Craving",
			TransmutedVirtue: "Prema & Sankalpa",
			Teaching:         "Transmute obsessive desire for external objects into unconditional love (prema) and focused spiritual will (sankalpa). The drive to consume becomes the passion to serve and create.",
		},
		{
			Index:            2,
			Key:              "krodha",
			Name:             "Krodha (क्रोध)",
			ShadowDistortion: "Anger / Wrath",
			TransmutedVirtue: "Tejas & Kshatra",
			Teaching:         "Transmute reactionary fury into righteous spiritual fire (tejas) and protective strength (kshatra). The heat of aggression becomes the firm boundary defending truth and justice without hatred.",
		},
		{
			Index:            3,
			Key:              "lobha",
			Name:             "Lobha (लोभ)",
			ShadowDistortion: "Greed / Grasping",
			TransmutedVirtue: "Dāna & Santosha",
			Teaching:         "Transmute the compulsion to hoard into radical generosity (dāna) and inner contentment (santosha). Scarcity mindset shifts into an awareness of sufficiency and circulation.",
		},
		{
			Index:            4,
			Key:              "moha",
			Name:             "Moha (मोह)",
			ShadowDistortion: "Delusion / Attachment",
			TransmutedVirtue: "Vivek & Bhakti",
			Teaching:         "Transmute blinding fascination with the impermanent into sharp discernment (vivek) and deep devotion (bhakti). Identity anchors in eternal truth rather than transient forms.",
		},
		{
			Index:            5,
			Key:              "mada",
			Name:             "Mada (मद)",
			ShadowDistortion: "Pride / Arrogance",
			TransmutedVirtue: "Swadharma & Vinaya",
			Teaching:         "Transmute inflated ego into humble confidence in your lawful role (swadharma) coupled with humility (vinaya). Superiority over others becomes unshakeable alignment with purpose.",
		},
		{
			Index:            6,
			Key:              "matsarya",
			Name:             "Mātsarya (मात्सर्य)",
			ShadowDistortion: "Envy / Malice",
			TransmutedVirtue: "Mudita",
			Teaching:         "Transmute resentment toward others' prosperity into sympathetic joy (mudita). Competition dissolves into collective elevation.",
		},
	}
}

// DefaultAmraPhilosophyDoc returns the canonical Vedic philosophy document.
func DefaultAmraPhilosophyDoc() EsotericPhilosophyDoc {
	return EsotericPhilosophyDoc{
		Key:         "esoteric:amra_philosophy",
		Title:       "Vedic Philosophy of Āmra (आम्र)",
		Subtitle:    "Karma-Phala & Pūrṇa Kumbha",
		KarmaPhala:  "In Vedic cosmology, Āmra (the sacred mango fruit) signifies Karma-Phala—the natural, sweet ripening of righteous labor into enduring nourishment. In Mercury Dasha, financial revenue is accounted not through speculative extraction, but as the golden harvest of creative craft and computational sovereignty.",
		PurnaKumbha: "In sacred Vedic consecrations, fresh mango leaves (āmra-pallava) crown the Pūrṇa Kumbha—the overflowing golden vessel symbolizing fullness, cosmic order, and immortality. The immutable BoltDB transaction ledger serves as this sovereign vessel, preserving value in an unencumbered, cryptographically verifiable, and durable form.",
		AmaraAmrta:  "Phonetically and conceptually, Āmra resonates with Amara (deathless, immortal) and Amṛta (the divine nectar of longevity). Value generated through dharmic creation and sovereign software architecture is crystallized and protected against arbitrary third-party devaluation.",
		Summary:     "The sacred fruit Āmra transmutes raw labor into golden sovereign abundance, crowned by the five leaves of the Pūrṇa Kumbha and anchored in the deathless Bīja of Amara.",
		Tags:        []string{"vedic", "amra", "karma_phala", "purna_kumbha", "amara", "amrta"},
	}
}

// DefaultTransmutationTriadDoc returns the 3-stage alchemical progression document.
func DefaultTransmutationTriadDoc() TransmutationTriadDoc {
	return TransmutationTriadDoc{
		Key:   "esoteric:transmutation_triad",
		Title: "The Alchemical Transmutation Triad",
		Stages: []TransmutationStage{
			{
				Stage:       "ama",
				Sanskrit:    "आम",
				Title:       "Āma — The Raw Acidic Poison & Demons",
				Description: "In Ayurveda and Yogic psychology, āma is the undigested psychic residue—unprocessed grief, fear, and unresolved conflict coagulating into the 6 Arishadvarga demons. The unripe fruit is fiercely acidic, resinous, and corrosive.",
			},
			{
				Stage:       "amra",
				Sanskrit:    "आम्र",
				Title:       "Āmra — The Golden Fruit of Righteous Action",
				Description: "Through sustained exposure to the solar fire of conscious awareness (Surya Agni), the caustic acids synthesize into golden fructose and sweet nectar. The demon's fierce torque is churned into righteous creative vigor.",
			},
			{
				Stage:       "amara",
				Sanskrit:    "अमर",
				Title:       "Amara & Amṛta — The Indestructible Seed",
				Description: "Inside the perishable flesh lies the stone (Bīja). It cannot be digested or crushed. It contains the complete fractal seed of the Kalpavriksha—the deathless, sovereign Self (Atman).",
			},
		},
		ChurningLaw: "In Samudra Manthan, the gods alone could not churn the ocean of milk; the Asuras (demons) were indispensable to rotate Mount Mandara. Without shadow resistance, no nectar of immortality (Amṛta) can ever emerge.",
	}
}

// DefaultMathematicalFoundationsDoc returns the sacred geometry formulation document.
func DefaultMathematicalFoundationsDoc() MathematicalFoundationsDoc {
	return MathematicalFoundationsDoc{
		Key:               "esoteric:mathematical_foundations",
		Title:             "Mathematical Formulations of the Esoteric Kairi Curve",
		ParametricX:       "x(t) = Scale * (Rx * sin(t) * (1 + α * cos(t)) + γ * ((1 + cos(t))²/4) * (1 - 0.5 * sin(t)))",
		ParametricY:       "y(t) = Scale * (-Ry * cos(t) + Ry * β * sin²(t/2) * cos(t) + OffsetY)",
		CrestEnvelope:     "E(t) = (1 + cos(t))² / 4 [Vanishes at t = ±π, ensuring exact C¹ closure at base]",
		PratyaharaSpiral:  "r(θ) = a * exp((ln(Φ) / (π/2)) * θ) [Logarithmic Golden Ratio Spiral]",
		SamudraManthanLaw: "Balance = (SolarFire_Deva / ShadowTension_Asura) → GoldenRatio_Φ (1.6180339887)",
		Formulas: map[string]string{
			"kairi_parametric_x": "x(t) = Scale * (Rx * sin(t) * (1 + α * cos(t)) + γ * ((1 + cos(t))²/4) * (1 - 0.5 * sin(t)))",
			"kairi_parametric_y": "y(t) = Scale * (-Ry * cos(t) + Ry * β * sin²(t/2) * cos(t) + OffsetY)",
			"crest_envelope":     "E(t) = (1 + cos(t))² / 4 [C¹ base closure]",
			"pratyahara_hook":    "r(θ) = a * exp((ln(Φ) / (π/2)) * θ)",
			"samudra_manthan":    "Balance = (SolarFire_Deva / ShadowTension_Asura) → GoldenRatio_Φ",
			"alchemical_triad":   "Āma (Raw Poison) ──[Surya Agni]──> Āmra (Karma-Phala) ──[Essence]──> Amara (Deathless Bīja)",
		},
	}
}

// DefaultToroidArtworkDoc returns the canonical Toroidal Singularity specification.
func DefaultToroidArtworkDoc() ToroidArtworkDoc {
	return ToroidArtworkDoc{
		Key:         "esoteric:toroid_geometry",
		Title:       "Toroidal Singularity & Sacred Akasha Vortex",
		Subtitle:    "Circumscribed Precessing Filaments around the Unmanifest Void",
		Description: "A self-organizing vortex where each circumscribed line traces an orbit around the central void, deliberately missing its starting point to prevent closure and generate eternal harmonic renewal. At the center lies the pitch-black Event Horizon (Bindu).",
		Formulas: map[string]string{
			"orbit_center":        "C_k = (R · cos(k · Δθ), R · sin(k · Δθ) · cos(α))",
			"precession_advance": "θ_precess = k · (2π / N + δ_miss)",
			"event_horizon_void": "r_hole = |R - r| · Scale  [Singularity Void]",
			"outer_perimeter":    "r_outer = (R + r) · Scale  [Outer Boundary]",
			"closure_gap":        "Gap = 2 · r · sin(δ_miss / 2)",
			"aspect_ratio":       "R / r ≈ 1.368 (Harmonic Akasha Ratio)",
		},
		Presets: []ToroidPresetDoc{
			{
				ID:          "canonical_108",
				Name:        "Canonical Akasha (108 Filaments)",
				Description: "Sacred 108 precessing rings with 7.5° miss margin and balanced event horizon.",
				MajorRadius: 130.0,
				MinorRadius: 95.0,
				LineCount:   108,
				MissMargin:  7.5,
				TiltAngle:   0.0,
				Mode:        "discrete_rings",
			},
			{
				ID:          "black_hole_singularity",
				Name:        "Black Hole Event Horizon",
				Description: "Dense 180 filaments with expansive central void and high-precision miss margin.",
				MajorRadius: 150.0,
				MinorRadius: 75.0,
				LineCount:   180,
				MissMargin:  4.2,
				TiltAngle:   0.0,
				Mode:        "discrete_rings",
			},
			{
				ID:          "golden_spiral_vortex",
				Name:        "Golden Phi Vortex (Continuous Filament)",
				Description: "Continuous unbroken filament precessing at the golden angle (13.75°).",
				MajorRadius: 120.0,
				MinorRadius: 90.0,
				LineCount:   144,
				MissMargin:  13.75,
				TiltAngle:   0.0,
				Mode:        "continuous",
			},
			{
				ID:          "minimal_chords",
				Name:        "Sacred String-Art Chords",
				Description: "Minimalist circumscribed chord tangents connecting inner void to outer sphere.",
				MajorRadius: 135.0,
				MinorRadius: 85.0,
				LineCount:   72,
				MissMargin:  15.0,
				TiltAngle:   0.0,
				Mode:        "chords",
			},
			{
				ID:          "deep_isometric_torus",
				Name:        "Deep Space Isometric Torus",
				Description: "3D perspective tilt (35°) revealing the toroidal donut depth and volumetric flow.",
				MajorRadius: 130.0,
				MinorRadius: 85.0,
				LineCount:   108,
				MissMargin:  8.0,
				TiltAngle:   35.0,
				Mode:        "discrete_rings",
			},
		},
	}
}

// SeedEsotericContent populates the BoltDB esoteric_content bucket with canonical documents.
// It is idempotent: only writes documents if they do not already exist.
func SeedEsotericContent(store StorageEngine) error {
	if store == nil {
		return errors.New("store cannot be nil")
	}

	// 1. Seed Arishadvarga Demons
	if _, err := store.GetEsotericContent("esoteric:arishadvarga"); errors.Is(err, ErrNotFound) {
		demons := DefaultArishadvargaDemons()
		data, err := json.MarshalIndent(demons, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal default arishadvarga: %w", err)
		}
		if err := store.SaveEsotericContent("esoteric:arishadvarga", data); err != nil {
			return fmt.Errorf("failed to seed esoteric:arishadvarga: %w", err)
		}

		// Also seed individual demon keys for granular retrieval
		for _, d := range demons {
			dData, _ := json.MarshalIndent(d, "", "  ")
			_ = store.SaveEsotericContent("esoteric:arishadvarga:"+d.Key, dData)
		}
	}

	// 2. Seed Āmra Philosophy Document
	if _, err := store.GetEsotericContent("esoteric:amra_philosophy"); errors.Is(err, ErrNotFound) {
		doc := DefaultAmraPhilosophyDoc()
		data, err := json.MarshalIndent(doc, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal default amra philosophy: %w", err)
		}
		if err := store.SaveEsotericContent("esoteric:amra_philosophy", data); err != nil {
			return fmt.Errorf("failed to seed esoteric:amra_philosophy: %w", err)
		}
	}

	// 3. Seed Transmutation Triad Document
	if _, err := store.GetEsotericContent("esoteric:transmutation_triad"); errors.Is(err, ErrNotFound) {
		doc := DefaultTransmutationTriadDoc()
		data, err := json.MarshalIndent(doc, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal default transmutation triad: %w", err)
		}
		if err := store.SaveEsotericContent("esoteric:transmutation_triad", data); err != nil {
			return fmt.Errorf("failed to seed esoteric:transmutation_triad: %w", err)
		}
	}

	// 4. Seed Mathematical Foundations Document
	if _, err := store.GetEsotericContent("esoteric:mathematical_foundations"); errors.Is(err, ErrNotFound) {
		doc := DefaultMathematicalFoundationsDoc()
		data, err := json.MarshalIndent(doc, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal default mathematical foundations: %w", err)
		}
		if err := store.SaveEsotericContent("esoteric:mathematical_foundations", data); err != nil {
			return fmt.Errorf("failed to seed esoteric:mathematical_foundations: %w", err)
		}
	}

	// 5. Seed Toroid Artwork Document
	if _, err := store.GetEsotericContent("esoteric:toroid_geometry"); errors.Is(err, ErrNotFound) {
		doc := DefaultToroidArtworkDoc()
		data, err := json.MarshalIndent(doc, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal default toroid artwork: %w", err)
		}
		if err := store.SaveEsotericContent("esoteric:toroid_geometry", data); err != nil {
			return fmt.Errorf("failed to seed esoteric:toroid_geometry: %w", err)
		}
	}

	return nil
}
