# ⚖️ AMRA Sovereign Treasury & YouTube Studio (`amra-treasury`)
> A single-binary financial command center, YouTube Studio automation engine, and generative parametric visualizer on **Port 8050**.

---

## 🌟 The Vibe
`amra-treasury` unifies sovereign revenue streams, media automation, and sacred mathematical visualization. Running as a self-contained single binary, it combines real-time YouTube monetization analytics, chunked video upload pipelines, SaaS subscription tiers, and an immutable BoltDB ledger—crowned with interactive parametric Kairi/mango curves and alchemical polar transmutations rendered dynamically on canvas.

---

## 🚀 60-Second Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/echosh-labs/amra-treasury.git
cd amra-treasury

# 2. Setup your local environment (Optional: operates fully in offline mode)
cp .env.example .env

# 3. Boot the development server (builds Next.js and starts Go API on Port 8050)
make dev
```

Once started:
- **Interactive Treasury & Studio**: Open [http://localhost:8050](http://localhost:8050)
- **API Health Check**: `GET http://localhost:8050/health`
- **Sacred Geometry Canvas**: [http://localhost:8050/studio](http://localhost:8050/studio)

> **Zero Cloud Setup Required:**  
> If you don't have YouTube API or Google Cloud credentials, `amra-treasury` operates seamlessly in offline demonstration mode. The immutable BoltDB ledger, subscription management, and mathematical canvas visualizer work locally out of the box!

---

## 🗺️ Interactive Tour & Web Dashboard

When visiting [http://localhost:8050](http://localhost:8050), explore four specialized docks:

1. **Treasury Command (`/treasury`)**:
   - **Unified MRR & Accrual**: Visualizes combined subscription revenue and 30-day YouTube ad earnings.
   - **Immutable Audit Ledger**: Real-time table of double-entry financial events stored in local BoltDB.
   - **SaaS Subscription Plans**: Sadhaka, Adept, Magus, and Sovereign Enterprise tier management.
2. **YouTube Studio Dock (`/youtube`)**:
   - **Channel Analytics**: Real-time retention gauges, view velocity, and estimated ad CPM.
   - **Resumable Upload Engine**: Chunked background video uploader with real-time progress bars.
   - **Monetization Sync**: One-click ingestion of verified YouTube revenue into the local ledger.
3. **Generative Visual Studio (`/studio`)**:
   - **Parametric Shader Canvas**: Real-time interactive polar coordinate visualizer for the sacred Kairi (mango) curve.
   - **Alchemical Shadow Transmutations**: The 6 classical *Arishadvarga* inner obstacles mapped to dharmic frequencies.
4. **Cloud Infrastructure Monitor**:
   - **GCP Burn Rate Tracker**: Real-time cost monitoring with scale-to-zero enforcement metrics.

---

## 🏗️ Technical Architecture

```
amra-treasury/
├── backend/                  # High-performance Go 1.24 Core
│   ├── cmd/server/           # Service entrypoint (wires routes & embed.FS)
│   ├── internal/
│   │   ├── api/              # HTTP REST handlers & SSE event streams
│   │   ├── studio/           # Generative shader & CDN media delivery
│   │   ├── youtube/          # YouTube Data v3 & OAuth token manager
│   │   └── db/               # Embedded BoltDB persistent storage engine
├── frontend/                 # Next.js 15 (App Router + TailwindCSS)
│   ├── app/                  # Studio, Treasury, and Alchemical routes
│   └── components/           # Real-time ledger tables, shader canvas, metric cards
├── scripts/                  # Port clearance, sync, and smoke test scripts
└── Makefile                  # Unified automation interface
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` to customize settings:

```env
PORT=8050

# YouTube Studio OAuth Credentials (Optional)
# Obtain from Google Cloud Console -> APIs & Services -> Credentials
YOUTUBE_CLIENT_ID=your-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your-client-secret
YOUTUBE_REDIRECT_URL=http://localhost:8050/api/v1/youtube/auth/callback

# Google Cloud Project Monitoring (Optional)
GCP_PROJECT_ID=your-gcp-project-id
```

---

## 🛠️ Build & Verification Commands

| Command | Action |
| :--- | :--- |
| `make dev` | Starts frontend watch and Go server on Port 8050. |
| `make test` | Runs Go backend unit tests (YouTube client, token storage, API routing). |
| `make build` | Exports Next.js frontend to static HTML and bundles into a standalone Go binary (`bin/amra-treasury`). |
| `./test.sh` | Executes automated end-to-end smoke tests against 12 live API endpoints. |

---

## 📄 License

This software is dual-licensed:
- **Open Source Edition**: Governed by the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE.md) for individual, educational, and open-source usage.
- **Commercial & Enterprise Edition**: Requires a commercial license from echoSH labs for proprietary integration, corporate deployment, or advanced enterprise features. See [COMMERCIAL.md](COMMERCIAL.md) or visit [echosh-labs.com](https://echosh-labs.com).

For commercial licensing inquiries, contact [justin@echosh-labs.com](mailto:justin@echosh-labs.com).
