// Paste the registration form link here when it is live. Every Register button
// then opens it, and the "Registration opens soon" state goes away.
const REGISTER_URL = '';

const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupNav() {
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((link) => link.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

function setupRegister() {
  if (!REGISTER_URL) return;

  $$('[data-register]').forEach((link) => {
    link.href = REGISTER_URL;
    link.target = '_blank';
    link.rel = 'noopener';
  });

  const main = document.querySelector('[data-register-main]');
  main.classList.remove('is-off');
  main.removeAttribute('aria-disabled');
  main.textContent = 'Register your team';
  document.querySelector('[data-register-note]').textContent = 'Registration is open. Here’s what you’ll need.';
}

function buildClock() {
  const ticks = document.querySelector('.clock__ticks');
  ticks.append(...Array.from({ length: 13 }, () => document.createElement('i')));
}

// Numbers are already correct in the HTML; this only animates them on reveal.
function countUp(el) {
  const target = Number(el.dataset.count);
  const format = new Intl.NumberFormat('en-IN');
  const start = performance.now();
  const duration = 1300;

  const frame = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = `₹${format.format(Math.round(target * eased))}`;
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function setupReveal() {
  if (reducedMotion || !('IntersectionObserver' in window)) {
    $$('.reveal, .podium, .clock, .scribble').forEach((el) => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      $$('[data-count]', entry.target).forEach(countUp);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

  $$('.reveal, .podium').forEach((el) => observer.observe(el));
}

setupNav();
setupRegister();
buildClock();
setupReveal();
