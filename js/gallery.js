(() => {
  const gallery = document.querySelector('.gallery');
  if (!gallery) return;

  const slides = [...gallery.querySelectorAll('.gallery-item')];
  const count = gallery.querySelector('.gallery-count');
  let current = 0;
  let visible = false;

  function syncVideo() {
    slides.forEach((slide, index) => {
      const video = slide.querySelector('video');
      if (!video) return;
      if (index === current && visible && !document.hidden) {
        video.muted = true;
        // Native controls remain available if autoplay is blocked.
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      slide.hidden = position !== current;
    });
    count.textContent = `${current + 1} / ${slides.length}`;
    syncVideo();
  }

  gallery.querySelectorAll('.gallery-arrow').forEach(button => {
    button.addEventListener('click', () => show(current + Number(button.dataset.direction)));
  });

  gallery.addEventListener('keydown', event => {
    if (event.target.closest('video')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncVideo();
  }, { threshold: 0.25 });
  observer.observe(gallery.querySelector('.gallery-stage'));
  document.addEventListener('visibilitychange', syncVideo);
  show(0);
})();
