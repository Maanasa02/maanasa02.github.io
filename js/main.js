document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
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
