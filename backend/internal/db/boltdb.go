package db

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	bolt "go.etcd.io/bbolt"
)

var (
	ErrNotFound       = errors.New("record not found")
	ErrInvalidJSON    = errors.New("invalid JSON payload")
	ErrEmptyKey       = errors.New("key cannot be empty")
	ErrBucketNotFound = errors.New("bucket not found")

	BucketAmraIdempotency   = []byte("amra_idempotency")
	BucketAmraSubscriptions = []byte("amra_subscriptions")
	BucketAmraLedger        = []byte("amra_ledger")
	BucketAmraBilling       = []byte("amra_billing")
	BucketYouTube           = []byte("youtube_data")
	BucketEsoteric          = []byte("esoteric_content")

	KeyYouTubeToken = "auth:token"
)

type Store struct {
	db     *bolt.DB
	dbPath string
}

var openTime = time.Now()

func Open(dbPath string) (*Store, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory %s: %w", dir, err)
	}

	opts := &bolt.Options{
		Timeout: 2 * time.Second,
	}

	db, err := bolt.Open(dbPath, 0600, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to open boltdb at %s: %w", dbPath, err)
	}

	err = db.Update(func(tx *bolt.Tx) error {
		for _, bucketName := range [][]byte{
			BucketAmraIdempotency,
			BucketAmraSubscriptions,
			BucketAmraLedger,
			BucketAmraBilling,
			BucketYouTube,
			BucketEsoteric,
		} {
			if _, err := tx.CreateBucketIfNotExists(bucketName); err != nil {
				return fmt.Errorf("could not create bucket %s: %w", string(bucketName), err)
			}
		}
		return nil
	})
	if err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to initialize schema buckets: %w", err)
	}

	return &Store{db: db, dbPath: dbPath}, nil
}

func (s *Store) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

func (s *Store) PutJSON(bucket []byte, key string, rawJSON []byte) error {
	if strings.TrimSpace(key) == "" {
		return ErrEmptyKey
	}
	if !json.Valid(rawJSON) {
		return ErrInvalidJSON
	}

	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucket)
		if b == nil {
			return ErrBucketNotFound
		}
		return b.Put([]byte(key), rawJSON)
	})
}

func (s *Store) GetJSON(bucket []byte, key string) ([]byte, error) {
	if strings.TrimSpace(key) == "" {
		return nil, ErrEmptyKey
	}

	var data []byte
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucket)
		if b == nil {
			return ErrBucketNotFound
		}
		v := b.Get([]byte(key))
		if v == nil {
			return ErrNotFound
		}
		data = make([]byte, len(v))
		copy(data, v)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return data, nil
}

func (s *Store) Delete(bucket []byte, key string) error {
	if strings.TrimSpace(key) == "" {
		return ErrEmptyKey
	}

	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucket)
		if b == nil {
			return ErrBucketNotFound
		}
		return b.Delete([]byte(key))
	})
}

func (s *Store) ListKeys(bucket []byte, prefix string) ([]string, error) {
	var keys []string
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucket)
		if b == nil {
			return ErrBucketNotFound
		}
		c := b.Cursor()
		pBytes := []byte(prefix)
		for k, _ := c.Seek(pBytes); k != nil && bytes.HasPrefix(k, pBytes); k, _ = c.Next() {
			keys = append(keys, string(k))
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return keys, nil
}

func (s *Store) Backup(w io.Writer) error {
	return s.db.View(func(tx *bolt.Tx) error {
		_, err := tx.WriteTo(w)
		return err
	})
}

func (s *Store) GetStats() (*DBStats, error) {
	var size int64
	if fi, err := os.Stat(s.dbPath); err == nil {
		size = fi.Size()
	}

	var keyCount int
	var txN int64
	var pages int64

	err := s.db.View(func(tx *bolt.Tx) error {
		txN = int64(tx.ID())
		stats := s.db.Stats()
		pages = int64(stats.TxStats.PageCount)

		for _, bName := range [][]byte{
			BucketAmraIdempotency,
			BucketAmraSubscriptions,
			BucketAmraLedger,
			BucketAmraBilling,
			BucketYouTube,
			BucketEsoteric,
		} {
			if b := tx.Bucket(bName); b != nil {
				_ = b.ForEach(func(k, v []byte) error {
					keyCount++
					return nil
				})
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &DBStats{
		Path:           s.dbPath,
		SizeBytes:      size,
		KeyCount:       keyCount,
		TxN:            txN,
		OpenTime:       openTime,
		AllocatedPages: pages,
	}, nil
}

// YouTube Token & Job Persistence

func (s *Store) SaveYouTubeToken(data []byte) error {
	return s.PutJSON(BucketYouTube, KeyYouTubeToken, data)
}

func (s *Store) GetYouTubeToken() ([]byte, error) {
	return s.GetJSON(BucketYouTube, KeyYouTubeToken)
}

func (s *Store) DeleteYouTubeToken() error {
	return s.Delete(BucketYouTube, KeyYouTubeToken)
}

func (s *Store) SaveYouTubeJob(id string, data []byte) error {
	if strings.TrimSpace(id) == "" {
		return ErrEmptyKey
	}
	return s.PutJSON(BucketYouTube, "job:"+id, data)
}

func (s *Store) GetYouTubeJob(id string) ([]byte, error) {
	if strings.TrimSpace(id) == "" {
		return nil, ErrEmptyKey
	}
	return s.GetJSON(BucketYouTube, "job:"+id)
}

func (s *Store) ListYouTubeJobs(limit int) ([][]byte, error) {
	var records [][]byte
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(BucketYouTube)
		if b == nil {
			return ErrBucketNotFound
		}
		c := b.Cursor()
		prefix := []byte("job:")
		for k, v := c.Seek(prefix); k != nil && bytes.HasPrefix(k, prefix); k, v = c.Next() {
			item := make([]byte, len(v))
			copy(item, v)
			records = append(records, item)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	// Reverse chronological sort (newer keys first if timestamp based, else slice limit)
	for i, j := 0, len(records)-1; i < j; i, j = i+1, j-1 {
		records[i], records[j] = records[j], records[i]
	}

	if limit > 0 && len(records) > limit {
		records = records[:limit]
	}
	return records, nil
}

func (s *Store) DeleteYouTubeJob(id string) error {
	if strings.TrimSpace(id) == "" {
		return ErrEmptyKey
	}
	return s.Delete(BucketYouTube, "job:"+id)
}

// Esoteric Content Storage

func (s *Store) SaveEsotericContent(key string, data []byte) error {
	return s.PutJSON(BucketEsoteric, key, data)
}

func (s *Store) GetEsotericContent(key string) ([]byte, error) {
	return s.GetJSON(BucketEsoteric, key)
}

func (s *Store) ListEsotericContent(prefix string) ([]string, error) {
	return s.ListKeys(BucketEsoteric, prefix)
}

func (s *Store) DeleteEsotericContent(key string) error {
	return s.Delete(BucketEsoteric, key)
}

// Google Cloud Billing Cache

func (s *Store) SaveGCloudBilling(data []byte) error {
	return s.PutJSON(BucketAmraBilling, "latest", data)
}

func (s *Store) GetGCloudBilling() ([]byte, error) {
	return s.GetJSON(BucketAmraBilling, "latest")
}
