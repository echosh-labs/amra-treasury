package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Port                string
	BoltDBPath          string
	ServiceName         string
	Environment         string
	YouTubeClientID     string
	YouTubeClientSecret string
	YouTubeRedirectURL  string
	StripeAPIKey        string
	StripeWebhookSecret string
	GCloudProjectID     string
	GCloudBillingID     string
}

func loadEnvFile(paths ...string) {
	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		defer f.Close()

		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				k := strings.TrimSpace(parts[0])
				v := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
				if os.Getenv(k) == "" {
					_ = os.Setenv(k, v)
				}
			}
		}
		break
	}
}

func Load() *Config {
	loadEnvFile(".env", "../.env", "../../.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8050" // Canonical port for amra-treasury
	}

	dbPath := os.Getenv("BOLT_DB_PATH")
	if dbPath == "" {
		dbPath = ".data/amra-treasury-dev.db"
	}

	serviceName := os.Getenv("SERVICE_NAME")
	if serviceName == "" {
		serviceName = "amra-treasury"
	}

	env := os.Getenv("ENV")
	if env == "" {
		env = "production"
	}

	youtubeRedirectURL := os.Getenv("YOUTUBE_REDIRECT_URL")
	if youtubeRedirectURL == "" {
		youtubeRedirectURL = "http://localhost:" + port + "/api/v1/youtube/auth/callback"
	}

	return &Config{
		Port:                port,
		BoltDBPath:          filepath.Clean(dbPath),
		ServiceName:         serviceName,
		Environment:         env,
		YouTubeClientID:     os.Getenv("YOUTUBE_CLIENT_ID"),
		YouTubeClientSecret: os.Getenv("YOUTUBE_CLIENT_SECRET"),
		YouTubeRedirectURL:  youtubeRedirectURL,
		StripeAPIKey:        os.Getenv("STRIPE_API_KEY"),
		StripeWebhookSecret: os.Getenv("STRIPE_WEBHOOK_SECRET"),
		GCloudProjectID:     os.Getenv("GCLOUD_PROJECT_ID"),
		GCloudBillingID:     os.Getenv("GCLOUD_BILLING_ID"),
	}
}
