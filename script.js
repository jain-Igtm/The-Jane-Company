const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const year = document.querySelector('#year');
const filterButtons = document.querySelectorAll('.filter-button');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const applyPostFilter = () => {
  const activeButton = document.querySelector('.filter-button.active');
  const filter = activeButton?.dataset.filter || 'all';

  document.querySelectorAll('.post-card').forEach((card) => {
    const shouldShow = filter === 'all' || card.dataset.kind === filter || !card.dataset.kind;
    card.classList.toggle('is-hidden', !shouldShow);
  });
};

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    applyPostFilter();
  });
});

window.addEventListener('posts:rendered', applyPostFilter);
