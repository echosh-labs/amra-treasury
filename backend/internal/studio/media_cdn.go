package studio

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

// MediaItem represents a playable video or audio chronicle within the Sovereign Local CDN.
type MediaItem struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Category      string `json:"category"`
	Path          string `json:"path"`
	Filename      string `json:"filename"`
	SizeBytes     int64  `json:"size_bytes"`
	SizeFormatted string `json:"size_formatted"`
	Format        string `json:"format"`
	StreamURL     string `json:"stream_url"`
	MTime         string `json:"mtime"`
	MTimeUnix     int64  `json:"mtime_unix"`
}

// MediaDirectoryConfig defines an indexed root for video files.
type MediaDirectoryConfig struct {
	Category string
	Path     string
}

// LocalMediaCDN manages directory indexing and streaming for the Sovereign ecosystem.
type LocalMediaCDN struct {
	rendersDir string
	mu         sync.RWMutex
	items      map[string]*MediaItem
	lastScan   time.Time
}

// NewLocalMediaCDN instantiates the media server.
func NewLocalMediaCDN(rendersDir string) *LocalMediaCDN {
	return &LocalMediaCDN{
		rendersDir: rendersDir,
		items:      make(map[string]*MediaItem),
	}
}

// formatBytes returns human-readable file sizes.
func formatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

// generateMediaID generates a clean deterministic identifier based on file path.
func generateMediaID(path string) string {
	h := sha256.Sum256([]byte(path))
	return hex.EncodeToString(h[:8])
}

// ScanDirectories indexes all configured video sources.
func (cdn *LocalMediaCDN) ScanDirectories() []*MediaItem {
	cdn.mu.Lock()
	defer cdn.mu.Unlock()

	// Re-scan if last scan was more than 10 seconds ago
	if time.Since(cdn.lastScan) < 10*time.Second && len(cdn.items) > 0 {
		list := make([]*MediaItem, 0, len(cdn.items))
		for _, it := range cdn.items {
			list = append(list, it)
		}
		sort.Slice(list, func(i, j int) bool {
			return list[i].MTimeUnix > list[j].MTimeUnix
		})
		return list
	}

	dirs := []MediaDirectoryConfig{
		{Category: "renders", Path: cdn.rendersDir},
		{Category: "physical_mastery", Path: "/home/justin/code/echosh-labs/shaolin/scraper"},
		{Category: "esoteric", Path: "/home/justin/Dropbox/youtube"},
		{Category: "vault", Path: "/home/justin/Dropbox/video"},
		{Category: "external_d", Path: "/mnt/d/video"},
	}

	validExts := map[string]bool{
		".mp4":  true,
		".mkv":  true,
		".webm": true,
		".mov":  true,
		".avi":  true,
	}

	newItems := make(map[string]*MediaItem)

	for _, d := range dirs {
		if _, err := os.Stat(d.Path); err != nil {
			continue
		}

		_ = filepath.Walk(d.Path, func(path string, info os.FileInfo, err error) error {
			if err != nil || info == nil || info.IsDir() {
				return nil
			}

			ext := strings.ToLower(filepath.Ext(path))
			if !validExts[ext] {
				return nil
			}

			// Clean title
			base := filepath.Base(path)
			title := strings.TrimSuffix(base, filepath.Ext(base))
			title = strings.ReplaceAll(title, "-", " ")
			title = strings.ReplaceAll(title, "_", " ")

			id := generateMediaID(path)
			item := &MediaItem{
				ID:            id,
				Title:         title,
				Category:      d.Category,
				Path:          path,
				Filename:      base,
				SizeBytes:     info.Size(),
				SizeFormatted: formatBytes(info.Size()),
				Format:        strings.TrimPrefix(ext, "."),
				StreamURL:     "/api/v1/studio/media/stream/" + id,
				MTime:         info.ModTime().Format(time.RFC3339),
				MTimeUnix:     info.ModTime().Unix(),
			}

			newItems[id] = item
			return nil
		})
	}

	cdn.items = newItems
	cdn.lastScan = time.Now()

	list := make([]*MediaItem, 0, len(newItems))
	for _, it := range newItems {
		list = append(list, it)
	}
	sort.Slice(list, func(i, j int) bool {
		return list[i].MTimeUnix > list[j].MTimeUnix
	})

	return list
}

// GetItem retrieves a media item by ID.
func (cdn *LocalMediaCDN) GetItem(id string) (*MediaItem, bool) {
	cdn.mu.RLock()
	it, ok := cdn.items[id]
	cdn.mu.RUnlock()
	if ok {
		return it, true
	}
	// If not found in cache, scan and retry
	_ = cdn.ScanDirectories()
	cdn.mu.RLock()
	defer cdn.mu.RUnlock()
	it, ok = cdn.items[id]
	return it, ok
}
