(() => {
  const script = document.currentScript;
  const postsUrl = script?.dataset.postsUrl || 'content/posts.json';
  const postBase = script?.dataset.postBase || 'post/';
  const config = window.JANE_SUPABASE_CONFIG || {};

  const isSupabaseConfigured = Boolean(
    config.url &&
    config.anonKey &&
    /^https:\/\/.+\.supabase\.co\/?$/.test(config.url) &&
    config.anonKey.length > 20
  );

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const normalizePosts = (data) => {
    const posts = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : [];
    return posts
      .filter((post) => post && post.status !== 'draft')
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  };

  const formatDate = (value) => {
    if (!value) return 'Undated';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const makePostUrl = (post) => `${postBase}?slug=${encodeURIComponent(post.slug || post.id || '')}`;

  const renderCard = (post) => `
    <article class="post-card" data-kind="${escapeHtml(post.category || 'notes')}">
      <time datetime="${escapeHtml(post.date || '')}">${escapeHtml(formatDate(post.date))}</time>
      <h3>${escapeHtml(post.title || 'Untitled')}</h3>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <a href="${escapeHtml(makePostUrl(post))}">Read entry</a>
    </article>
  `;

  const renderLists = (posts) => {
    document.querySelectorAll('[data-post-list]').forEach((container) => {
      const limit = Number.parseInt(container.dataset.limit || '', 10);
      const category = container.dataset.category;
      let visiblePosts = posts;

      if (category && category !== 'all') {
        visiblePosts = visiblePosts.filter((post) => post.category === category);
      }

      if (Number.isFinite(limit)) {
        visiblePosts = visiblePosts.slice(0, limit);
      }

      if (!visiblePosts.length) {
        container.innerHTML = '<article class="post-card"><h3>No entries yet</h3><p>The archive is ready, but nothing has been published in this section yet.</p></article>';
        return;
      }

      container.innerHTML = visiblePosts.map(renderCard).join('');
    });
  };

  const renderPostDetail = (posts) => {
    const detail = document.querySelector('[data-post-detail]');
    if (!detail) return;

    const slug = new URLSearchParams(window.location.search).get('slug');
    const post = posts.find((item) => item.slug === slug || item.id === slug);

    if (!slug || !post) {
      detail.innerHTML = `
        <div>
          <p class="eyebrow">Entry not found</p>
          <h1>Nothing on this desk.</h1>
          <p class="hero-text">That post does not exist yet, or it has not been published.</p>
          <div class="hero-actions"><a class="button primary" href="../blog/">Return to blog</a></div>
        </div>
      `;
      return;
    }

    const paragraphs = String(post.body || post.excerpt || '')
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
      .join('');

    document.title = `${post.title} · The Jane Company`;
    detail.innerHTML = `
      <div>
        <a class="back-link" href="../blog/">← Back to blog</a>
        <p class="eyebrow">${escapeHtml(post.category || 'notes')}</p>
        <h1>${escapeHtml(post.title || 'Untitled')}</h1>
        <p class="hero-text"><time datetime="${escapeHtml(post.date || '')}">${escapeHtml(formatDate(post.date))}</time></p>
        <div class="essay-body">${paragraphs}</div>
      </div>
    `;
  };

  const loadFromSupabase = async () => {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase
      .from('posts')
      .select('id, slug, title, date, category, excerpt, body, status, created_at, updated_at')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const loadFromJson = async () => {
    const response = await fetch(`${postsUrl}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load posts: ${response.status}`);
    return response.json();
  };

  const loadPosts = async () => {
    try {
      let rawData;

      if (isSupabaseConfigured) {
        try {
          rawData = await loadFromSupabase();
        } catch (error) {
          console.warn('Supabase loading failed. Falling back to local JSON archive.', error);
          rawData = await loadFromJson();
        }
      } else {
        rawData = await loadFromJson();
      }

      const posts = normalizePosts(rawData);
      renderLists(posts);
      renderPostDetail(posts);
      window.dispatchEvent(new CustomEvent('posts:rendered'));
    } catch (error) {
      console.error(error);
      document.querySelectorAll('[data-post-list]').forEach((container) => {
        container.innerHTML = '<article class="post-card"><h3>Posts could not load</h3><p>The room exists, but the archive could not be read right now.</p></article>';
      });
    }
  };

  loadPosts();
})();
