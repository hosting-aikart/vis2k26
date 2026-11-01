const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const views = new Map($$('[data-view]').map((el) => [el.dataset.view, el]));

// Forms belong to a parent page, so its tab stays lit while filling one in.
const TAB_FOR = { 'register-team': 'hackathon', 'apply-pitch': 'pitching', 'book-stall': 'expo' };

function setupNav() {
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  const onScroll = () => {
    const onHero = !views.get('overview').hidden && scrollY <= 24;
    nav.classList.toggle('is-stuck', !onHero);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('hashchange', onScroll);
  addEventListener('load', onScroll);
  onScroll();

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((link) => link.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

// Each page's sub-menu comes from its own sections, so the two cannot drift apart.
function buildSubnavs() {
  views.forEach((view, name) => {
    const host = view.querySelector('[data-subnav]');
    if (!host) return;
    const links = $$('[data-nav]', view).map((section) => {
      const link = document.createElement('a');
      link.href = `#${name}/${section.id}`;
      link.textContent = section.dataset.nav;
      return link;
    });
    const row = document.createElement('nav');
    row.className = 'wrap';
    row.setAttribute('aria-label', 'On this page');
    row.append(...links);
    host.append(row);
  });
}

function route() {
  const [name = '', sectionId] = location.hash.slice(1).split('/');
  // Plain anchors such as the skip link are left to the browser.
  if (name && !views.has(name)) return;

  const current = name || 'overview';
  const changed = views.get(current).hidden;
  views.forEach((view, key) => { view.hidden = key !== current; });
  $$('[data-tab]').forEach((tab) => {
    const active = tab.dataset.tab === (TAB_FOR[current] || current);
    tab.classList.toggle('is-active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });

  const target = sectionId && document.getElementById(sectionId);
  if (target) target.scrollIntoView();
  else if (changed || !sectionId) scrollTo({ top: 0, behavior: 'instant' });
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
    $$('.reveal, .podium, .scribble').forEach((el) => el.classList.add('in'));
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

buildSubnavs();
setupNav();
setupReveal();
route();
addEventListener('hashchange', route);
