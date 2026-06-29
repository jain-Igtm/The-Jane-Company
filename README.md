# The Jane Company

A static front end prepared for a real Supabase backend.

Live site:

`https://jain-Igtm.github.io/The-Jane-Company/`

Saved interface snapshot:

`snapshot/interface-v1`

## Current architecture

- GitHub stores the code.
- GitHub Pages hosts the public site.
- Supabase will store real posts once connected.
- The local JSON archive still exists as a fallback so the site does not break during setup.

## Files

- `index.html` — the front page.
- `stories/index.html` — the story archive page.
- `music/index.html` — the music room page.
- `blog/index.html` — the blog desk page.
- `post/index.html` — single-post reader page.
- `admin/index.html` — Supabase-backed editor page.
- `admin/admin.js` — login, post editing, saving, and deleting through Supabase.
- `admin/admin.css` — admin-only styling.
- `supabase-config.js` — browser config for Supabase project URL and anon key.
- `supabase/schema.sql` — database table and Row Level Security policies.
- `content/posts.json` — local fallback post archive.
- `content-loader.js` — renders posts; tries Supabase first when configured, then falls back to JSON.
- `styles.css` — the main visual design, spacing, mobile layout, colors, and typography.
- `script.js` — the mobile menu, copyright year, and blog filter buttons.
- `.nojekyll` — keeps GitHub Pages from trying to process the site with Jekyll.

## Supabase setup

1. Create a Supabase project named `The Jane Company`.
2. Open the Supabase SQL Editor.
3. Paste and run the contents of `supabase/schema.sql`.
4. In Supabase Auth, create your admin user with email and password.
5. Copy your Project URL and anon/public key.
6. Edit `supabase-config.js`:

```js
window.JANE_SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',
  anonKey: 'YOUR-ANON-OR-PUBLISHABLE-KEY'
};
```

7. Open the editor:

`https://jain-Igtm.github.io/The-Jane-Company/admin/`

8. Sign in with the Supabase user.
9. Create or edit posts.

Published posts appear publicly. Draft posts stay hidden from the public site.

## Important safety note

Never place a Supabase `service_role` key in this repo or in browser code. The browser should only use the anon/public key, and database permissions should be controlled with Row Level Security.

## Adding work manually

Until Supabase is connected, public posts still load from `content/posts.json`.

Suggested next pages:

- `stories/ocean-bridge-world.html`
- `stories/everett.html`
- `stories/arthur.html`
- `music/releases.html`

This version keeps the public appearance stable while preparing the site for real database-backed editing.
