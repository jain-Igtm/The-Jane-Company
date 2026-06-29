import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.JANE_SUPABASE_CONFIG || {};
const isConfigured = Boolean(
  config.url &&
  config.anonKey &&
  /^https:\/\/.+\.supabase\.co\/?$/.test(config.url) &&
  config.anonKey.length > 20
);

const loginForm = document.querySelector('#login-form');
const signOutButton = document.querySelector('#sign-out');
const statusBox = document.querySelector('#status-box');
const setupHeading = document.querySelector('#setup-heading');
const setupCopy = document.querySelector('#setup-copy');
const picker = document.querySelector('#post-picker');
const form = document.querySelector('#post-form');
const newButton = document.querySelector('#new-post');
const deleteButton = document.querySelector('#delete-post');
const editorSection = document.querySelector('.admin-layout');

const fields = {
  email: document.querySelector('#login-email'),
  password: document.querySelector('#login-password'),
  title: document.querySelector('#post-title'),
  slug: document.querySelector('#post-slug'),
  date: document.querySelector('#post-date'),
  category: document.querySelector('#post-category'),
  status: document.querySelector('#post-status'),
  excerpt: document.querySelector('#post-excerpt'),
  body: document.querySelector('#post-body')
};

let supabase = null;
let posts = [];
let selectedId = null;
let currentUser = null;

const setStatus = (message, kind = '') => {
  statusBox.textContent = message;
  statusBox.className = `status-box ${kind}`.trim();
};

const setEditorEnabled = (enabled) => {
  editorSection.classList.toggle('is-disabled', !enabled);
};

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/['"]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const formatDate = (value) => value || new Date().toISOString().slice(0, 10);

const fillForm = (post = null) => {
  selectedId = post?.id || null;
  fields.title.value = post?.title || '';
  fields.slug.value = post?.slug || '';
  fields.date.value = formatDate(post?.date);
  fields.category.value = post?.category || 'notes';
  fields.status.value = post?.status || 'published';
  fields.excerpt.value = post?.excerpt || '';
  fields.body.value = post?.body || '';
  renderPicker();
};

const renderPicker = () => {
  picker.innerHTML = '';

  if (!posts.length) {
    picker.innerHTML = '<p class="security-note">No Supabase posts yet. Press “New post” and write the first one.</p>';
    return;
  }

  posts.forEach((post) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = post.id === selectedId ? 'active' : '';
    button.innerHTML = `${post.title || 'Untitled'}<small>${post.date || 'Undated'} · ${post.category || 'notes'} · ${post.status || 'draft'}</small>`;
    button.addEventListener('click', () => fillForm(post));
    picker.appendChild(button);
  });
};

const collectForm = () => {
  const title = fields.title.value.trim();
  const slug = slugify(fields.slug.value || title);

  if (!title) throw new Error('The post needs a title.');
  if (!slug) throw new Error('The post needs a slug.');
  if (!currentUser?.id) throw new Error('Sign in before saving.');

  return {
    title,
    slug,
    date: formatDate(fields.date.value),
    category: fields.category.value || 'notes',
    excerpt: fields.excerpt.value.trim(),
    body: fields.body.value.trim(),
    status: fields.status.value || 'draft',
    author_id: currentUser.id
  };
};

const loadPosts = async () => {
  if (!supabase) return;

  setStatus('Opening Supabase archive...');
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  posts = data || [];
  fillForm(posts[0] || null);
  setStatus(`Archive loaded. ${posts.length} entr${posts.length === 1 ? 'y' : 'ies'} found.`, 'good');
};

const savePost = async () => {
  const payload = collectForm();
  setStatus('Saving post to Supabase...');

  let result;
  if (selectedId) {
    result = await supabase
      .from('posts')
      .update(payload)
      .eq('id', selectedId)
      .select()
      .single();
  } else {
    result = await supabase
      .from('posts')
      .insert(payload)
      .select()
      .single();
  }

  if (result.error) throw result.error;

  selectedId = result.data.id;
  await loadPosts();
  fillForm(result.data);
  setStatus(`Saved. Public link: ../post/?slug=${encodeURIComponent(result.data.slug)}`, 'good');
};

const deletePost = async () => {
  if (!selectedId) {
    setStatus('No saved post selected to delete.', 'bad');
    return;
  }

  const post = posts.find((item) => item.id === selectedId);
  const confirmed = window.confirm(`Delete “${post?.title || 'this post'}”? This cannot be undone from the editor.`);
  if (!confirmed) return;

  setStatus('Deleting post...');
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', selectedId);

  if (error) throw error;

  selectedId = null;
  await loadPosts();
  setStatus('Post deleted.', 'good');
};

const newPost = () => {
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

const signIn = async (event) => {
  event.preventDefault();
  if (!supabase) return;

  setStatus('Signing in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: fields.email.value.trim(),
    password: fields.password.value
  });

  if (error) throw error;

  currentUser = data.user;
  fields.password.value = '';
  setEditorEnabled(true);
  setupHeading.textContent = 'Signed in.';
  setupCopy.textContent = currentUser.email || 'Editor session active.';
  await loadPosts();
};

const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  currentUser = null;
  posts = [];
  selectedId = null;
  fillForm(null);
  setEditorEnabled(false);
  setupHeading.textContent = 'Signed out.';
  setupCopy.textContent = 'Sign in again to edit posts.';
  setStatus('Signed out.', 'good');
};

fields.title.addEventListener('input', () => {
  if (!selectedId && !fields.slug.value.trim()) {
    fields.slug.value = slugify(fields.title.value);
  }
});

loginForm.addEventListener('submit', async (event) => {
  try {
    await signIn(event);
  } catch (error) {
    setStatus(error.message, 'bad');
  }
});

signOutButton.addEventListener('click', async () => {
  try {
    await signOut();
  } catch (error) {
    setStatus(error.message, 'bad');
  }
});

newButton.addEventListener('click', newPost);

deleteButton.addEventListener('click', async () => {
  try {
    await deletePost();
  } catch (error) {
    setStatus(error.message, 'bad');
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await savePost();
  } catch (error) {
    setStatus(error.message, 'bad');
  }
});

const init = async () => {
  setEditorEnabled(false);

  if (!isConfigured) {
    setupHeading.textContent = 'Supabase not connected yet.';
    setupCopy.textContent = 'Fill in supabase-config.js with your Supabase project URL and anon key after creating the project.';
    setStatus('Backend scaffold is ready. Create the Supabase project, run supabase/schema.sql, then update supabase-config.js.', 'bad');
    return;
  }

  supabase = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;

  if (currentUser) {
    setEditorEnabled(true);
    setupHeading.textContent = 'Signed in.';
    setupCopy.textContent = currentUser.email || 'Editor session active.';
    await loadPosts();
  } else {
    setupHeading.textContent = 'Supabase connected.';
    setupCopy.textContent = 'Sign in to open the editor.';
    setStatus('Supabase config found. Sign in to begin.', 'good');
  }
};

init().catch((error) => {
  setStatus(error.message, 'bad');
});
