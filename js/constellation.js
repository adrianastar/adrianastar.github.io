(() => {
  const canvas = document.getElementById('constellation');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Orion: shoulders, belt, feet, raised arm and bow.
  const stars = [
    [173, 145, 3.4], [340, 169, 3.1],
    [226, 260, 2.8], [260, 272, 3], [294, 283, 2.8],
    [178, 405, 3.1], [348, 393, 3.7],
    [262, 91, 2.1], [248, 310, 1.6], [241, 337, 1.9],
    [118, 98, 1.9], [104, 51, 2.3],
    [405, 133, 1.9], [430, 190, 2], [419, 247, 1.8]
  ];
  const links = [[0, 7], [7, 1], [0, 2], [1, 4], [2, 3], [3, 4],
    [2, 5], [4, 6], [3, 8], [8, 9], [0, 10], [10, 11],
    [1, 13], [12, 13], [13, 14]];
  const background = Array.from({ length: 95 }, (_, i) => [
    ((i * 137.508 + 23) % 500) + 10,
    ((i * 79.317 + 41) % 500) + 10,
    i % 7 === 0 ? 1 : .55
  ]);
  const pointer = { x: 260, y: 260, active: false };
  let frame;
  let visible = false;

  function draw(time = 0) {
    ctx.clearRect(0, 0, 520, 520);
    const seconds = motion.matches ? 0 : time / 1000;
    const positions = stars.map(([x, y, r], i) => {
      let px = x + Math.sin(seconds * .38 + i * 1.9) * 18;
      let py = y + Math.cos(seconds * .3 + i * 1.4) * 14;
      if (pointer.active && !motion.matches) {
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        const force = Math.max(0, 1 - distance / 160) * 32;
        px += dx / distance * force;
        py += dy / distance * force;
      }
      return [px, py, r];
    });
    background.forEach(([ox, oy, r], i) => {
      const x = ox + Math.sin(seconds * .15 + i) * 9;
      const y = oy + Math.cos(seconds * .12 + i) * 9;
      ctx.globalAlpha = .22 + .2 * (1 + Math.sin(time * .0005 + i)) / 2;
      ctx.fillStyle = '#cbd5f5';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(178, 193, 240, .38)';
    ctx.lineWidth = .8;
    links.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(positions[a][0], positions[a][1]);
      ctx.lineTo(positions[b][0], positions[b][1]);
      ctx.stroke();
    });
    // Additional connections appear as drifting stars come close together.
    positions.forEach(([x, y], i) => {
      positions.slice(i + 1).forEach(([bx, by], offset) => {
        const j = i + offset + 1;
        if (links.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) return;
        const distance = Math.hypot(x - bx, y - by);
        if (distance > 125) return;
        ctx.strokeStyle = `rgba(76, 184, 255, ${(1 - distance / 125) * .4})`;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(bx, by); ctx.stroke();
      });
    });
    positions.forEach(([x, y, r], i) => {
      const pulse = motion.matches ? 1 : .85 + .15 * Math.sin(time * .0009 + i * 1.7);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 9);
      glow.addColorStop(0, `rgba(175, 192, 255, ${.38 * pulse})`);
      glow.addColorStop(1, 'rgba(175, 192, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - r * 9, y - r * 9, r * 18, r * 18);
      ctx.fillStyle = i % 3 === 0 ? '#8bddff' : '#edf6ff';
      ctx.beginPath();
      ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
      ctx.fill();
      if (r > 3) {
        ctx.strokeStyle = 'rgba(232, 239, 255, .55)';
        ctx.beginPath();
        ctx.moveTo(x - r * 3, y); ctx.lineTo(x + r * 3, y);
        ctx.moveTo(x, y - r * 3); ctx.lineTo(x, y + r * 3);
        ctx.stroke();
      }
    });
  }

  function animate(time) {
    draw(time);
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);
    draw();
    if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
  }
  function resize() {
    const size = Math.max(1, canvas.getBoundingClientRect().width);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(canvas.width / 520, 0, 0, canvas.height / 520, 0, 0);
    draw();
  }
  canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 520;
    pointer.y = (event.clientY - rect.top) / rect.height * 520;
    pointer.active = true;
  });
  canvas.addEventListener('pointerleave', () => { pointer.active = false; });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(canvas);
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  resize();
})();
