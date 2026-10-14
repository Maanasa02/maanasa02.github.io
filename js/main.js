document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close the mobile menu after choosing a link (e.g. in-page #work / #about).
    links.addEventListener('click', (e) => {
      if (e.target.closest('a') && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Scroll-reveal. Fail-open: content must NEVER stay hidden if the
  // observer misbehaves (old browsers, timing, headless renderers, etc.).
  const revealEls = document.querySelectorAll('.cs-reveal');
  if (!revealEls.length) return;

  const reveal = (el) => el.classList.add('is-visible');
  const revealAll = () => revealEls.forEach(reveal);

  // No IntersectionObserver support -> show everything immediately.
  if (!('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

  revealEls.forEach((el) => observer.observe(el));

  // Immediately reveal anything already at/near the top so the page is
  // never blank on load, even before the observer's first callback.
  const revealInView = () => {
    revealEls.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 1.15) {
        reveal(el);
      }
    });
  };
  revealInView();

  // Ultimate backstop: force visibility via INLINE styles, which beat any
  // class/transition/specificity issue in any browser. Content can never
  // stay hidden even if the observer never fires.
  const forceShowAll = () => revealEls.forEach((el) => {
    el.classList.add('is-visible');
    el.style.opacity = '1';
    el.style.transform = 'none';
  });

  window.addEventListener('load', () => {
    revealInView();
    setTimeout(revealAll, 1500);
  });
  // Absolute backstop in case 'load' already fired, is blocked, or the
  // observer never fired for some elements.
  setTimeout(forceShowAll, 2500);
});

// Homepage case studies: one side-scrolling card row, category nav links that
// scroll to a card, and a scroll-spy that highlights the nav item in view.
// Independent of the code above.
(function () {
  const init = () => {
    const section = document.getElementById('work');
    const track = section && section.querySelector('.project-track');
    const list = track && track.querySelector('.project-list');
    const header = section && section.querySelector('.group-header');
    if (!track || !list || !header) return;

    const root = document.documentElement;
    const cards = Array.from(list.children);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const behavior = () => (reduceMotion.matches ? 'auto' : 'smooth');

    // Classic (non-overlay) scrollbars make 100vw wider than the layout
    // viewport; expose the difference so the CSS bleed stops at the edge.
    const setScrollbarWidth = () => {
      const sbw = Math.max(0, window.innerWidth - root.clientWidth);
      root.style.setProperty('--sbw', sbw + 'px');
    };

    /* ----- Arrow buttons ----- */
    const controls = document.createElement('div');
    controls.className = 'track-controls';
    controls.hidden = true;

    const makeBtn = (dir, label, glyph) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'track-btn track-btn--' + dir;
      btn.setAttribute('aria-label', label + ' case study');
      btn.innerHTML = '<span aria-hidden="true">' + glyph + '</span>';
      return btn;
    };
    const prev = makeBtn('prev', 'Previous', '&larr;');
    const next = makeBtn('next', 'Next', '&rarr;');
    controls.append(prev, next);
    header.appendChild(controls);

    const maxScroll = () => track.scrollWidth - track.clientWidth;
    const padLeft = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
    // Track scroll position that puts a card at the track's start.
    const offsetOf = (card) => Math.min(maxScroll(), Math.max(0,
      track.scrollLeft + card.getBoundingClientRect().left -
      track.getBoundingClientRect().left - padLeft()));

    const step = () => {
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    };

    const setDisabled = (btn, disabled) => btn.setAttribute('aria-disabled', String(disabled));

    const updateControls = () => {
      const last = cards[cards.length - 1];
      // Overflows only if a card is actually cut off (not just the bleed
      // padding on the right).
      const visibleRight = track.getBoundingClientRect().left + track.clientWidth;
      const overflows = maxScroll() > 1 &&
        (last.getBoundingClientRect().right - visibleRight > 1 || track.scrollLeft > 1);
      controls.hidden = !overflows;
      setDisabled(prev, track.scrollLeft <= 1);
      setDisabled(next, track.scrollLeft >= maxScroll() - 1);
    };

    prev.addEventListener('click', () => {
      if (prev.getAttribute('aria-disabled') !== 'true') track.scrollBy({ left: -step(), behavior: behavior() });
    });
    next.addEventListener('click', () => {
      if (next.getAttribute('aria-disabled') !== 'true') track.scrollBy({ left: step(), behavior: behavior() });
    });

    /* ----- Scroll-spy ----- */
    const categories = ['product-strategy', 'service-design', 'research'];
    const navIds = ['about'].concat(categories, ['credentials']);
    const linkFor = {};
    navIds.forEach((id) => {
      linkFor[id] = document.querySelector('.nav-links a[href$="#' + id + '"]');
    });

    const setCurrent = (id) => {
      navIds.forEach((other) => {
        const a = linkFor[other];
        if (!a) return;
        if (other === id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };

    // The card "at the track's left edge": the first one still more than
    // half visible. At the end of the row this lands on the last category.
    const currentCategory = () => {
      const start = track.getBoundingClientRect().left + padLeft();
      const card = cards.find((c) => {
        const r = c.getBoundingClientRect();
        return r.right > start + r.width / 2;
      }) || cards[cards.length - 1];
      return card.dataset.category;
    };

    const spySections = ['about', 'work', 'credentials']
      .map((id) => document.getElementById(id)).filter(Boolean);
    const visible = new Set();
    const atBottom = () => window.innerHeight + window.scrollY >= root.scrollHeight - 2;

    const updateSpy = () => {
      // Bottom of the page: the last section wins even if it is short.
      if (atBottom()) return setCurrent('credentials');
      const id = ['about', 'work', 'credentials'].find((s) => visible.has(s));
      if (!id) return;
      setCurrent(id === 'work' ? currentCategory() : id);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        });
        updateSpy();
      }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
      spySections.forEach((s) => observer.observe(s));
    }
    window.addEventListener('scroll', () => {
      if (atBottom()) setCurrent('credentials');
    }, { passive: true });

    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; updateControls(); updateSpy(); });
    }, { passive: true });

    /* ----- Category links: page to the section, row to the card ----- */
    // Category ids live only in the nav hrefs (no element carries them), so
    // the browser never jumps on its own; the first card of the category is
    // found by data-category.
    const showCategory = (id, smooth) => {
      const card = cards.find((c) => c.dataset.category === id);
      if (!card) return false;
      const how = smooth ? behavior() : 'instant';
      section.scrollIntoView({ behavior: how, block: 'start' });
      track.scrollTo({ left: offsetOf(card), behavior: how });
      return true;
    };

    categories.forEach((id) => {
      const a = linkFor[id];
      if (!a) return;
      a.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!showCategory(id, true)) return;
        e.preventDefault();
        if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
      });
    });

    const fromHash = () => {
      const id = location.hash.slice(1);
      if (categories.indexOf(id) !== -1) showCategory(id, false);
    };
    window.addEventListener('popstate', fromHash);

    /* ----- Layout ----- */
    const refresh = () => { setScrollbarWidth(); updateControls(); };
    refresh();
    setCurrent('about');
    fromHash();
    window.addEventListener('resize', refresh);
    // Re-apply once images and web fonts have settled the layout.
    window.addEventListener('load', () => {
      refresh();
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
      fontsReady.then(() => requestAnimationFrame(() => { refresh(); fromHash(); }));
    });
    // Images are lazy and sized by aspect-ratio, but re-check once they land.
    list.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', refresh, { once: true });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
