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
    var total = RECOMMENDATIONS.length;  // any count works: 1–10+
    var html = RECOMMENDATIONS.map(function (d, i) {
      // Chip text comes from d.badge (default "Bestseller") so one card can be relabelled.
      var badge = d.badge || 'Bestseller';
      var chip = '<span class="tbl-rec-chip">' + esc(badge) + '</span>';
      var num = '<span class="tbl-rec-num" aria-label="' + (i + 1) + ' of ' + total + '">' + (i + 1) + '/' + total + '</span>';
      var loading = i === 0 ? '' : ' loading="lazy"';
      return (
        '<li class="tbl-rec">' +
          '<div class="tbl-rec-media">' + chip + num +
            '<img src="' + esc(d.img) + '" alt="' + esc(d.name) + '" width="' + d.w + '" height="' + d.h + '"' + loading + ' decoding="async">' +
          '</div>' +
          '<div class="tbl-rec-body">' +
            '<p class="tbl-rec-name">' + esc(d.name) + '</p>' +
          '</div>' +
        '</li>'
      );
    }).join('');
    recs.innerHTML = html;
    var words = ['', 'One dish', 'Two dishes', 'Three dishes', 'Four dishes', 'Five dishes',
                 'Six dishes', 'Seven dishes', 'Eight dishes', 'Nine dishes', 'Ten dishes'];
    var sub = document.getElementById('tbl-recs-sub');
    if (sub) sub.textContent = (words[total] || total + ' dishes') + ' we love right now';
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
     Sends to a Google Form (responses land in its linked Google Sheet).

     ALL questions live in the FEEDBACK config below — this is the ONE place
     to rename, remove, add or reorder a question. The page renders itself
     from it; the HTML holds only an empty #fb-questions container.
     How to change questions + get a new entry id: _data/feedback/README.md

     Each question: { key, type, label, entry } plus per-type extras.
       type 'scale'  — 1–10 meter; optional min/max to change the range.
       type 'text'   — multi-line textarea.
       type 'phone'  — optional +91 10-digit number.
       type 'choice' — single-select pills; needs `options:[...]`; the chosen
                       option TEXT is what gets sent.
       optional `hint` — muted text after the label (e.g. "(optional)").
     While `action` is empty the page stays a demo: nothing is sent.
     ======================================================================== */
  var FEEDBACK = {
    // Google Form "Cafe OneTen — Table feedback" (owner: site maintainer)
    action: 'https://docs.google.com/forms/d/e/1FAIpQLSekyPiCMtivYumPZJS0tZwzvsFy4HTS6MTR2UtzETsAiCmCkA/formResponse',
    questions: [
      { key: 'food',     type: 'scale', label: 'Food',             entry: 'entry.1008664597' },
      { key: 'coffee',   type: 'scale', label: 'Coffee & drinks',  entry: 'entry.1208918330' },
      { key: 'service',  type: 'scale', label: 'Service',          entry: 'entry.1875437087' },
      { key: 'ambience', type: 'scale', label: 'Ambience',         entry: 'entry.253389735'  },
      { key: 'value',    type: 'scale', label: 'Value for money',  entry: 'entry.1365202985' },
      { key: 'comment',  type: 'text',  label: "Anything else you'd like to share?", hint: '(optional)', entry: 'entry.538326988' },
      { key: 'phone',    type: 'phone', label: 'Your contact number', hint: '(optional)', entry: 'entry.994954458' }
    ]
  };

  function sendFeedback(data) {
    if (!FEEDBACK.action) return;
    var body = new URLSearchParams();
    FEEDBACK.questions.forEach(function (q) {
      var v = data[q.key];
      if (v !== undefined && v !== null && v !== '') body.append(q.entry, String(v));
    });
    // Google Forms sends no CORS headers, so the response is opaque: fire and forget.
    try {
      fetch(FEEDBACK.action, { method: 'POST', mode: 'no-cors', body: body, keepalive: true })
        .catch(function () {});
    } catch (err) { /* very old browser: drop silently */ }
  }

  var fbForm = document.getElementById('fb-form');
  var container = document.getElementById('fb-questions');
  if (!fbForm || !container) return;

  /* ---- render the question list from config (same markup as before) ---- */
  function scaleMin(q) { return q.min || 1; }
  function scaleMax(q) { return q.max || 10; }
  function hintHtml(q) { return q.hint ? ' <span class="fb-opt">' + esc(q.hint) + '</span>' : ''; }

  function questionHtml(q) {
    var k = esc(q.key);
    if (q.type === 'scale') {
      var min = scaleMin(q), max = scaleMax(q), segs = '';
      for (var v = min; v <= max; v++) {
        segs += '<button type="button" class="fb-seg" role="radio" aria-checked="false" aria-label="' + v +
                '" tabindex="' + (v === min ? '0' : '-1') + '">' + v + '</button>';
      }
      return '<li class="fb-card" data-qkey="' + k + '">' +
          '<div class="fb-card-head">' +
            '<p class="fb-card-q" id="fb-label-' + k + '">' + esc(q.label) + '</p>' +
            '<span class="fb-score" aria-live="polite">&ndash;</span>' +
          '</div>' +
          '<div class="fb-meter" role="radiogroup" aria-labelledby="fb-label-' + k + '" data-q="' + k + '">' + segs + '</div>' +
          '<div class="fb-scale-ends" aria-hidden="true"><span>Lowest</span><span>Highest</span></div>' +
        '</li>';
    }
    if (q.type === 'text') {
      return '<li class="fb-card fb-field" data-qkey="' + k + '">' +
          '<label for="fb-' + k + '">' + esc(q.label) + hintHtml(q) + '</label>' +
          '<textarea id="fb-' + k + '" rows="4" maxlength="1000" placeholder="Type here…"></textarea>' +
        '</li>';
    }
    if (q.type === 'phone') {
      return '<li class="fb-card fb-field" data-qkey="' + k + '">' +
          '<label for="fb-' + k + '">' + esc(q.label) + hintHtml(q) + '</label>' +
          '<div class="fb-phone-row"><span class="fb-phone-prefix">+91</span>' +
            '<input id="fb-' + k + '" type="tel" inputmode="numeric" autocomplete="tel-national" pattern="\\d{10}" maxlength="10" placeholder="10-digit number" /></div>' +
          '<p class="fb-error" id="fb-error-' + k + '" role="alert"></p>' +
        '</li>';
    }
    if (q.type === 'choice') {
      var pills = (q.options || []).map(function (opt, i) {
        return '<button type="button" class="fb-pill" role="radio" aria-checked="false" tabindex="' +
          (i === 0 ? '0' : '-1') + '" data-val="' + esc(opt) + '">' + esc(opt) + '</button>';
      }).join('');
      return '<li class="fb-card fb-field" data-qkey="' + k + '">' +
          '<label id="fb-label-' + k + '">' + esc(q.label) + hintHtml(q) + '</label>' +
          '<div class="fb-choice" role="radiogroup" aria-labelledby="fb-label-' + k + '" data-q="' + k + '">' + pills + '</div>' +
        '</li>';
    }
    return '';
  }

  container.innerHTML = FEEDBACK.questions.map(questionHtml).join('');

  var scaleQs = FEEDBACK.questions.filter(function (q) { return q.type === 'scale'; });
  var phoneQs = FEEDBACK.questions.filter(function (q) { return q.type === 'phone'; });
  var scores = {};
  var countEl = document.getElementById('fb-count');
  var submitBtn = document.getElementById('fb-submit');

  /* Red (min) -> amber -> green (max) across the scale's range */
  function ramp(n, min, max) {
    var span = (max - min) || 1;
    return 'hsl(' + Math.round(((n - min) / span) * 120) + ' 62% 48%)';
  }

  function setScore(meter, q, n) {
    var min = scaleMin(q), max = scaleMax(q);
    scores[q.key] = n;
    meter.querySelectorAll('.fb-seg').forEach(function (seg, idx) {
      var val = min + idx;
      var on = val <= n;
      seg.setAttribute('data-on', on ? 'true' : 'false');
      seg.setAttribute('aria-checked', val === n ? 'true' : 'false');
      seg.tabIndex = val === n ? 0 : -1;
      seg.style.backgroundColor = on ? ramp(val, min, max) : 'transparent';
    });
    var big = meter.closest('.fb-card').querySelector('.fb-score');
    if (big) { big.textContent = n; big.style.color = ramp(n, min, max); }
    refresh();
  }

  scaleQs.forEach(function (q) {
    var meter = container.querySelector('.fb-meter[data-q="' + q.key + '"]');
    if (!meter) return;
    var min = scaleMin(q), max = scaleMax(q);
    var segs = Array.prototype.slice.call(meter.querySelectorAll('.fb-seg'));
    segs.forEach(function (seg, idx) {
      var val = min + idx;
      seg.addEventListener('click', function () { setScore(meter, q, val); });
      seg.addEventListener('keydown', function (e) {
        var cur = scores[q.key] || 0;
        var to = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') to = Math.min(max, (cur || (min - 1)) + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') to = Math.max(min, (cur || min) - 1);
        else if (e.key === 'Home') to = min;
        else if (e.key === 'End') to = max;
        if (!to) return;
        e.preventDefault();
        setScore(meter, q, to);
        segs[to - min].focus();
      });
    });
  });

  /* ---- single-select choice pills (same radiogroup semantics) ---- */
  function selectPill(pills, idx) {
    pills.forEach(function (p, i) {
      var on = i === idx;
      p.setAttribute('aria-checked', on ? 'true' : 'false');
      p.tabIndex = on ? 0 : -1;
    });
    refresh();
  }
  container.querySelectorAll('.fb-choice').forEach(function (grp) {
    var pills = Array.prototype.slice.call(grp.querySelectorAll('.fb-pill'));
    pills.forEach(function (pill, idx) {
      pill.addEventListener('click', function () { selectPill(pills, idx); });
      pill.addEventListener('keydown', function (e) {
        var cur = -1;
        pills.forEach(function (p, i) { if (p.getAttribute('aria-checked') === 'true') cur = i; });
        var to = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = cur < 0 ? 0 : Math.min(pills.length - 1, cur + 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = cur < 0 ? 0 : Math.max(0, cur - 1);
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = pills.length - 1;
        if (to < 0) return;
        e.preventDefault();
        selectPill(pills, to);
        pills[to].focus();
      });
    });
  });

  /* ---- current value of any question (empty string = unanswered) ---- */
  function getAnswer(q) {
    if (q.type === 'scale') return scores[q.key] || '';
    if (q.type === 'text') { var t = document.getElementById('fb-' + q.key); return t ? t.value.trim() : ''; }
    if (q.type === 'phone') { var p = document.getElementById('fb-' + q.key); return p ? p.value : ''; }
    if (q.type === 'choice') {
      var sel = container.querySelector('.fb-choice[data-q="' + q.key + '"] [aria-checked="true"]');
      return sel ? (sel.getAttribute('data-val') || '') : '';
    }
    return '';
  }

  function answeredScale() {
    return scaleQs.filter(function (q) { return scores[q.key] > 0; }).length;
  }
  function hasAnyAnswer() {
    return FEEDBACK.questions.some(function (q) { return getAnswer(q) !== ''; });
  }
  function refresh() {
    if (countEl) countEl.textContent = answeredScale() + ' of ' + scaleQs.length + ' rated';
    if (submitBtn) submitBtn.disabled = !hasAnyAnswer();  // enabled once any one answer exists
  }
  refresh();

  var validPhone = function (v) { return v === '' || /^\d{10}$/.test(v); };
  phoneQs.forEach(function (q) {
    var input = document.getElementById('fb-' + q.key);
    var errorEl = document.getElementById('fb-error-' + q.key);
    if (!input) return;
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 10);
      if (errorEl) errorEl.textContent = '';
    });
  });

  fbForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!hasAnyAnswer()) return;

    var invalidPhone = false;
    phoneQs.forEach(function (q) {
      var input = document.getElementById('fb-' + q.key);
      var errorEl = document.getElementById('fb-error-' + q.key);
      if (input && !validPhone(input.value)) {
        if (errorEl) errorEl.textContent = 'Please enter a 10-digit mobile number, or leave it empty.';
        invalidPhone = true;
      }
    });
    if (invalidPhone) return;

    // Honeypot: real guests never see or fill #fb-website; bots usually do.
    var trap = document.getElementById('fb-website');
    if (!(trap && trap.value)) {
      var data = {};
      FEEDBACK.questions.forEach(function (q) { data[q.key] = getAnswer(q); });
      sendFeedback(data);
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
