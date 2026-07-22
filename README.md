# ScanGo — Manga Reader Application

> Personal full-stack project by Malek Bouzarkouna

A full-stack manga reader web application inspired by MangaDex, built with React, Golang, and MongoDB. It aggregates real-time manga data from the MangaDex API and supports a complete user account system with social features.

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router, Vite, Tailwind CSS
- **Backend**: Golang (REST API, JWT auth)
- **Database**: MongoDB (user data, comments, preferences)
- **Tools & Services**: Docker, Docker Compose, Cloudinary (image hosting), MangaDex API

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ & npm
- Go 1.22+
- MongoDB (local or Atlas)
- A Cloudinary account (optional — image uploads are disabled without it)

### Configuration

All secrets are read from the environment; none are committed. Copy the
template and fill it in before the first run:

```bash
cp .env.example .env
# Generate a signing key — the server refuses to start with a short one
openssl rand -base64 48   # paste into JWT_SECRET
```

| Variable | Required | Purpose |
|---|:---:|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Token signing key, 32 characters minimum |
| `CLOUDINARY_URL` | — | Image uploads; disabled (503) when unset |
| `ALLOWED_ORIGINS` | — | CORS allowlist, comma-separated |
| `ALLOWED_CONTENT_RATINGS` | — | Content filter (default `safe,suggestive`) |
| `EXCLUDED_TAGS` | — | MangaDex tag UUIDs to exclude |
| `PORT` | — | Listen port (default `8080`) |

### Instructions

```bash
# 1. Clone the repository
git clone https://github.com/Tinshea/ScanGo.git
cd ScanGo

# 2. Start with Docker Compose (recommended)
docker-compose up --build

# OR manually:

# 3a. Frontend
cd Client
npm install
npm run dev

# 3b. Backend (separate terminal)
cd Gotestweb
go run .
```

### Tests & quality checks

```bash
cd Gotestweb && go vet ./... && go test ./...   # backend
cd Client    && npm run lint && npm run build   # frontend
```

## ✨ Features

### Manga Discovery & Reading
Browse trending manga on the homepage powered by the MangaDex API, search by
title or genre, and read chapters in an immersive inline reader.

### Content Filtering
Only titles matching the configured content ratings are served — `safe` and
`suggestive` by default. The filter is enforced server-side on every path
(listings, title pages, and chapter reading), so a direct link cannot bypass
it. Gore and sexual-violence tags are excluded as well.

### User Account System
Registration and login with passwords hashed via `bcrypt`. Every write
operation requires a valid JWT, and the caller's identity is taken from the
token — never from a request parameter. Users maintain a reading history and a
favorites list.

### Social Features
Post comments on individual chapters. Comments can only be deleted by their
author, enforced server-side.

### Profile Customization
Personalize a profile with a custom username, banner, and profile picture,
stored and delivered via Cloudinary. Uploads are validated by content
signature (not by file extension) and capped at 5 MB.

## 🗂️ Project Structure

```
ScanGo/
├── Client/                 # React frontend
│   └── src/
│       ├── api.js          # Shared HTTP client (auth, error handling)
│       ├── Component/      # Components and pages
│       └── utils/          # Shared helpers
├── Gotestweb/              # Golang backend
│   ├── auth/               # JWT issuing, verification, middleware
│   ├── config/             # Environment loading with fail-fast validation
│   ├── mangadex/           # MangaDex client, content filter, tag resolution
│   ├── controllers/        # HTTP handlers
│   ├── database/           # MongoDB connection
│   └── models/             # Data structures
├── docker-compose.yaml     # Full-stack local orchestration
└── .env.example            # Configuration template
```

## 👤 Author

**Malek Bouzarkouna** & **Lyes Laïmouche & Yacine Kessal** — Master STL, Sorbonne Université

## 📄 License

No license specified.
