<h3><strong>AnimeVault</strong></h3>
<strong>AnimeVault</strong> is a high-performance media tracker designed for enthusiasts who need a clean, high-density interface to manage their viewing progress. Built to solve the scaling issues of traditional trackers on ultra-wide displays, it offers a tailored grid system and automated metadata synchronization.

<h3><strong>Tech Stack</strong></h3>
<strong>Frontend:</strong> React 18 with Vite.

<strong>Styling:</strong> Tailwind CSS (Custom Grid implementation).

<strong>Database & Auth:</strong> Supabase (PostgreSQL).

<strong>API:</strong> Jikan API (MyAnimeList wrapper).

<strong>Deployment:</strong> Vercel.

<h3><strong>Custom Hooks</strong></h3>
<strong>useAuth:</strong> Manages authentication state.
<br><br>

<strong>useAnimes:</strong> Handles fetching, creating and updating anime.

<strong>useUserPreferences:</strong> Manages user-specific UI preferences

<h3><strong>Core Services</strong></h3>
<strong>Supabase Client:</strong> Handles secure communication with the backend and Row Level Security (RLS).

<strong>Jikan Service:</strong> A specialized fetcher that normalizes external metadata (score, synopsis, dates) into the app's internal model.

<strong>Data Mapper:</strong> A middleware service that transforms raw API data into a consistent format: {releaseYear}. {score}/10. {synopsis}...

<h3><strong>Key Features</strong></h3>
<strong>Ultra-Wide Optimization:</strong> Custom CSS Grid that supports up to 15+ cards per row on 2700px+ displays.

<strong>Smart Search:</strong> Real-time suggestions with automated form filling.

<strong>Migration Engine:</strong> Built-in tool to import and normalize data from legacy local storage versions.

<strong>Responsive Modes:</strong> Seamless switching between a visual "Poster Grid" and a data-focused "List View".