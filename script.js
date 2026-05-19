const nav = document.getElementById('nav');
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

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

// Accordion
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!expanded));
    const body = trigger.closest('.section-inner').querySelector('.accordion-body');
    body.style.maxHeight = expanded ? '0' : body.scrollHeight + 'px';
  });
});

document.querySelectorAll('.accordion-body.open').forEach(body => {
  body.style.maxHeight = body.scrollHeight + 'px';
});
