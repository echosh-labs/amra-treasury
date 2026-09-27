package main

import (
	"fmt"
	"log"
	"time"

	"go.etcd.io/bbolt"
)

func main() {
	srcPath := "/home/justin/code/echosh-labs/mercury-dasha/.data/mercury-dasha-dev.db"
	dstPath := "/home/justin/code/echosh-labs/amra-treasury/.data/amra-treasury-dev.db"

	srcDB, err := bbolt.Open(srcPath, 0600, &bbolt.Options{ReadOnly: true, Timeout: 2 * time.Second})
	if err != nil {
		log.Fatalf("Failed to open source db: %v", err)
	}
	defer srcDB.Close()

	dstDB, err := bbolt.Open(dstPath, 0600, &bbolt.Options{Timeout: 2 * time.Second})
	if err != nil {
		log.Fatalf("Failed to open target db: %v", err)
	}
	defer dstDB.Close()

	copied := 0
	err = srcDB.View(func(srcTx *bbolt.Tx) error {
		srcBucket := srcTx.Bucket([]byte("youtube_data"))
		if srcBucket == nil {
			return fmt.Errorf("youtube_data bucket not found in source")
		}

		return dstDB.Update(func(dstTx *bbolt.Tx) error {
			dstBucket, err := dstTx.CreateBucketIfNotExists([]byte("youtube_data"))
			if err != nil {
				return err
			}

			return srcBucket.ForEach(func(k, v []byte) error {
				fmt.Printf("Copying key: %s (%d bytes)\n", string(k), len(v))
				copied++
				return dstBucket.Put(k, v)
			})
		})
	})

	if err != nil {
		log.Fatalf("Sync failed: %v", err)
	}
	fmt.Printf("Successfully copied %d keys into %s\n", copied, dstPath)
}
