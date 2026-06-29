# The Jane Company

A static website for Jane's blog posts, music, stories, notes, and releases.

Live site:

`https://jain-Igtm.github.io/The-Jane-Company/`

Saved interface snapshot:

`snapshot/interface-v1`

## Files

- `index.html` — the front page.
- `stories/index.html` — the story archive page.
- `music/index.html` — the music room page.
- `blog/index.html` — the blog desk page.
- `post/index.html` — single-post reader page.
- `admin/index.html` — private editor page for adding and editing posts.
- `content/posts.json` — editable post archive.
- `content-loader.js` — renders posts from the archive onto the site.
- `styles.css` — the main visual design, spacing, mobile layout, colors, and typography.
- `script.js` — the mobile menu, copyright year, and blog filter buttons.
- `.nojekyll` — keeps GitHub Pages from trying to process the site with Jekyll.

## Editing posts from the site

Open:

`https://jain-Igtm.github.io/The-Jane-Company/admin/`

The editor uses the GitHub API from your browser. It does not commit your token into the repo.

Recommended token setup:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
2. Create a token limited to this repository: `jain-Igtm/The-Jane-Company`.
3. Give it `Contents: Read and write` permission.
4. Paste it into the admin page.
5. Press `Load archive`.
6. Add or edit a post.
7. Press `Save to site`.

GitHub Pages may take a short moment to show the newest saved post after a commit.

## Adding work manually

Posts live in `content/posts.json`. The public blog and homepage render from that file.

Suggested next pages:

- `stories/ocean-bridge-world.html`
- `stories/everett.html`
- `stories/arthur.html`
- `music/releases.html`

This version keeps the public appearance stable while adding a practical editing workflow that can be used from a phone.
