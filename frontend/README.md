# CahTani AI — Frontend Documentations

This folder contains the frontend client for **CahTani AI**, built using **React 19**, **Vite**, and **Tailwind CSS**.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in the `frontend/` directory (or configure environment variables in your deployment dashboard):

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API service | `https://cahtani-backend.your-subdomain.workers.dev` |

> ⚠️ **Important Note on Vite Environment Variables**:
> - Environment variables exposed to client-side code **must be prefixed with `VITE_`**.
> - Vite embeds these variables into the static Javascript bundle **at build time**.
> - If you change or update `VITE_API_BASE_URL` on Vercel (or any host), **you must trigger a full redeploy** for the updated environment variable to take effect in client requests.

---

## 💻 Local Development

To launch the Vite development server locally:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000` (or the port specified by Vite).

---

## 📦 Building for Production

To compile static assets for production deployment:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment (Vercel)

This frontend is designed for seamless deployment on **Vercel** or any static web host.

### Deployment Steps on Vercel:

1. Import the repository into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Choose **Vite** as the Framework Preset:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the `VITE_API_BASE_URL` environment variable pointing to your deployed backend API URL.
5. Deploy.

