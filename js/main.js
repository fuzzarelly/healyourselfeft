/* ================================================
   HEAL YOURSELF WITH EFT — Main JavaScript
   ================================================ */

// Sticky header on scroll
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  function tick() {
    header.classList.toggle('scrolled', window.scrollY > 80);
  }

  window.addEventListener('scroll', tick, { passive: true });
  tick();
}());

// Mobile hamburger menu
(function () {
  var btn = document.querySelector('.hamburger');
  var nav = document.querySelector('.header-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}());

// FAQ accordion
(function () {
  var items = document.querySelectorAll('.faq-item');

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // close all
      items.forEach(function (i) { i.classList.remove('open'); });

      // open clicked (unless it was already open)
      if (!isOpen) item.classList.add('open');
    });
  });
}());

// Scroll reveal via IntersectionObserver
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  if (!window.IntersectionObserver) {
    els.forEach(function (el) { el.classList.add('revealed'); });
    return;
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(function (el) { obs.observe(el); });
}());

// Waitlist form — validate and redirect to thank-you page
(function () {
  var forms = document.querySelectorAll('.waitlist-form');

  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nameEl  = form.querySelector('[name="name"]');
      var emailEl = form.querySelector('[name="email"]');
      var submitEl = form.querySelector('[type="submit"]');

      var name  = nameEl  ? nameEl.value.trim()  : '';
      var email = emailEl ? emailEl.value.trim() : '';

      // Simple email check
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        if (emailEl) {
          emailEl.style.borderColor = '#d96a44';
          emailEl.focus();
        }
        return;
      }

      if (submitEl) {
        submitEl.textContent = 'Joining Waitlist…';
        submitEl.disabled = true;
      }

      setTimeout(function () {
        window.location.href =
          'thankyou.html?name=' + encodeURIComponent(name) +
          '&email=' + encodeURIComponent(email);
      }, 700);
    });
  });
}());

// Personalise thank-you page with name from URL
(function () {
  var el = document.querySelector('.ty-name');
  if (!el) return;

  var params = new URLSearchParams(window.location.search);
  var name = params.get('name');
  if (name) el.textContent = ', ' + name;
}());

// ================================================
// QUIZ ENGINE
// ================================================
(function () {
  var wrap = document.querySelector('.quiz-wrap');
  if (!wrap) return;

  var steps    = Array.from(wrap.querySelectorAll('.quiz-step'));
  var result   = wrap.querySelector('.quiz-result');
  var fill     = wrap.querySelector('.quiz-progress-fill');
  var current  = 0;
  var total    = steps.length;
  var answers  = {};

  // Scoring keys per question (data-value on each option)
  // 0 = physical, 1 = emotional, 2 = both

  function updateFill(idx) {
    if (fill) fill.style.width = ((idx / total) * 100) + '%';
  }

  function showStep(idx) {
    steps.forEach(function (s, i) {
      s.classList.toggle('active', i === idx);
    });
    if (result) result.classList.remove('active');
    current = idx;
    updateFill(idx);
    window.scrollTo({ top: wrap.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  }

  // Option click
  wrap.querySelectorAll('.quiz-opt').forEach(function (opt) {
    opt.addEventListener('click', function () {
      var step = opt.closest('.quiz-step');
      step.querySelectorAll('.quiz-opt').forEach(function (o) {
        o.classList.remove('selected');
      });
      opt.classList.add('selected');
    });
  });

  // Next buttons
  wrap.querySelectorAll('.quiz-btn-next').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step   = steps[current];
      var chosen = step.querySelector('.quiz-opt.selected');
      var hint   = step.querySelector('.quiz-hint');

      if (!chosen) {
        if (hint) {
          hint.textContent = '⚠ Please select an answer to continue.';
          hint.style.color = '#d96a44';
        }
        return;
      }

      answers[current] = chosen.dataset.score || '0';

      if (current < total - 1) {
        showStep(current + 1);
      } else {
        showQuizResult();
      }
    });
  });

  // Back buttons
  wrap.querySelectorAll('.quiz-btn-back').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (current > 0) showStep(current - 1);
    });
  });

  function showQuizResult() {
    // Tally scores: 0=physical, 1=emotional, 2=both
    var counts = { '0': 0, '1': 0, '2': 0 };
    Object.values(answers).forEach(function (v) {
      if (counts[v] !== undefined) counts[v]++;
    });

    var type, emoji, typeLabel, title, body;

    if (counts['0'] >= counts['1'] && counts['0'] >= counts['2']) {
      type      = 'physical';
      emoji     = '💙';
      typeLabel = 'The Physical Healer';
      title     = 'Your Body Is Calling For Emotional Release';
      body      = 'Your symptoms have physical roots — but research shows that unprocessed emotions are often the hidden driver. EFT Tapping directly addresses this mind-body connection, and the Heal Yourself with EFT program is designed precisely for people like you.';
    } else if (counts['1'] >= counts['0'] && counts['1'] >= counts['2']) {
      type      = 'emotional';
      emoji     = '🌊';
      typeLabel = 'The Emotional Releaser';
      title     = 'You Are Ready to Break Free From Repeating Patterns';
      body      = 'You carry emotional weight that\'s shaped your life more than you\'d like. EFT Tapping is one of the most effective evidence-based tools for releasing the root memories behind anxiety, stress, grief, and old wounds. You are in the right place.';
    } else {
      type      = 'both';
      emoji     = '✨';
      typeLabel = 'The Whole-Body Healer';
      title     = 'Both Your Body & Mind Are Ready to Heal Together';
      body      = 'You experience the full spectrum — physical symptoms intertwined with emotional patterns. This is exactly what the Heal Yourself with EFT program addresses: a holistic, step-by-step journey to clear both the physical and emotional roots of your challenges.';
    }

    // Populate result
    var emojiEl    = result.querySelector('.quiz-result__emoji');
    var typeEl     = result.querySelector('.quiz-result__type');
    var titleEl    = result.querySelector('.quiz-result__title');
    var bodyEl     = result.querySelector('.quiz-result__body');

    if (emojiEl)  emojiEl.textContent  = emoji;
    if (typeEl)   typeEl.textContent   = typeLabel;
    if (titleEl)  titleEl.textContent  = title;
    if (bodyEl)   bodyEl.textContent   = body;

    // Hide steps, show result
    steps.forEach(function (s) { s.classList.remove('active'); });
    if (result) result.classList.add('active');
    if (fill)   fill.style.width = '100%';
    window.scrollTo({ top: wrap.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  }

  // Boot
  showStep(0);
}());
