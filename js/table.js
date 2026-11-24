/* ============================================================================
   Cafe OneTen — "At your table" behaviour (vanilla JS, no dependencies).
   Loaded on /table/ and /table/feedback/. Progressive enhancement only:
   every page renders and works without this file.
   ============================================================================ */
'use strict';

/* Owner's picks — swap these five lines to change the recommendations.
   Descriptions come from _data/menu/menu-data.json. No prices.
   `badge` is the chip text (default "Bestseller"); switch one item to
   "Chef's pick" here to relabel just that card. */
var RECOMMENDATIONS = [
  {
    slug: 'belgian-slice',
    name: 'Belgian Slice',
    desc: 'Moist chocolate cake layers with creamy chocolate mousse and a hot chocolate ganache drizzle.',
    img: '/img/dishes/belgian-slice-cafe-oneten.webp?v=2611',
    w: 720, h: 1280, badge: 'Bestseller'
  },
  {
    slug: 'peri-peri-paneer-rice-bowl',
    name: 'Peri Peri Paneer Rice Bowl',
    desc: 'Fragrant brown rice with grated coconut and spicy bean gravy, topped with veg stir fry and peri peri paneer.',
    img: '/img/dishes/peri-peri-paneer-rice-bowl-cafe-oneten.webp?v=2611',
    w: 720, h: 1280, badge: 'Bestseller'
  },
  {
    slug: 'deconstructed-tiramisu',
    name: 'Deconstructed Tiramisu',
    desc: 'Savoiardi biscuits soaked in espresso with dollops of whipped mascarpone, dusted with cocoa.',
    img: '/img/dishes/deconstructed-tiramisu-cafe-oneten.webp?v=2611',
    w: 1084, h: 1600, badge: 'Bestseller'
  },
  {
    slug: 'french-toast',
    name: 'French Toast',
    desc: 'Buttery brioche soaked in a vanilla-cinnamon egg custard, grilled golden, with whipped cream cheese and maple syrup.',
    img: '/img/dishes/french-toast-cafe-oneten.webp?v=2611',
    w: 608, h: 1080, badge: 'Bestseller'
  },
  {
    slug: 'assorted-bread-basket',
    name: 'Assorted Bread Basket',
    desc: 'An assortment of breads with lemon mustard butter, buldak butter, charred corn dip and spinach artichoke dip.',
    img: '/img/dishes/assorted-bread-basket-cafe-oneten.webp?v=2611',
    w: 1280, h: 720, badge: 'Bestseller'
  }
];

