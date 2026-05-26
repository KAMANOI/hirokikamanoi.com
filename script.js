/* ===== Nav ===== */
const nav = document.getElementById('nav');
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

/* ===== Parallax hero ===== */
const heroEl = document.getElementById('hero');
function applyHeroParallax() {
  if (!heroEl) return;
  const scrollY = window.scrollY;
  heroEl.style.backgroundPositionY = `calc(50% + ${scrollY * 0.32}px)`;
}

/* ===== Background color per chapter ===== */
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

/* ===== Unified rAF scroll handler ===== */
let rafPending = false;
window.addEventListener('scroll', () => {
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      syncBg();
      applyHeroParallax();
      rafPending = false;
    });
  }
}, { passive: true });

/* ===== Mobile menu ===== */
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

/* ===== Scroll reveal (section elements) ===== */
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.10, rootMargin: '0px 0px -48px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
/* chapter-header の line-draw アニメーション用 */
document.querySelectorAll('.chapter-header').forEach(el => revealObserver.observe(el));

/* ===== Stagger list items ===== */
document.querySelectorAll(
  '.product-list, .research-list, .book-list, .timeline-list, .award-list, .menu-list, .concept-list, .notice-list'
).forEach(list => {
  const items = Array.from(list.querySelectorAll(':scope > li'));
  items.forEach((item, i) => {
    item.classList.add('stagger-item');
    item.style.transitionDelay = `${i * 0.07}s`;
  });
});

const staggerObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      staggerObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
);
document.querySelectorAll('.stagger-item').forEach(el => staggerObserver.observe(el));

/* ===== Hero canvas particles ===== */
(function initParticles() {
  if (!heroEl) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-canvas';
  heroEl.insertBefore(canvas, heroEl.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H;
  let mouse = { x: 0.5, y: 0.5 };
  const COUNT = 65;

  function resize() {
    W = canvas.width = heroEl.offsetWidth;
    H = canvas.height = heroEl.offsetHeight;
  }

  let particles = [];
  function createParticles() {
    particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random(),           // depth 0–1 (closer = 1)
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.14,
    }));
  }

  resize();
  createParticles();
  window.addEventListener('resize', () => { resize(); createParticles(); }, { passive: true });

  heroEl.addEventListener('mousemove', e => {
    const rect = heroEl.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / W;
    mouse.y = (e.clientY - rect.top) / H;
  }, { passive: true });

  let rafId;
  function render() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      /* drift + subtle mouse parallax (closer particles react more) */
      p.x += p.vx + (mouse.x - 0.5) * 0.35 * p.z;
      p.y += p.vy + (mouse.y - 0.5) * 0.25 * p.z;

      /* wrap edges */
      if (p.x < -2) p.x = W + 2;
      else if (p.x > W + 2) p.x = -2;
      if (p.y < -2) p.y = H + 2;
      else if (p.y > H + 2) p.y = -2;

      /* size and opacity scale with depth */
      const size  = p.z * 2.2 + 0.4;
      const alpha = p.z * 0.22 + 0.04;

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });
    rafId = requestAnimationFrame(render);
  }

  /* バックグラウンドタブでは停止してバッテリー消費を抑える */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else render();
  });

  render();
})();

/* ===== Lightbox ===== */
(function initLightbox() {
  const cells = document.querySelectorAll('.photo-category-cell[style*="background-image"]');
  if (!cells.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<button class="lightbox-close" aria-label="閉じる">&times;</button><img src="" alt="">';
  document.body.appendChild(lb);

  const img = lb.querySelector('img');
  const closeBtn = lb.querySelector('.lightbox-close');

  function openLightbox(url) {
    img.src = url;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  cells.forEach(cell => {
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', () => {
      const bg = cell.style.backgroundImage;
      const match = bg.match(/url\(['"]?(.+?)['"]?\)/);
      if (match) openLightbox(match[1]);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
})();

/* ===== Custom cursor (desktop only) ===== */
(function initCursor() {
  if ('ontouchstart' in window) return;

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot  hidden';
  ring.className = 'cursor-ring hidden';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mx = 0, my = 0;   /* current mouse */
  let rx = 0, ry = 0;   /* ring (lerped) */

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    dot.classList.remove('hidden');
    ring.classList.remove('hidden');
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    dot.classList.add('hidden');
    ring.classList.add('hidden');
  });

  /* smooth follow for ring */
  function animateCursor() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  /* scale ring on interactive elements */
  document.querySelectorAll('a, button, .btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });
})();
