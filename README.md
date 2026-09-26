# 🤖 SAARTHI — Your AI-Powered Life Assistant

> **"Tell SAARTHI what you need. It figures out how to get it done."**

SAARTHI is a generalized agentic task-execution platform built on **Sarvam AI**. It speaks Hinglish, listens to your voice, searches the real world, and takes actions on your behalf — like booking restaurants, finding places nearby, and more.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://saarthi.vercel.app)
[![Powered by Sarvam AI](https://img.shields.io/badge/Powered%20by-Sarvam%20AI-orange?style=for-the-badge)](https://sarvam.ai)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🧠 **Agentic Loop** | Multi-step tool execution powered by Sarvam's `sarvam-105b-conversations` model |
| 🎤 **Voice Input** | Real Hinglish speech recognition via Sarvam STT (`saaras:v2`) |
| 🔊 **Voice Output** | SAARTHI speaks back using Sarvam TTS (`bulbul:v3`, Ritu voice) |
| 📍 **Live Location** | Browser geolocation + OpenStreetMap/Overpass API for real-world search |
| 🍽️ **Restaurant Booking** | Search → Check Availability → Confirm — all autonomously |
| 🛡️ **Safe Execution** | High-risk actions (bookings) require explicit confirmation |
| 🇮🇳 **Hinglish Native** | All responses, confirmations, and messages in natural Hinglish |
| 🕐 **Temporal Awareness** | Knows today's date and time — understands "aaj raat", "kal", "8 baje" |
| 🔍 **Agent Trace Panel** | Live developer trace of every tool call and API response |

---

## 🏗️ Architecture

```
User Voice/Text
      ↓
  Next.js Frontend (page.tsx)
      ↓
  /api/stt  →  Sarvam STT (saaras:v2)
      ↓
  /api/chat  →  Agent Loop (saarthi.ts)
      ↓
  Sarvam LLM (sarvam-105b-conversations)
      ↓ tool_calls
  Tool Registry
  ├── get_user_location  (browser geolocation)
  ├── search_places      (OpenStreetMap / Overpass API)
  ├── check_restaurant_availability
  └── create_reservation
      ↓
  /api/tts  →  Sarvam TTS (bulbul:v3)
      ↓
  Voice Response + UI Cards
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Anmol2627/saarthi.git
cd saarthi
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root:

```env
SARVAM_API_KEY=your_sarvam_api_key_here
```

> Get your free API key at [dashboard.sarvam.ai](https://dashboard.sarvam.ai)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — SAARTHI is ready!

---

## 🌐 Deploy on Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import `saarthi`
3. Add Environment Variable: `SARVAM_API_KEY` = your key
4. Click **Deploy** — done in ~2 minutes!

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- **AI Model**: [Sarvam AI](https://sarvam.ai) — `sarvam-105b-conversations`
- **Speech-to-Text**: Sarvam `saaras:v2`
- **Text-to-Speech**: Sarvam `bulbul:v3` (Ritu speaker)
- **Maps**: [OpenStreetMap](https://openstreetmap.org) + [Overpass API](https://overpass-api.de) (free, no API key needed)
- **UI**: Vanilla CSS + [Framer Motion](https://www.framer.com/motion/) + [Lucide Icons](https://lucide.dev)
- **Deployment**: [Vercel](https://vercel.com)

---

## 🎯 How to Use

1. **Type or speak** your request in Hinglish, Hindi, or English
2. **Voice**: Click the 🎤 mic → speak → click mic again to send
3. SAARTHI will **autonomously search**, **check availability**, and **ask for confirmation** before booking
4. Click **✅ Haan, Book Karo** to confirm any action

### Example Prompts

```
"Bhai, aaj raat 8 baje 4 logon ke liye koi achha South Indian restaurant dhundh de"
"Saravana Bhavan book krdo"
"Aaj ki date kya hai?"
"Budget ₹1500 ke andar koi cafe suggest karo"
```

---

## 📁 Project Structure

```
saarthi/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts    # Agent API endpoint
│   │   │   ├── stt/route.ts     # Speech-to-Text API
│   │   │   └── tts/route.ts     # Text-to-Speech API
│   │   ├── page.tsx             # Main UI
│   │   └── globals.css          # Styles
│   └── lib/
│       └── agent/
│           ├── saarthi.ts       # Core agent loop
│           ├── types.ts         # TypeScript types
│           └── tools/
│               ├── registry.ts      # Tool registration system
│               ├── restaurant.ts    # Restaurant search + booking tools
│               └── location.ts      # Geolocation tool
├── .env                         # API keys (never committed)
└── .gitignore
```

---

## 🔮 Roadmap

- [ ] **Real Phone Calls** — Sarvam Voice Agent calls the restaurant directly via Twilio/Exotel
- [ ] **More Skills** — Cab booking, flight search, hotel reservations
- [ ] **User Profiles** — Save preferences, past bookings, dietary restrictions
- [ ] **Multi-language** — Tamil, Telugu, Bengali support
- [ ] **Persistent Memory** — Remember your favorite restaurants and timings

---

## 🙏 Built With

- [Sarvam AI](https://sarvam.ai) — India's own AI for Indic languages
- [OpenStreetMap](https://openstreetmap.org) — Free, open map data
- [Next.js](https://nextjs.org) — The React framework for production
- [Vercel](https://vercel.com) — Instant deployment

---

<div align="center">
  <strong>Made with ❤️ for Bharat 🇮🇳</strong><br/>
  <sub>SAARTHI — साथी — Your Companion</sub>
</div>
