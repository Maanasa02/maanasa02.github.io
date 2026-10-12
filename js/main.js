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

// Side-scrolling project card rows (homepage). Independent of the code above.
(function () {
  const init = () => {
    const tracks = document.querySelectorAll('.project-track');
    if (!tracks.length) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Classic (non-overlay) scrollbars make 100vw wider than the layout
    // viewport; expose the difference so the CSS bleed stops at the edge.
    const setScrollbarWidth = () => {
      const sbw = Math.max(0, window.innerWidth - root.clientWidth);
      root.style.setProperty('--sbw', sbw + 'px');
    };
    setScrollbarWidth();

    const rows = [];

    tracks.forEach((track) => {
      const group = track.closest('.project-group');
      const header = group && group.querySelector('.group-header');
      const list = track.querySelector('.project-list');
      if (!header || !list) return;

      const heading = header.querySelector('.group-heading');
      const name = heading ? heading.textContent.trim() : 'projects';

      const controls = document.createElement('div');
      controls.className = 'track-controls';
      controls.hidden = true;

      const makeBtn = (dir, label, glyph) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'track-btn track-btn--' + dir;
        btn.setAttribute('aria-label', label + ' ' + name + ' project');
        btn.innerHTML = '<span aria-hidden="true">' + glyph + '</span>';
        return btn;
      };
      const prev = makeBtn('prev', 'Previous', '&larr;');
      const next = makeBtn('next', 'Next', '&rarr;');
      controls.append(prev, next);
      header.appendChild(controls);

      const step = () => {
        const card = list.firstElementChild;
        if (!card) return track.clientWidth * 0.8;
        const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
        return card.getBoundingClientRect().width + gap;
      };

      const scrollByCards = (dir) => {
        track.scrollBy({ left: dir * step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      };

      const setDisabled = (btn, disabled) => {
        btn.setAttribute('aria-disabled', String(disabled));
      };

      const update = () => {
        const last = list.lastElementChild;
        const trackRect = track.getBoundingClientRect();
        // Overflows only if a card is actually cut off (not just the
        // bleed padding on the right).
        const cardsRight = last ? last.getBoundingClientRect().right + track.scrollLeft : 0;
        const visibleRight = trackRect.left + track.clientWidth;
        const overflows = track.scrollWidth - track.clientWidth > 1 &&
          (cardsRight - visibleRight > 1 || track.scrollLeft > 1);
        controls.hidden = !overflows;
        const max = track.scrollWidth - track.clientWidth;
        setDisabled(prev, track.scrollLeft <= 1);
        setDisabled(next, track.scrollLeft >= max - 1);
      };

      prev.addEventListener('click', () => {
        if (prev.getAttribute('aria-disabled') !== 'true') scrollByCards(-1);
      });
      next.addEventListener('click', () => {
        if (next.getAttribute('aria-disabled') !== 'true') scrollByCards(1);
      });

      let ticking = false;
      track.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; update(); });
      }, { passive: true });

      rows.push(update);
    });

    const updateAll = () => { setScrollbarWidth(); rows.forEach((fn) => fn()); };
    updateAll();
    window.addEventListener('resize', updateAll);
    window.addEventListener('load', updateAll);
    // Images are lazy and sized by aspect-ratio, but re-check once they land.
    document.querySelectorAll('.project-track img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', updateAll, { once: true });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Homepage scroll-spy: soft pill on the nav item for the section in view.
(function () {
  const init = () => {
    const ids = ['about', 'product-strategy', 'service-design', 'research', 'credentials'];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (sections.length !== ids.length || !('IntersectionObserver' in window)) return;

    const linkFor = {};
    ids.forEach((id) => {
      linkFor[id] = document.querySelector('.nav-links a[href$="#' + id + '"]');
    });

    const setCurrent = (id) => {
      ids.forEach((other) => {
        const a = linkFor[other];
        if (!a) return;
        if (other === id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };

    const visible = new Set();
    // Sections that sit side by side (Service design + Research) are in view
    // together; the one picked from the nav stays highlighted until it
    // scrolls out of view.
    let pinned = null;
    let pinnedSeen = false;
    const pin = (id) => {
      if (ids.indexOf(id) === -1) return;
      pinned = id;
      pinnedSeen = visible.has(id);
      setCurrent(id);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      });
      if (pinned) {
        if (visible.has(pinned)) pinnedSeen = true;
        else if (pinnedSeen) pinned = null;
      }
      // Bottom of the page: the last section wins even if it is short.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = atBottom ? ids[ids.length - 1] : ids.find((id) => visible.has(id));
      if (!atBottom && pinned && (visible.has(pinned) || !pinnedSeen)) current = pinned;
      if (current) setCurrent(current);
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    Object.keys(linkFor).forEach((id) => {
      const a = linkFor[id];
      if (a) a.addEventListener('click', () => pin(id));
    });

    sections.forEach((s) => observer.observe(s));
    setCurrent('about');
    if (location.hash) pin(location.hash.slice(1));

    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        setCurrent(ids[ids.length - 1]);
      }
    }, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
