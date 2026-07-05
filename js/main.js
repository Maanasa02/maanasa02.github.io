document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }

  // Scroll-reveal: no-op on pages with no .cs-reveal elements.
  const revealEls = document.querySelectorAll('.cs-reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach((el) => observer.observe(el));
    } else {
      // Graceful fallback: reveal everything immediately.
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }
  }
});
