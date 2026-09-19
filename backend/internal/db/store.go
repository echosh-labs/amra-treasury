package db

import (
	"io"
	"time"
)

// DBStats encapsulates storage telemetry and performance counters.
type DBStats struct {
	Path           string    `json:"path"`
	SizeBytes      int64     `json:"size_bytes"`
	KeyCount       int       `json:"key_count"`
	TxN            int64     `json:"tx_total"`
	OpenTime       time.Time `json:"open_time"`
	AllocatedPages int64     `json:"allocated_pages"`
}

// StorageEngine defines the repository interface for AMRA Treasury & YouTube data persistence.
type StorageEngine interface {
	PutJSON(bucket []byte, key string, rawJSON []byte) error
	GetJSON(bucket []byte, key string) ([]byte, error)
	Delete(bucket []byte, key string) error
	ListKeys(bucket []byte, prefix string) ([]string, error)
	Backup(w io.Writer) error
	GetStats() (*DBStats, error)

	SaveYouTubeToken(data []byte) error
	GetYouTubeToken() ([]byte, error)
	DeleteYouTubeToken() error

	SaveYouTubeJob(id string, data []byte) error
	GetYouTubeJob(id string) ([]byte, error)
	ListYouTubeJobs(limit int) ([][]byte, error)
	DeleteYouTubeJob(id string) error

	SaveEsotericContent(key string, data []byte) error
	GetEsotericContent(key string) ([]byte, error)
	ListEsotericContent(prefix string) ([]string, error)
	DeleteEsotericContent(key string) error

	SaveGCloudBilling(data []byte) error
	GetGCloudBilling() ([]byte, error)

	Close() error
}

// Ensure Store implements StorageEngine at compile-time.
var _ StorageEngine = (*Store)(nil)
