const nav = document.getElementById('nav');
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

// Background color per chapter
const chapters = document.querySelectorAll('.chapter');
const heroBg = '#0d0d0d';
let activeBg = heroBg;

function syncBg() {
  let next = heroBg;
  chapters.forEach(ch => {
    if (ch.getBoundingClientRect().top <= window.innerHeight * 0.5) {
      next = ch.dataset.bg;
    }
  });
  if (next !== activeBg) {
    activeBg = next;
    document.body.style.backgroundColor = next;
  }
}

// Single scroll handler with rAF to avoid redundant work per frame
let rafPending = false;
window.addEventListener('scroll', () => {
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      syncBg();
      rafPending = false;
    });
  }
}, { passive: true });

// Mobile menu
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  links.classList.toggle('open', !open);
});

links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('open');
  });
});

// Scroll reveal
const ro = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      ro.unobserve(e.target);
    }
  }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
