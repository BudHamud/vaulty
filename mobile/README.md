# Vaulty Mobile

Expo + React Native starter for Vaulty, connected to the same Supabase project used by `vaulty-nextjs`.

## Included in this first pass

- Email or username sign-in
- Email/password sign-up with `profiles` row creation
- Persistent Supabase session for React Native
- Home screen with profile greeting and collection stats
- Metadata search for anime, series and movies in the add flow
- Quick-add form for anime, series and movies
- Vault list with delete action

## Setup

1. Install dependencies:

```bash
cd vaulty-mobile
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Fill these values in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
```

`EXPO_PUBLIC_TMDB_API_KEY` is required for movie and TV metadata search. Anime search uses Jikan and does not need a key.

4. Start Expo:

```bash
npm run start
```

## Next mobile milestones

- Port edit flows, filters and dashboard sections from the web app
- Add native-safe modals, optimistic updates and import flows