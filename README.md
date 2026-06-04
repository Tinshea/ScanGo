# ScanGo — Manga Reader Application

> Personal full-stack project by Malek Bouzarkouna

A full-stack manga reader web application inspired by MangaDex, built with React, Golang, and MongoDB. It aggregates real-time manga data from the MangaDex API, supports a complete user account system with social features, and integrates an AI-powered chatbot for navigation and recommendations.

🌐 **Live demo:** [scan-go-five.vercel.app](https://scan-go-five.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: React, React Router, CSS
- **Backend**: Golang (REST API, high-performance concurrent server)
- **Database**: MongoDB (user data, comments, preferences)
- **Tools & Services**: Docker, Docker Compose, Cloudinary (image hosting), MangaDex API, AI chatbot integration

## 📦 Installation & Setup

### Prerequisites

- Node.js & npm
- Go 1.20+
- MongoDB (local or Atlas)
- A Cloudinary account (for image uploads)

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
npm start

# 3b. Backend (separate terminal)
cd Gotestweb
go run main.go
```

## ✨ Features

### Manga Discovery & Reading
Users can browse trending manga on the homepage powered by the MangaDex API, search by title or genre, and read chapters in an immersive inline reader.

### User Account System
Full registration and login flow with passwords hashed via `bcrypt`. Users maintain a reading history and a favorites list.

### Social Features
Readers can post comments on individual chapters and interact with the community around each series.

### Profile Customization
Each user can personalize their profile with a custom username, banner image, and profile picture — all stored and delivered via Cloudinary.

### 🤖 AI Chatbot
An integrated assistant helps users navigate the platform, discover new series, and get personalized recommendations.

## 🗂️ Project Structure

```
ScanGo/
├── Client/             # React frontend (pages, components, routing)
├── Gotestweb/          # Golang backend (REST API, handlers, DB layer)
├── docker-compose.yaml # Full-stack local orchestration
└── package-lock.json
```

## 👤 Author

**Malek Bouzarkouna** & **Lyes Laïmouche & Yacine Kessal** — Master STL, Sorbonne Université

## 📄 License

No license specified.
