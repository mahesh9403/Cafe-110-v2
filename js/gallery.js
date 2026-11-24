/* Gallery page: category filter + native <dialog> lightbox. */
(function () {
  'use strict';
  var grid = document.getElementById('galleryGrid');
  var dlg = document.getElementById('galleryLightbox');
  if (!grid || !dlg || typeof dlg.showModal !== 'function') return;

  var items = Array.prototype.slice.call(grid.querySelectorAll('.gallery-item'));
  var filterBar = document.querySelector('.gallery-filters');
  var buttons = filterBar ? Array.prototype.slice.call(filterBar.querySelectorAll('.gallery-filter')) : [];
  var img = dlg.querySelector('.gallery-lb-img');
  var cap = dlg.querySelector('.gallery-lb-cap');
  var current = -1, opener = null;

  if (filterBar) filterBar.hidden = false;

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      items.forEach(function (it) {
        it.hidden = !(f === 'all' || it.getAttribute('data-cat') === f);
      });
    });
  });

  function visible() { return items.filter(function (it) { return !it.hidden; }); }

  function show(list, i) {
    current = (i + list.length) % list.length;
    var a = list[current].querySelector('.gallery-link');
    var thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.width = thumb.width; img.height = thumb.height;
    img.alt = thumb.alt;
    cap.textContent = a.getAttribute('data-caption') || '';
    dlg._item = list[current];
  }

  function step(d) {
    var list = visible();
    var i = list.indexOf(dlg._item);
    show(list, (i < 0 ? 0 : i) + d);
  }

  grid.addEventListener('click', function (e) {
    var a = e.target.closest('.gallery-link');
    if (!a) return;
    e.preventDefault();
    opener = a;
    var list = visible();
    show(list, list.indexOf(a.parentNode));
    dlg.showModal();
    dlg.querySelector('.gallery-lb-close').focus();
  });

  dlg.querySelector('.gallery-lb-prev').addEventListener('click', function () { step(-1); });
  dlg.querySelector('.gallery-lb-next').addEventListener('click', function () { step(1); });
  dlg.querySelector('.gallery-lb-close').addEventListener('click', function () { dlg.close(); });

  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  /* Backdrop click: the dialog element itself (or the empty flex area) is the target. */
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });

  dlg.addEventListener('close', function () {
    img.removeAttribute('src');
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  });

  /* Swipe */
  var x0 = null, y0 = null;
  dlg.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0]; x0 = t.clientX; y0 = t.clientY;
  }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
