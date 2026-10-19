/* Heal Yourself with EFT: sales page behaviour (index.html only).
   Every gtag call is guarded, so blocked or failed tags never break the page. */
(function () {
  'use strict';

  function track(name, params) {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (e) {}
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- cta_click on every buy button, map_click on Map links ---------- */
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var a = e.target.closest('[data-cta]');
    if (a) {
      var params = { cta_location: a.getAttribute('data-cta') };
      var plan = a.getAttribute('data-plan');
      if (plan) params.plan = plan;
      track('cta_click', params);
      return;
    }
    var m = e.target.closest('[data-map]');
    if (m) track('map_click', { location: m.getAttribute('data-map') });
  });

  /* ---------- scroll_depth at 25 / 50 / 75 / 100 ---------- */
  (function () {
    var marks = [25, 50, 75, 100];
    var sent = {};
    var ticking = false;
    function check() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 100;
      for (var i = 0; i < marks.length; i++) {
        var m = marks[i];
        if (!sent[m] && pct >= m - 0.5) {
          sent[m] = true;
          track('scroll_depth', { percent_scrolled: m });
        }
      }
      if (sent[100]) window.removeEventListener('scroll', onScroll);
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(check); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ---------- Mobile sticky buy bar ----------
     Hidden while the hero buy button or the pricing section is on screen. */
  (function () {
    var bar = document.getElementById('buybar');
    var targets = [document.getElementById('hero-cta'), document.getElementById('pricing')];
    if (!bar || !('IntersectionObserver' in window)) {
      if (bar) bar.classList.remove('is-hidden');
      return;
    }
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target);
      });
      bar.classList.toggle('is-hidden', visible.size > 0);
    });
    targets.forEach(function (t) { if (t) io.observe(t); });
  })();

  /* ---------- Try it first: lite YouTube embeds ----------
     Only a thumbnail until clicked. The featured slot plays in place; a side video
     swaps into the featured player (and trades places with what was there). */
  (function () {
    var player = document.getElementById('player');
    if (!player) return;
    var titleEl = document.getElementById('player-title');
    var proofEl = document.getElementById('player-proof');
    var featured = player.querySelector('.yt--featured');
    var mobile = window.matchMedia('(max-width: 767px)');

    function read(el) {
      return {
        id: el.getAttribute('data-id'),
        slot: el.getAttribute('data-slot'),
        title: el.getAttribute('data-title'),
        proof: el.getAttribute('data-proof'),
        len: el.getAttribute('data-len')
      };
    }
    function write(el, v) {
      el.setAttribute('data-id', v.id);
      el.setAttribute('data-slot', v.slot);
      el.setAttribute('data-title', v.title);
      el.setAttribute('data-proof', v.proof);
      el.setAttribute('data-len', v.len);
    }

    var current = read(featured);

    function play(v) {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) +
        '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      iframe.title = v.title;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      player.innerHTML = '';
      player.appendChild(iframe);
      titleEl.textContent = v.title;
      proofEl.textContent = v.proof;
      current = v;
      track('video_play', { video_id: v.id, video_slot: v.slot });
    }

    featured.addEventListener('click', function () { play(current); });

    Array.prototype.forEach.call(document.querySelectorAll('.yt--side'), function (btn) {
      btn.addEventListener('click', function () {
        var next = read(btn);
        var prev = current;
        // The side button now offers whatever was featured before.
        write(btn, prev);
        btn.querySelector('img').src = 'https://i.ytimg.com/vi/' + prev.id + '/hqdefault.jpg';
        btn.querySelector('.yt__title').lastChild.nodeValue = prev.title; // keeps the hidden "Play: " prefix
        btn.querySelector('.yt__proof').textContent = prev.proof;
        btn.querySelector('.yt__len').textContent = prev.len;
        play(next);
        if (mobile.matches) player.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      });
    });
  })();

  /* ---------- Research counters: count up once when scrolled into view ----------
     The real numbers are in the HTML, so nothing changes without JS or with reduced motion. */
  (function () {
    var nums = document.querySelectorAll('.stats [data-count]');
    if (!nums.length || reduceMotion || !('IntersectionObserver' in window)) return;
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var start = null;
      var dur = 1200;
      function step(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { io.unobserve(en.target); run(en.target); }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(nums, function (n) { io.observe(n); });
  })();
})();
