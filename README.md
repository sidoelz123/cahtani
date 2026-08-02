# CahTani AI 🌾🤖

**CahTani AI** is an intelligent agricultural assistant platform designed to empower Indonesian farmers with AI-driven plant diagnostics, smart planting calendars, localized weather advisories, growth journaling, and an agricultural shop catalog.

---

## 🌟 Key Features

- 🩺 **AI Plant Pest & Disease Diagnosis**: Instant identification of crop diseases from descriptions or photos with actionable treatment recommendations.
- 📅 **Dynamic Planting Calendar**: AI-generated farming schedules and milestone management customized for regional crops.
- 🌤️ **Smart Weather Advisory**: Regional weather tracking and tailored agricultural advisory alerts.
- 💬 **Interaktif Farming Chat Assistant**: AI chatbot tailored for agricultural advice in Indonesian context.
- 🛒 **Agricultural Shop & Catalog**: Products for crop protection, seeds, and fertilizers with affiliate purchase links.
- 📝 **Farmer Growth Journal**: Digital logging for farm activities, pest sightings, and crop progress.

---

## 🛠️ Tech Stack Overview

### Frontend
- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS 4 + Lucide Icons
- **State & Data Fetching**: TanStack React Query + TanStack React Router + Centralized API Client

### Backend
- **Framework**: HonoJS
- **Database**: Drizzle ORM with Cloudflare D1 (Serverless SQLite) / libSQL
- **AI Integration**: Google Gen AI SDK (`@google/genai`)
- **API Specs**: OpenAPI 3.0 + Swagger UI

---

## 📁 Project Structure

The project is structured into two independent packages:

```text
.
├── frontend/          # React + Vite frontend SPA
│   ├── src/           # React components, pages, & API client
│   └── README.md      # Frontend setup and deployment guide
├── backend/           # Hono + Cloudflare Workers backend API
│   ├── src/           # Routes, DB schema, seeders, and docs
│   ├── wrangler.toml  # Cloudflare Workers configuration
│   └── README.md      # Backend setup, database, and deployment guide
└── README.md          # Project root overview
```

---

## 📖 Setup & Deployment Guides

For detailed setup, environment variables, local execution, and deployment steps, please refer to the dedicated READMEs:

- 💻 [**Frontend Documentation & Setup Guide**](./frontend/README.md)
- ⚙️ [**Backend Documentation & Setup Guide**](./backend/README.md)

