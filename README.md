# CookKarLo

CookKarLo is a lightweight, dark-themed front-end recipe browser that uses the Tasty (RapidAPI) endpoints to search and display recipes. It includes search, cuisine / time / ingredient filters, a detail modal, and a simple favorites feature that persists using localStorage. The app is built with vanilla HTML, CSS and JavaScript and intended to be served as static files.

Live demo: (You can open `index.html` locally or serve the folder with a static server)

## Features

- Search recipes via the Tasty API
- Cuisine and max time filters
- Filter by included ingredients (client-side simulation)
- Recipe detail modal with ingredients & instructions
- Favorite recipes (stored in browser localStorage)
- Dedicated favorites page (`favorites.html`)
- Accessible, responsive UI with a small, fast footprint

## Tech

- HTML, CSS (no preprocessor)
- Vanilla JavaScript (ES6+)
- Uses RapidAPI Tasty endpoints (via fetch)
- Local persistence using `localStorage`

## Files

- `index.html` — Main app UI (search, results, modal).
- `favorites.html` — Favorites list (reads `rf_favorites` from localStorage).
- `script.js` — All front-end logic: API calls, search/filter logic, modal, favorites handling.
- `styles.css` — App styling and responsive layout.
- `assests/` — Static images (logo) used in the UI.

## Getting started (local)

1. Clone the repository:
   ```
   git clone https://github.com/<your-username>/<repo>.git
   cd <repo>
   ```

2. Provide a RapidAPI Tasty key:
   - The app uses `script.js` with a `RAPIDAPI_KEY` constant. Replace the placeholder key inside `script.js` with your RapidAPI key.
   - Alternative (safer): create a small `config.js` (do not commit this) in the project root and include it before `script.js` in `index.html` and `favorites.html`. Example `config.js`:
     ```js
     // config.js (NOT committed)
     window.RAPIDAPI_KEY = 'your-rapidapi-key';
     window.RAPIDAPI_HOST = 'tasty.p.rapidapi.com';
     ```
     Then modify `script.js` (or rely on `window.*`) to pick up those values. If you keep the current `script.js`, replace the value of `RAPIDAPI_KEY` directly.

   Note: Without a valid key some requests may fail or be rate-limited.

3. Serve the files
   - You can open `index.html` directly in the browser for most demos, but some browsers may restrict local fetch requests. For best results run a static server:
     - Using `serve`:
       ```
       npx serve .
       ```
     - Using `live-server`:
       ```
       npx live-server
       ```
     - Or any static hosting (GitHub Pages, Netlify, Vercel).

4. Open the app
   - Visit `http://localhost:5000` (or the port given by your server) and use the search box. App defaults to a "pasta" search on load.

## Usage

- Search: type a term (e.g., "chicken", "pasta") and press Enter or click Search.
- Filters:
  - Cuisine: narrow results by cuisine tag
  - Max time (min): remove long recipes
  - Include ingredients: add comma-separated ingredient tags to match on recipe content (client-side).
- View details: Click "View" on a card to open the modal with full details (ingredients / instructions).
- Favorites:
  - Click the heart button or “❤ Favorite” in the modal to add/remove a favorite.
  - Favorites persist in localStorage under the key `rf_favorites`.
  - Click "❤️ Favourites" in the topbar to go to the `favorites.html` page which lists saved recipes and lets you open them in the main page.
