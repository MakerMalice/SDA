/* SDA Laundry Tech — main.js
   Mobile nav, scroll reveal, gallery lightbox, missing-photo fallback,
   AJAX quote form with no-JS fallback. No dependencies. */
(function () {
  'use strict';

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  function closeNav() {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !e.target.closest('.site-header')) {
        closeNav();
      }
    });
  }

  /* ---------- Scroll reveal (skipped for reduced motion) ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');

  if (!reduceMotion && 'IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Gallery: missing-photo placeholder ---------- */
  var CAMERA_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>' +
    '<circle cx="12" cy="13" r="4"/></svg>';

  function makePlaceholder(item) {
    item.classList.add('is-placeholder');
    item.disabled = true;
    item.removeAttribute('aria-label');
    item.innerHTML = CAMERA_SVG + '<span>Photo coming soon</span>';
  }

  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));

  galleryItems.forEach(function (item) {
    var img = item.querySelector('img');
    if (!img) return;
    if (img.complete && img.naturalWidth === 0) {
      makePlaceholder(item);
    } else {
      img.addEventListener('error', function () { makePlaceholder(item); });
    }
  });

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');

  if (lightbox) {
    var lbImg = lightbox.querySelector('.lightbox-img');
    var lbCaption = lightbox.querySelector('.lightbox-caption');
    var lbClose = lightbox.querySelector('.lightbox-close');
    var lbPrev = lightbox.querySelector('.lightbox-prev');
    var lbNext = lightbox.querySelector('.lightbox-next');
    var current = 0;
    var lastFocus = null;

    function liveItems() {
      return galleryItems.filter(function (item) {
        return !item.classList.contains('is-placeholder');
      });
    }

    function show(index) {
      var items = liveItems();
      if (!items.length) return;
      current = (index + items.length) % items.length;
      var img = items[current].querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCaption.textContent = img.alt;
    }

    function openLightbox(index) {
      lastFocus = document.activeElement;
      show(index);
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    galleryItems.forEach(function (item) {
      item.addEventListener('click', function () {
        if (item.classList.contains('is-placeholder')) return;
        openLightbox(liveItems().indexOf(item));
      });
    });

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', function () { show(current - 1); });
    lbNext.addEventListener('click', function () { show(current + 1); });
    lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);

    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
      if (e.key === 'Tab') {
        // Keep focus inside the dialog
        var focusables = [lbClose, lbPrev, lbNext];
        var i = focusables.indexOf(document.activeElement);
        if (e.shiftKey && (i === 0 || i === -1)) {
          e.preventDefault();
          focusables[focusables.length - 1].focus();
        } else if (!e.shiftKey && i === focusables.length - 1) {
          e.preventDefault();
          focusables[0].focus();
        }
      }
    });
  }

  /* ---------- Quote form (fetch with no-JS fallback) ---------- */
  var form = document.getElementById('quote-form');

  if (form && window.fetch) {
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      status.className = 'form-status';
      status.textContent = 'Sending…';
      submitBtn.disabled = true;

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status.className = 'form-status is-success';
            status.textContent =
              'Got it — your request is in. We respond within 24 hours.';
          } else {
            throw new Error('Form endpoint returned ' + res.status);
          }
        })
        .catch(function () {
          status.className = 'form-status is-error';
          status.textContent =
            'Something went wrong sending the form. Call us at 609-468-2076 or email sdalaundry@gmail.com.';
        })
        .then(function () {
          submitBtn.disabled = false;
        });
    });
  }
})();
