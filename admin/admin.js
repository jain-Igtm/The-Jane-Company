const REPO_OWNER = 'jain-Igtm';
const REPO_NAME = 'The-Jane-Company';
const BRANCH = 'main';
const POSTS_PATH = 'content/posts.json';

const tokenInput = document.querySelector('#github-token');
const rememberToken = document.querySelector('#remember-token');
const loadButton = document.querySelector('#load-posts');
const clearTokenButton = document.querySelector('#clear-token');
const newButton = document.querySelector('#new-post');
const saveButton = document.querySelector('#save-post');
const statusBox = document.querySelector('#status-box');
const picker = document.querySelector('#post-picker');
const form = document.querySelector('#post-form');

let archive = { posts: [] };
let archiveSha = null;
let selectedId = null;

const fields = {
  title: document.querySelector('#post-title'),
  slug: document.querySelector('#post-slug'),
  date: document.querySelector('#post-date'),
  category: document.querySelector('#post-category'),
  status: document.querySelector('#post-status'),
  excerpt: document.querySelector('#post-excerpt'),
  body: document.querySelector('#post-body')
};

const setStatus = (message, kind = '') => {
  statusBox.textContent = message;
  statusBox.className = `status-box ${kind}`.trim();
};

const getToken = () => tokenInput.value.trim();

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/['"]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const decodeBase64Unicode = (base64) => {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const encodeBase64Unicode = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const apiRequest = async (url, options = {}) => {
  const token = getToken();
  if (!token) throw new Error('Paste a GitHub token first.');

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `GitHub request failed: ${response.status}`);
  }
  return data;
};

const contentUrl = () => `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}`;

const loadArchive = async () => {
  setStatus('Opening the archive...');
  const data = await apiRequest(`${contentUrl()}?ref=${encodeURIComponent(BRANCH)}`);
  archiveSha = data.sha;
  archive = JSON.parse(decodeBase64Unicode(data.content));
  if (!Array.isArray(archive.posts)) archive.posts = [];
  archive.posts.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  renderPicker();
  fillForm(archive.posts[0] || null);
  setStatus(`Archive loaded. ${archive.posts.length} entr${archive.posts.length === 1 ? 'y' : 'ies'} found.`, 'good');
};

const renderPicker = () => {
  picker.innerHTML = '';

  if (!archive.posts.length) {
    picker.innerHTML = '<p class="security-note">No posts yet. Create the first one.</p>';
    return;
  }

  archive.posts.forEach((post) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = post.id === selectedId ? 'active' : '';
    button.innerHTML = `${post.title || 'Untitled'}<small>${post.date || 'Undated'} · ${post.category || 'notes'} · ${post.status || 'published'}</small>`;
    button.addEventListener('click', () => fillForm(post));
    picker.appendChild(button);
  });
};

const fillForm = (post) => {
  selectedId = post?.id || null;
  fields.title.value = post?.title || '';
  fields.slug.value = post?.slug || '';
  fields.date.value = post?.date || new Date().toISOString().slice(0, 10);
  fields.category.value = post?.category || 'notes';
  fields.status.value = post?.status || 'published';
  fields.excerpt.value = post?.excerpt || '';
  fields.body.value = post?.body || '';
  renderPicker();
};

const collectForm = () => {
  const title = fields.title.value.trim();
  const slug = slugify(fields.slug.value || title);

  if (!title) throw new Error('The post needs a title.');
  if (!slug) throw new Error('The post needs a slug.');

  return {
    id: selectedId || slug,
    slug,
    title,
    date: fields.date.value || new Date().toISOString().slice(0, 10),
    category: fields.category.value || 'notes',
    excerpt: fields.excerpt.value.trim(),
    body: fields.body.value.trim(),
    status: fields.status.value || 'published'
  };
};

const saveArchive = async () => {
  const post = collectForm();
  const existingIndex = archive.posts.findIndex((item) => item.id === post.id || item.slug === post.slug);

  if (existingIndex >= 0) {
    archive.posts[existingIndex] = post;
  } else {
    archive.posts.unshift(post);
  }

  archive.posts.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const content = JSON.stringify(archive, null, 2) + '\n';
  setStatus('Saving to GitHub...');

  const result = await apiRequest(contentUrl(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Update post archive: ${post.title}`,
      content: encodeBase64Unicode(content),
      sha: archiveSha,
      branch: BRANCH
    })
  });

  archiveSha = result.content.sha;
  selectedId = post.id;
  renderPicker();

  const liveUrl = `../post/?slug=${encodeURIComponent(post.slug)}`;
  setStatus(`Saved. GitHub Pages may need a moment to refresh. Live path: ${liveUrl}`, 'good');
};

const makeNewPost = () => {
  selectedId = null;
  fillForm({
    title: '',
    slug: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'notes',
    status: 'published',
    excerpt: '',
    body: ''
  });
  fields.title.focus();
  setStatus('New blank entry opened.');
};

fields.title.addEventListener('input', () => {
  if (!selectedId && !fields.slug.value.trim()) {
    fields.slug.value = slugify(fields.title.value);
  }
});

loadButton.addEventListener('click', async () => {
  try {
    if (rememberToken.checked) localStorage.setItem('janeCompanyGithubToken', getToken());
    await loadArchive();
  } catch (error) {
    setStatus(error.message, 'bad');
  }
});

clearTokenButton.addEventListener('click', () => {
  localStorage.removeItem('janeCompanyGithubToken');
  tokenInput.value = '';
  setStatus('Saved token cleared from this browser.', 'good');
});

newButton.addEventListener('click', makeNewPost);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    if (!archiveSha) await loadArchive();
    if (rememberToken.checked) localStorage.setItem('janeCompanyGithubToken', getToken());
    await saveArchive();
  } catch (error) {
    setStatus(error.message, 'bad');
  }
});

const storedToken = localStorage.getItem('janeCompanyGithubToken');
if (storedToken) {
  tokenInput.value = storedToken;
  rememberToken.checked = true;
  setStatus('Saved token found on this browser. Press “Load archive” to begin.');
} else {
  setStatus('Paste a GitHub token with Contents read/write access, then load the archive.');
}
