# AMRA Sovereign Treasury & YouTube Studio (`amra-treasury`)
# echosh-labs Single-Binary Sovereign Engine (Port 8050)

`amra-treasury` is an independent, single-binary sovereign service within the `echosh-labs` ecosystem. It unifies YouTube Studio operations, video upload pipelines, monetization feedback loops, SaaS billing tiers, and an immutable BoltDB audit ledger, crowned with Vedic sacred geometry and alchemical shadow transmutation.

---

## 🏛️ System Architecture

- **Sovereign Port**: `8050`
- **Host Execution Substrate**: WSL2 Ubuntu (`/home/justin/code/echosh-labs/amra-treasury`)
- **Backend**: Go 1.23+ with embedded key-value document store (`bbolt`)
- **Frontend**: Next.js 15 App Router static export bundled into the Go binary via `embed.FS`
- **Containerization**: Multi-stage Docker build targeting Google Artifact Registry & Cloud Run

```
                                  [ Client Browser ]
                                          |
                              HTTP / SSE (Port 8050)
                                          |
                       +------------------v-------------------+
                       |         amra-treasury Engine         |
                       |       (Single Static Go Binary)      |
                       +--------+--------------------+--------+
                                |                    |
                    +-----------v----+          +----v-------------+
                    |  Embedded Web  |          |   Go API Core    |
                    | (frontend_out) |          |  • /api/v1/amra  |
                    +----------------+          |  • /api/v1/yt    |
                                                |  • /api/v1/esot  |
                                                +----+--------+----+
                                                     |        |
                         +---------------------------+        +-------------------+
                         |                                                        |
              +----------v-----------+                                 +----------v-----------+
              |    Embedded BoltDB   |                                 |    External Clouds   |
              |  • amra_ledger       |                                 |  • YouTube Data v3   |
              |  • amra_idempotency  |                                 |  • YouTube Analytics |
              |  • amra_subs         |                                 |  • Google Cloud SDK  |
              |  • youtube_data      |                                 |  • Stripe Webhooks   |
              |  • esoteric_content  |                                 +----------------------+
              +----------------------+
```

---

## 🚀 Quickstart & Verification Commands

```bash
# 1. Clear contentious processes on port 8050 and run full build & dev server
make dev

# 2. Run backend unit test suites (AMRA, YouTube, Portutil, API)
make test

# 3. Compile full single binary (Next.js export -> Go embed.FS -> bin/amra-treasury)
make build

# 4. Run automated end-to-end smoke test suite (12 endpoints verified)
./test.sh
```

---

## 📡 API Catalog

### YouTube Sovereign Studio
- `GET /api/v1/youtube/status`: Channel status, token validity, quota tracker.
- `GET /api/v1/youtube/auth/url`: OAuth2 Google consent URL with offline refresh token.
- `GET /api/v1/youtube/auth/callback`: OAuth2 code exchange handler.
- `POST /api/v1/youtube/auth/disconnect`: Revoke and clear stored OAuth tokens.
- `POST /api/v1/youtube/upload`: Initiate resumable chunked video upload.
- `GET /api/v1/youtube/jobs`: List recent background upload jobs.
- `GET /api/v1/youtube/jobs/{id}`: Detailed upload job status and progress.
- `POST /api/v1/youtube/jobs/{id}/cancel`: Cancel active upload job.
- `GET /api/v1/youtube/videos`: List uploaded channel videos.
- `GET /api/v1/youtube/analytics`: Query retention, view duration, subscriber delta.
- `GET /api/v1/youtube/finance`: Monetization report (estimated ad revenue, CPM).
- `POST /api/v1/youtube/finance/sync-amra`: Ingest verified YouTube revenue into the immutable ledger.

### AMRA Sovereign Treasury
- `GET /api/v1/amra/plans`: List active billing tiers (Sadhaka, Adept, Magus, Enterprise).
- `POST /api/v1/amra/checkout`: Generate checkout session.
- `POST /api/v1/amra/webhook/{provider}`: Ingest webhook events with SHA-256 idempotency deduplication.
- `GET /api/v1/amra/subscriptions/{id}`: Retrieve customer subscription state.
- `GET /api/v1/amra/ledger`: Retrieve immutable audit transactions from BoltDB.
- `GET /api/v1/amra/metrics`: Compute unified ecosystem metrics (SaaS MRR + YouTube 30d Accrual).
- `GET /api/v1/amra/geometry`: Parametric Kairi/mango curve and Arishadvarga polar transmutations.
- `POST /api/v1/amra/geometry`: Re-render sacred geometry with custom parameters.
- `GET /api/v1/amra/gcloud/status`: GCP project and billing account topology.
- `GET /api/v1/amra/gcloud/billing`: Infrastructure burn rate, scale-to-zero status, and sovereign margin.
- `POST /api/v1/amra/gcloud/sync-ledger`: Commit monthly cloud expense to the immutable ledger.

### Esoteric Documents & Philosophy
- `GET /api/v1/esoteric`: Catalog of esoteric documents stored in BoltDB.
- `GET /api/v1/esoteric/arishadvarga`: The 6 classical inner adversaries and their dharmic transmutations.
- `GET /api/v1/esoteric/{key}`: Retrieve arbitrary esoteric document.

---

## 🔒 Port Allocation
- Assigned Port: **8050**
- Google OAuth Redirect URI: `http://localhost:8050/api/v1/youtube/auth/callback`
