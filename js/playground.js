(() => {
  const host = document.getElementById('embedded-game');
  const preview = document.querySelector('.game-preview-card');
  const slot = document.getElementById('game-frame-slot');
  if (!host || !preview || !slot) return;
  let launcher;
  document.querySelectorAll('[data-play-game]').forEach(link => {
    link.addEventListener('click', event => {
      // Keep explicit full-page links working when JavaScript is unavailable.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      launcher = link;
      const frame = document.createElement('iframe');
      frame.title = 'Play Le Petit Chat';
      frame.src = 'game/index.html?embed=1';
      frame.className = 'game-frame';
      frame.addEventListener('load', () => frame.focus({ preventScroll: true }));
      slot.replaceChildren(frame);
      preview.hidden = true;
      host.hidden = false;
      host.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  });
  document.getElementById('close-game').addEventListener('click', () => {
    slot.replaceChildren();
    host.hidden = true;
    preview.hidden = false;
    launcher?.focus({ preventScroll: true });
    preview.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
})();
