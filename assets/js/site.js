/* Flannery's Nursing Home — small site script.
   Two jobs only: the mobile menu, and turning the forms into an email
   the visitor sends from their own account. No tracking, no cookies. */
(function () {
  'use strict';

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav-main');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- forms ---------- */
  var LABELS = {
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    want: 'Enquiry about',
    who: 'Enquiry for',
    when: 'When suits',
    message: 'Message',
    reply: 'Preferred reply',
    contact: 'Contact',
    resident: 'Resident',
    relationship: 'Relationship',
    type: 'This is a',
    what: 'What happened',
    outcome: 'What they would like to see happen',
    consent: 'Consent to be contacted',
    'consent-resident': "Resident's consent"
  };

  var SUBJECT = {
    visit: "Website enquiry - Flannery's Nursing Home",
    complaint: "Complaint or feedback - Flannery's Nursing Home"
  };

  function readForm(form) {
    var lines = [];
    var inputs = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (!el.name || el.type === 'submit' || el.type === 'button') continue;
      if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
      var value = (el.value || '').trim();
      if (el.type === 'checkbox') value = 'yes';
      if (!value) continue;
      var label = LABELS[el.name] || el.name;
      if (el.type === 'radio') label = LABELS[el.name] || el.name;
      lines.push(label + ': ' + value);
    }
    return lines;
  }

  function status(form, message) {
    var box = form.querySelector('.form-status');
    if (!box) return;
    box.innerHTML = message;
    box.classList.add('show');
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  var forms = document.querySelectorAll('form.enquiry');
  for (var f = 0; f < forms.length; f++) {
    (function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var required = form.querySelectorAll('[required]');
        for (var r = 0; r < required.length; r++) {
          var el = required[r];
          var filled = (el.type === 'checkbox') ? el.checked : (el.value || '').trim() !== '';
          if (!filled) {
            el.focus();
            var short = LABELS[el.name] ||
              (el.labels && el.labels[0] ? el.labels[0].textContent.replace(/\s+/g, ' ').trim() : 'A field');
            status(form, '<strong>One thing missing</strong>Please fill in: ' + short + '.');
            return;
          }
        }

        var kind = form.getAttribute('data-form') || 'visit';
        var address = form.getAttribute('data-email') || 'info@flannerysnursinghome.ie';
        var subject = SUBJECT[kind] || SUBJECT.visit;
        var endpoint = form.getAttribute('data-endpoint') || '';

        var fallback = function (note) {
          var lines = readForm(form);
          window.location.href = 'mailto:' + address +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(lines.join('\n'));
          status(form, note +
            ' Your email app should be open now; press send there. If nothing opened, ' +
            'ring <a href="tel:+3539343130">093 431 30</a> instead, or write to us at Chapel Road, Abbeyknockmoy.');
        };

        /* Nothing configured yet: the visitor's own mail app is the honest route. */
        if (!endpoint) {
          fallback('<strong>Your email app should be open now.</strong>');
          return;
        }

        var payload = { _subject: subject, _page: window.location.pathname };
        Array.prototype.forEach.call(form.elements, function (el) {
          if (!el.name || el.name.charAt(0) === '_') return;
          payload[el.name] = (el.type === 'checkbox') ? (el.checked ? 'yes' : 'no') : el.value;
        });

        var button = form.querySelector('[type="submit"]');
        var label = button ? button.textContent : '';
        if (button) { button.disabled = true; button.textContent = 'Sending…'; }

        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            form.reset();
            status(form, '<strong>Thank you — that has reached us.</strong> ' +
              'We will come back to you, usually the same day. If it is urgent, ring ' +
              '<a href="tel:+3539343130">093 431 30</a>.');
          })
          .catch(function () {
            fallback('<strong>We could not send that directly.</strong>');
          })
          .then(function () {
            if (button) { button.disabled = false; button.textContent = label; }
          });
      });
    })(forms[f]);
  }

  /* ---------- hero video: respect motion and data preferences ---------- */
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conn = navigator.connection || navigator.mozConnection || null;
    var slow = conn && /(^|-)2g$/.test(conn.effectiveType || '');
    if (reduce || slow) {
      heroVideo.removeAttribute('autoplay');
      try { heroVideo.pause(); } catch (e) {}
    }
  }

  /* ---------- motion on scroll ---------- */
  (function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* the header tightens once you leave the top */
    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 60);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (reduce || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    /* sections */
    Array.prototype.forEach.call(
      document.querySelectorAll('main > section, .duo, .mosaic-top'),
      function (el) { el.classList.add('reveal'); io.observe(el); }
    );

    /* groups whose items arrive one after another */
    var groups = document.querySelectorAll('.care-list, .shots, .roles, .cats, .steps, .note-list');
    Array.prototype.forEach.call(groups, function (group) {
      Array.prototype.forEach.call(group.children, function (item, index) {
        item.classList.add('reveal-child');
        item.style.transitionDelay = Math.min(index * 70, 420) + 'ms';
        io.observe(item);
      });
    });

    /* photographs settle into place */
    Array.prototype.forEach.call(
      document.querySelectorAll('figure:not(.hero-figure)'),
      function (fig) {
        if (!fig.querySelector('img')) return;
        fig.classList.add('reveal-img');
        if (!fig.classList.contains('reveal-child')) io.observe(fig);
      }
    );

    /* the hero introduces itself, once */
    var hero = document.querySelector('.hero');
    if (hero) {
      Array.prototype.forEach.call(hero.children.length ? hero.querySelectorAll('h1, .lede, p, .actions, figure, .hero-stats') : [], function (el, index) {
        el.classList.add('hero-in');
        el.style.animationDelay = Math.min(index * 110, 550) + 'ms';
      });
    }
  })();
})();
