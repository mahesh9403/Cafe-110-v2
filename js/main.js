/* Cafe OneTen — main.js */

// ── HERO SLIDER ──
(function() {
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots   = Array.from(document.querySelectorAll('.hero-dot'));
  if (!slides.length || !dots.length) return;

  let current = 0;
  let timer;
  let paused = false;
  const INTERVAL = 6000; // 6 s per slide

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (idx + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current].classList.add('active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  function start() {
    stop();
    timer = setInterval(() => { if (!paused) goTo(current + 1); }, INTERVAL);
  }

  function stop() { clearInterval(timer); }

  // Dot click navigation
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { stop(); goTo(i); start(); });
  });

  // Pause on hover so users can read the copy
  const heroEl = document.getElementById('hero');
  if (heroEl) {
    heroEl.addEventListener('mouseenter', () => { paused = true;  });
    heroEl.addEventListener('mouseleave', () => { paused = false; });
  }

  // Pause when tab is not visible (battery / perf)
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });

  // Preload the second slide image
  slides.slice(1).forEach(slide => {
    const img = slide.querySelector('img');
    if (img && img.dataset.src) img.src = img.dataset.src;
  });

  start();
})();

// ── CUSTOM CURSOR ──
(function() {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  if (!cursor || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  let cursorVisible = true;
  let cursorRafId;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    if (cursorVisible) cursorRafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Pause rAF when tab is hidden (battery/perf fix)
  document.addEventListener('visibilitychange', () => {
    cursorVisible = !document.hidden;
    if (cursorVisible) animateRing();
    else cancelAnimationFrame(cursorRafId);
  });
})();

// ── NAV SCROLL ──
(function() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

// ── INTERSECTION OBSERVER (reveal animations) ──
(function() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!revealEls.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));
})();

// ── COUNTER ANIMATIONS ──
(function() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseFloat(el.dataset.target);
      const isFloat = target % 1 !== 0;
      const duration = 1600;
      const start    = performance.now();
      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        const val  = target * ease;
        el.textContent = isFloat ? val.toFixed(1) : Math.floor(val);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = isFloat ? target.toFixed(1) : target;
      }
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterIO.observe(c));
})();