(function () {
  /* ---- helpers ---- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---- time-of-day greeting ---- */
  function timeOfDay(hour) {
    if (hour >= 6 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  }
  var greet = document.getElementById('tbl-greeting');
  if (greet) greet.textContent = timeOfDay(new Date().getHours());

  /* ---- recommendations carousel ---- */
  var recs = document.getElementById('tbl-recs');
  if (recs) {
    var html = RECOMMENDATIONS.map(function (d, i) {
      // Chip text comes from d.badge (default "Bestseller") so one card can be relabelled.
      var badge = d.badge || 'Bestseller';
      var chip = '<span class="tbl-rec-chip">' + esc(badge) + '</span>';
      var loading = i === 0 ? '' : ' loading="lazy"';
      return (
        '<li class="tbl-rec">' +
          '<div class="tbl-rec-media">' + chip +
            '<img src="' + esc(d.img) + '" alt="' + esc(d.name) + '" width="' + d.w + '" height="' + d.h + '"' + loading + ' decoding="async">' +
          '</div>' +
          '<div class="tbl-rec-body">' +
            '<p class="tbl-rec-name">' + esc(d.name) + '</p>' +
          '</div>' +
        '</li>'
      );
    }).join('');
    recs.innerHTML = html;
  }

  /* ---- Wi-Fi sheet ---- */
  var sheet = document.getElementById('wifi-sheet');
  var openBtn = document.getElementById('wifi-open');
  if (sheet && openBtn && typeof sheet.showModal === 'function') {
    openBtn.addEventListener('click', function () {
      sheet.showModal();
      var close = sheet.querySelector('.tbl-sheet-close');
      if (close) close.focus();
    });
    // Close on backdrop click (click lands on the <dialog> itself, not inner).
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet) sheet.close();
    });
    sheet.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { sheet.close(); });
    });
    // Esc is handled natively by <dialog>.

    // Copy buttons
    sheet.querySelectorAll('.tbl-copybtn').forEach(function (btn) {
      var timer;
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-copy') || '';
        copyText(value);
        var label = btn.querySelector('.cf-btn-label');
        btn.setAttribute('data-done', 'true');
        if (label) label.textContent = 'Copied';
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.removeAttribute('data-done');
          if (label) label.textContent = 'Copy';
        }, 1800);
      });
    });
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).catch(function () { legacyCopy(value); });
    } else {
      legacyCopy(value);
    }
  }
  function legacyCopy(value) {
    var ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* no-op */ }
    ta.remove();
  }

  /* ========================================================================
     FEEDBACK PAGE
     DEMO: nothing stored — backend TBD. No network calls, no storage.
     ======================================================================== */
  var fbForm = document.getElementById('fb-form');
  if (!fbForm) return;

  var meters = Array.prototype.slice.call(document.querySelectorAll('.fb-meter'));
  var scores = {};
  var countEl = document.getElementById('fb-count');
  var submitBtn = document.getElementById('fb-submit');
  var phoneInput = document.getElementById('fb-phone');
  var errorEl = document.getElementById('fb-error');

  /* Red (1) -> amber -> green (10) */
  function ramp(n) { return 'hsl(' + Math.round(((n - 1) / 9) * 120) + ' 62% 48%)'; }

  function setScore(meter, n) {
    scores[meter.dataset.q] = n;
    var segs = meter.querySelectorAll('.fb-seg');
    segs.forEach(function (seg, idx) {
      var val = idx + 1;
      var on = val <= n;
      seg.setAttribute('data-on', on ? 'true' : 'false');
      seg.setAttribute('aria-checked', val === n ? 'true' : 'false');
      seg.tabIndex = val === n ? 0 : -1;
      seg.style.backgroundColor = on ? ramp(val) : 'transparent';
    });
    var big = meter.closest('.fb-card').querySelector('.fb-score');
    if (big) { big.textContent = n; big.style.color = ramp(n); }
    refresh();
  }

  meters.forEach(function (meter) {
    var segs = Array.prototype.slice.call(meter.querySelectorAll('.fb-seg'));
    segs.forEach(function (seg, idx) {
      var val = idx + 1;
      seg.addEventListener('click', function () { setScore(meter, val); });
      seg.addEventListener('keydown', function (e) {
        var cur = scores[meter.dataset.q] || 0;
        var to = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') to = Math.min(10, (cur || 0) + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') to = Math.max(1, (cur || 1) - 1);
        else if (e.key === 'Home') to = 1;
        else if (e.key === 'End') to = 10;
        if (!to) return;
        e.preventDefault();
        setScore(meter, to);
        segs[to - 1].focus();
      });
    });
  });

  function answeredCount() {
    return Object.keys(scores).filter(function (k) { return scores[k] > 0; }).length;
  }
  function refresh() {
    var n = answeredCount();
    if (countEl) countEl.textContent = n + ' of ' + meters.length + ' rated';
    if (submitBtn) submitBtn.disabled = n < 1;  // enabled once at least one meter is set
  }
  refresh();

  var validPhone = function (v) { return v === '' || /^\d{10}$/.test(v); };
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
      if (errorEl) errorEl.textContent = '';
    });
  }

  fbForm.addEventListener('submit', function (e) {
    e.preventDefault();  // DEMO: never actually submit anywhere
    if (answeredCount() < 1) return;
    if (phoneInput && !validPhone(phoneInput.value)) {
      if (errorEl) errorEl.textContent = 'Please enter a 10-digit mobile number, or leave it empty.';
      return;
    }
    var main = document.getElementById('fb-main');
    var thanks = document.getElementById('fb-thanks');
    var bar = document.getElementById('fb-submitbar');
    if (main) main.hidden = true;
    if (bar) bar.hidden = true;
    if (thanks) {
      thanks.hidden = false;
      var h = thanks.querySelector('h1');
      if (h) h.focus();
    }
    window.scrollTo({ top: 0 });
  });
})();
