# 🔐 Vaulty — Personal Media Tracker

> Track every anime, movie and TV show you watch — all in one place.

Vaulty is a **full-stack personal media tracker** built with **Next.js 15** and **Supabase**. It lets you keep a private vault of everything you've watched, with smart organization, watch-status tracking, episode counters, and one-click import from your favorite streaming platforms.

---

## ✨ Features

### 🗂️ Vault Management
- Add **anime, movies and TV shows** to your personal vault
- Track status: **Watching · Completed · Dropped · Plan to Watch**
- Log **episode progress**, start & finish dates, personal ratings and notes
- **Search** across your entire library instantly
- **Grid & List view** modes

### 📊 Dashboard & Stats
- **Home dashboard** showing *Currently Watching* cards and *Recent History*
- **Stats view**: total titles, completed, currently watching, total episodes watched
- Dedicated sections for **Movies** and **TV Shows**

### 📥 Import from Streaming Platforms
Import your existing watch history without having to add everything manually:

| Platform | Method |
|---|---|
| 🟠 Crunchyroll | **Chrome Extension** included (auto-scans history, exports CSV) |
| 🔵 Prime Video | **Chrome Extension** included (scans watch history, exports JSON) |
| 🔴 Netflix | Native CSV export via *Account → Security & Privacy → Download personal information* |

### 📤 Export
- Export your full vault as a **plain-text list** at any time (Danger Zone in Stats)

### 👤 Authentication
- Email/password sign-up and sign-in
- **Login with username or email** (whichever you remember)
- Change email, change password, sign out — all from the Settings modal
- Unique, validated usernames (`letters`, `numbers`, `_` only)

### 🎨 UI / UX
- Clean **dark theme** with custom Vaulty design tokens
- Fully **responsive** (mobile sidebar with bottom nav, desktop sidebar)
- Smooth transitions and micro-animations via **Framer Motion**
- Light/dark theme toggle support

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript / JavaScript (JSX) |
| Database & Auth | [Supabase](https://supabase.com/) (PostgreSQL + Auth) |
| Styling | [Tailwind CSS v3](https://tailwindcss.com/) |
| Animations | [Framer Motion](https://www.framer-motion.com/) |
| External APIs | [TMDB](https://www.themoviedb.org/) · [MyAnimeList](https://myanimelist.net/apiconfig) |
| Package manager | [pnpm](https://pnpm.io/) |
| Browser Extensions | Chrome Extension MV3 (Crunchyroll & Prime Video) |

---

## 📁 Project Structure

```
vaulty-nextjs/
├── app/                    # Next.js App Router
│   └── api/                # API routes (TMDB, MAL, manga)
├── components/             # React components (UI, modals, views)
├── hooks/                  # Custom React hooks (auth, animes, preferences)
├── lib/                    # Supabase client, profile helpers
├── extensions/
│   ├── crunchyroll-extension/   # Chrome extension — Crunchyroll exporter
│   └── primevideo-extension/    # Chrome extension — Prime Video exporter
└── public/                 # Static assets
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com/) project
- A [TMDB API key](https://www.themoviedb.org/settings/api) *(optional — for auto-fill metadata)*
- A [MAL Client ID](https://myanimelist.net/apiconfig) *(optional — for anime metadata)*

### 1. Clone & install

```bash
git clone https://github.com/your-username/vaulty-nextjs.git
cd vaulty-nextjs
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional — for metadata auto-fill
TMDB_API_KEY=your_tmdb_api_key
MAL_CLIENT_ID=your_mal_client_id
```

### 3. Set up the Supabase database

Run the migration SQL included in the project:

```bash
# In your Supabase SQL Editor, run:
supabase_migration_profiles.sql
```

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 Browser Extensions

Two Chrome extensions are included in the `extensions/` folder to help import your existing watch history:

### Installing an extension (Chrome / Edge / Brave)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the extension folder
4. Navigate to the platform's history page and click **START SCAN**

| Extension | Folder | History URL |
|---|---|---|
| Crunchyroll Exporter | `extensions/crunchyroll-extension` | `crunchyroll.com/history` |
| Prime Video Exporter | `extensions/primevideo-extension` | `amazon.com/gp/video/history` |

---

## 🗄️ Database Schema (Supabase)

### `animes` table
| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Supabase auth user |
| `title` | text | Title |
| `type` | text | `Anime` · `Pelicula` · `Serie` |
| `status` | text | `Viendo` · `Terminado` · `Dropeado` · `Plan to Watch` |
| `currentEp` | int | Episodes watched |
| `totalEps` | int | Total episodes |
| `startDate` | date | Watch start date |
| `finishDate` | date | Watch finish date |
| `rating` | int | Personal rating |
| `notes` | text | Personal notes |
| `imageUrl` | text | Cover image URL |

### `profiles` table
| Column | Type | Description |
|---|---|---|
| `id` | uuid | References `auth.users` |
| `username` | text | Unique username |
| `email` | text | User email |

---

## 🛠️ Available Scripts

```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
```

---

## 🔒 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `TMDB_API_KEY` | ⚡ Optional | TMDB API key for metadata |
| `MAL_CLIENT_ID` | ⚡ Optional | MyAnimeList Client ID |

---

## 📄 License

This project is private and not open for public distribution.

---

*Built with ❤️ using Next.js & Supabase*