// ── SMOOTH SCROLL FOR SAME-PAGE ANCHOR LINKS ──
(function() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

// ── REVIEWS SLIDER ──
(function() {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;
  const cards = Array.from(track.querySelectorAll('.review-card'));
  if (!cards.length) return;
  const dotsWrap = document.getElementById('reviewsDots');
  const countEl = document.getElementById('reviewsCount');
  let idx = 0;
  let timer = null;

  function perView() {
    return window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
  }

  function cardStep() {
    // Use getBoundingClientRect for subpixel accuracy; gap is 2px
    return cards[0].getBoundingClientRect().width + 2;
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const pv = perView();
    const total = Math.max(1, cards.length - pv + 1);
    for (let i = 0; i < total; i++) {
      const btn = document.createElement('button');
      btn.className = 'reviews-dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', 'Review ' + (i + 1));
      btn.addEventListener('click', () => { stop(); go(i); start(); });
      dotsWrap.appendChild(btn);
    }
  }

  function go(to) {
    const pv = perView();
    const max = Math.max(0, cards.length - pv);
    idx = Math.max(0, Math.min(to, max));
    const step = cardStep();
    if (step < 4) return; // layout not ready
    track.style.transform = `translateX(-${idx * step}px)`;
    if (dotsWrap) dotsWrap.querySelectorAll('.reviews-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    if (countEl) countEl.textContent = `${idx + 1} / ${max + 1}`;
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function start() {
    stop(); // always clear before creating a new interval
    timer = setInterval(() => {
      const pv = perView();
      const max = Math.max(0, cards.length - pv);
      go(idx >= max ? 0 : idx + 1);
    }, 5000);
  }

  document.getElementById('reviewsPrev')?.addEventListener('click', () => { stop(); go(idx - 1); start(); });
  document.getElementById('reviewsNext')?.addEventListener('click', () => { stop(); go(idx + 1); start(); });
  track.addEventListener('mouseenter', stop);
  track.addEventListener('mouseleave', start);
  track.addEventListener('touchstart', stop, { passive: true });
  track.addEventListener('touchend', start, { passive: true });

  // Wait for layout before initializing so getBoundingClientRect is accurate
  requestAnimationFrame(() => {
    buildDots();
    go(0);
    start();
  });

  window.addEventListener('resize', () => { stop(); buildDots(); go(0); start(); });
})();

// ── MENU MODAL ──
(function() {
  const MENUS = {
    food: {
      label: 'Food Menu',
      // mobile: one portrait page at a time (12 total)
      pages: [
        '/img/menu-pages/food-1-1.webp', '/img/menu-pages/food-1-2.webp',
        '/img/menu-pages/food-2-1.webp', '/img/menu-pages/food-2-2.webp',
        '/img/menu-pages/food-3-1.webp', '/img/menu-pages/food-3-2.webp',
        '/img/menu-pages/food-4-1.webp', '/img/menu-pages/food-4-2.webp',
        '/img/menu-pages/food-5.webp',
        '/img/menu-pages/food-6-1.webp', '/img/menu-pages/food-6-2.webp',
        '/img/menu-pages/food-7.webp'
      ],
      // desktop: paired landscape spreads (7 total)
      spreads: [
        ['/img/menu-pages/food-1-1.webp', '/img/menu-pages/food-1-2.webp'],
        ['/img/menu-pages/food-2-1.webp', '/img/menu-pages/food-2-2.webp'],
        ['/img/menu-pages/food-3-1.webp', '/img/menu-pages/food-3-2.webp'],
        ['/img/menu-pages/food-4-1.webp', '/img/menu-pages/food-4-2.webp'],
        ['/img/menu-pages/food-5.webp'],
        ['/img/menu-pages/food-6-1.webp', '/img/menu-pages/food-6-2.webp'],
        ['/img/menu-pages/food-7.webp']
      ]
    },
    bev: {
      label: 'Beverages',
      pages: [
        '/img/menu-pages/bev-1-1.webp', '/img/menu-pages/bev-1-2.webp',
        '/img/menu-pages/bev-2-1.webp', '/img/menu-pages/bev-2-2.webp',
        '/img/menu-pages/bev-3-1.webp', '/img/menu-pages/bev-3-2.webp'
      ],
      spreads: [
        ['/img/menu-pages/bev-1-1.webp', '/img/menu-pages/bev-1-2.webp'],
        ['/img/menu-pages/bev-2-1.webp', '/img/menu-pages/bev-2-2.webp'],
        ['/img/menu-pages/bev-3-1.webp', '/img/menu-pages/bev-3-2.webp']
      ]
    }
  };

  const modal    = document.getElementById('menuModal');
  if (!modal) return;
  const bg       = document.getElementById('menuModalBg');
  const closeBtn = document.getElementById('mmClose');
  const img      = document.getElementById('mmImg');
  const imgR     = document.getElementById('mmImgR');
  const counter  = document.getElementById('mmCounter');
  const dotsEl   = document.getElementById('mmDots');
  const prevBtn  = document.getElementById('mmPrev');
  const nextBtn  = document.getElementById('mmNext');
  const tabs     = document.querySelectorAll('.mm-tab');
  let activeTab = 'food', pageIdx = 0;

  function isMobile() { return window.innerWidth < 768; }

  function getItems() {
    return isMobile() ? MENUS[activeTab].pages : MENUS[activeTab].spreads;
  }

  function updateTabCounts() {
    const foodEl = document.getElementById('mmTabFood');
    const bevEl  = document.getElementById('mmTabBev');
    const mobile = isMobile();
    if (foodEl) foodEl.textContent = (mobile ? MENUS.food.pages : MENUS.food.spreads).length + ' pages';
    if (bevEl)  bevEl.textContent  = (mobile ? MENUS.bev.pages  : MENUS.bev.spreads).length  + ' pages';
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    getItems().forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'mm-dot' + (i === pageIdx ? ' active' : '');
      d.setAttribute('aria-label', 'Page ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(d);
    });
  }

  function goTo(i) {
    const items = getItems();
    const mobile = isMobile();
    pageIdx = Math.max(0, Math.min(i, items.length - 1));

    img.classList.add('fading');
    if (imgR) imgR.classList.add('fading');

    setTimeout(() => {
      if (mobile) {
        img.src = items[pageIdx];
        img.alt = MENUS[activeTab].label + ' page ' + (pageIdx + 1);
        if (imgR) { imgR.src = ''; imgR.style.display = 'none'; }
      } else {
        const spread = items[pageIdx];
        img.src = spread[0];
        img.alt = MENUS[activeTab].label + ' spread ' + (pageIdx + 1);
        if (imgR) {
          if (spread.length > 1) {
            imgR.src = spread[1];
            imgR.alt = img.alt;
            imgR.style.display = '';
          } else {
            imgR.src = ''; imgR.style.display = 'none';
          }
        }
      }
      img.classList.remove('fading');
      if (imgR) imgR.classList.remove('fading');
    }, 180);

    counter.textContent = `${pageIdx + 1} / ${items.length}`;
    prevBtn.disabled = pageIdx === 0;
    nextBtn.disabled = pageIdx === items.length - 1;
    dotsEl.querySelectorAll('.mm-dot').forEach((d, idx) => d.classList.toggle('active', idx === pageIdx));
  }

  function switchTab(tab) {
    activeTab = tab;
    pageIdx = 0;
    tabs.forEach(t => {
      const isActive = t.dataset.tab === tab;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive);
    });
    buildDots();
    goTo(0);
  }

  function openModal(tab) {
    updateTabCounts();
    switchTab(tab);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.menu-cat-card').forEach(card => {
    const handler = () => openModal(card.dataset.menu || 'food');
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
  });

  closeBtn.addEventListener('click', closeModal);
  bg.addEventListener('click', closeModal);
  tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  prevBtn.addEventListener('click', () => goTo(pageIdx - 1));
  nextBtn.addEventListener('click', () => goTo(pageIdx + 1));

  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape')     closeModal();
    if (e.key === 'ArrowLeft')  goTo(pageIdx - 1);
    if (e.key === 'ArrowRight') goTo(pageIdx + 1);
  });

  let touchX = 0;
  modal.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  modal.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) goTo(pageIdx + (dx < 0 ? 1 : -1));
  });

  // Recompute on window resize (mobile ↔ desktop)
  window.addEventListener('resize', () => { updateTabCounts(); buildDots(); goTo(pageIdx); }, { passive: true });

  // Preload first spread/page of each tab
  Object.values(MENUS).forEach(m => {
    const first = isMobile() ? m.pages[0] : m.spreads[0][0];
    new Image().src = first;
  });
})();

// ── MOBILE HAMBURGER NAV ──
(function() {
  const btn  = document.getElementById('navHamburger');
  const menu = document.getElementById('navMobileMenu');
  if (!btn || !menu) return;

  function openMenu() {
    btn.classList.add('open');
    menu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    btn.classList.remove('open');
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    btn.classList.contains('open') ? closeMenu() : openMenu();
  });

  menu.querySelectorAll('a').forEach(a => { a.addEventListener('click', closeMenu); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
})();

// ── FAQ ACCORDION ──
(function() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;
  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      items.forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-answer').style.maxHeight = null;
      });
      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
})();
