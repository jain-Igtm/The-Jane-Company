(() => {
  const script = document.currentScript;
  const postsUrl = script?.dataset.postsUrl || 'content/posts.json';
  const postBase = script?.dataset.postBase || 'post/';

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const normalizePosts = (data) => {
    const posts = Array.isArray(data?.posts) ? data.posts : [];
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
        <p class="eyebrow">Entry not found</p>
        <h1>Nothing on this desk.</h1>
        <p class="hero-text">That post does not exist yet, or it has not been published.</p>
        <div class="hero-actions"><a class="button primary" href="../blog/">Return to blog</a></div>
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
      <a class="back-link" href="../blog/">← Back to blog</a>
      <p class="eyebrow">${escapeHtml(post.category || 'notes')}</p>
      <h1>${escapeHtml(post.title || 'Untitled')}</h1>
      <p class="hero-text"><time datetime="${escapeHtml(post.date || '')}">${escapeHtml(formatDate(post.date))}</time></p>
      <div class="essay-body">${paragraphs}</div>
    `;
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`${postsUrl}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load posts: ${response.status}`);
      const data = await response.json();
      const posts = normalizePosts(data);
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
