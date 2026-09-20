package amra

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// ArtworkDoc represents an extensible, dynamically tunable sacred artwork asset.
type ArtworkDoc struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Category    string         `json:"category"`
	Tags        []string       `json:"tags"`
	Description string         `json:"description"`
	Endpoint    string         `json:"endpoint"`
	Parameters  map[string]any `json:"parameters,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

const artworkPrefix = "artwork:catalog:"

// DefaultArtworkCatalog seeds the initial canonical sacred geometries if empty.
func DefaultArtworkCatalog() []ArtworkDoc {
	now := time.Now().UTC()
	return []ArtworkDoc{
		{
			ID:          "toroid_singularity",
			Name:        "Toroidal Singularity (Akasha Spanda)",
			Category:    "sacred_geometry",
			Tags:        []string{"sacred_geometry", "toroid", "singularity", "akasha_spanda", "432hz", "background"},
			Description: "Circumscribed precessing filaments forming an event horizon black hole void with intentional non-closing miss margin.",
			Endpoint:    "/api/v1/amra/geometry/toroid",
			Parameters: map[string]any{
				"major_radius": 130,
				"minor_radius": 95,
				"line_count":   108,
				"miss_margin":  7.5,
				"tilt_angle":   35,
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "amra_mango",
			Name:        "Āmra Rūpa & Shadow Alchemy (Jnana-Phala)",
			Category:    "sacred_geometry",
			Tags:        []string{"sacred_geometry", "amra_fruit", "kairi_curve", "jnana_phala", "object"},
			Description: "Parametric Kairi curve with indestructible Bīja seed and Arishadvarga shadow transmutation.",
			Endpoint:    "/api/v1/amra/geometry",
			Parameters: map[string]any{
				"belly":      125,
				"hook":       35,
				"shadow":     0.35,
				"solar_agni": 0.85,
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "metatron_cube",
			Name:        "Metatron's Cube (Thorne Spacetime Lattice)",
			Category:    "sacred_geometry",
			Tags:        []string{"sacred_geometry", "metatron", "platonic_solids", "lattice", "background"},
			Description: "13 spherical nodes connected by 78 lines representing the five Platonic solids and geometric genesis.",
			Endpoint:    "/api/v1/amra/geometry/toroid?preset=metatron",
			Parameters: map[string]any{
				"sphere_count": 13,
				"line_count":   78,
				"symmetry":     "hexagonal",
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
}

// GetArtworkCatalog returns all registered artwork documents from BoltDB, optionally filtered by tag.
func (e *Engine) GetArtworkCatalog(tagFilter string) ([]ArtworkDoc, error) {
	keys, err := e.store.ListEsotericContent(artworkPrefix)
	if err != nil || len(keys) == 0 {
		// Seed default catalog
		defaults := DefaultArtworkCatalog()
		for _, doc := range defaults {
			_ = e.SaveArtwork(doc)
		}
		if tagFilter == "" {
			return defaults, nil
		}
		var filtered []ArtworkDoc
		for _, d := range defaults {
			if docHasTag(d, tagFilter) {
				filtered = append(filtered, d)
			}
		}
		return filtered, nil
	}

	var catalog []ArtworkDoc
	for _, key := range keys {
		raw, err := e.store.GetEsotericContent(key)
		if err != nil {
			continue
		}
		var doc ArtworkDoc
		if err := json.Unmarshal(raw, &doc); err == nil {
			if tagFilter == "" || docHasTag(doc, tagFilter) {
				catalog = append(catalog, doc)
			}
		}
	}

	if len(catalog) == 0 && tagFilter == "" {
		return DefaultArtworkCatalog(), nil
	}
	return catalog, nil
}

// GetArtwork loads a single artwork document by ID.
func (e *Engine) GetArtwork(id string) (*ArtworkDoc, error) {
	raw, err := e.store.GetEsotericContent(artworkPrefix + id)
	if err != nil {
		// Check defaults
		for _, d := range DefaultArtworkCatalog() {
			if d.ID == id {
				return &d, nil
			}
		}
		return nil, fmt.Errorf("artwork not found: %s", id)
	}

	var doc ArtworkDoc
	if err := json.Unmarshal(raw, &doc); err != nil {
		return nil, err
	}
	return &doc, nil
}

// SaveArtwork upserts an artwork document into BoltDB.
func (e *Engine) SaveArtwork(doc ArtworkDoc) error {
	if doc.ID == "" {
		return fmt.Errorf("artwork ID is required")
	}
	if doc.CreatedAt.IsZero() {
		doc.CreatedAt = time.Now().UTC()
	}
	doc.UpdatedAt = time.Now().UTC()

	raw, err := json.Marshal(doc)
	if err != nil {
		return err
	}
	return e.store.SaveEsotericContent(artworkPrefix+doc.ID, raw)
}

func docHasTag(doc ArtworkDoc, tag string) bool {
	tagLower := strings.ToLower(strings.TrimSpace(tag))
	for _, t := range doc.Tags {
		if strings.ToLower(strings.TrimSpace(t)) == tagLower {
			return true
		}
	}
	return false
}
