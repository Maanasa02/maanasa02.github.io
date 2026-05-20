document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }

  // Work carousel: arrow scroll controls
  const carousel = document.querySelector('[data-work-carousel]');
  if (carousel) {
    const arrows = document.querySelectorAll('.work-carousel-arrow');
    const firstCard = carousel.querySelector('.work-card');
    arrows.forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir === 'next' ? 1 : -1;
        const step = firstCard ? firstCard.getBoundingClientRect().width + 24 : 360;
        carousel.scrollBy({ left: dir * step, behavior: 'smooth' });
      });
    });
  }
});
