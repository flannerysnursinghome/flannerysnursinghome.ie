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
        var lines = readForm(form);
        var address = form.getAttribute('data-email') || 'info@flannerysnursinghome.ie';
        var link = 'mailto:' + address +
          '?subject=' + encodeURIComponent(SUBJECT[kind] || SUBJECT.visit) +
          '&body=' + encodeURIComponent(lines.join('\n'));

        window.location.href = link;

        status(form,
          '<strong>Your email app should be open now.</strong>' +
          'Press send there and it reaches us. If nothing opened, ' +
          'ring <a href="tel:+3539343130">093 431 30</a> instead, or write to us at Chapel Road, Abbeyknockmoy.');
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

  /* ---------- reveal sections as they come into view ---------- */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var targets = document.querySelectorAll('main > section, .duo, .shots, .mosaic-top, .roles');
    if (!targets.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  })();
})();
