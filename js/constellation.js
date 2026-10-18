(() => {
  const canvas = document.getElementById('constellation');
  const wrap = canvas?.closest('.constellation-wrap');
  if (!canvas || !wrap) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: -1000, y: -1000, active: false };
  const points = [];
  const pointCount = 62;
  const connectionDistance = 142;
  let width = 520;
  let height = 520;
  let dpr = 1;
  let frame = 0;

  // Deterministic starting positions make the network feel composed, not random.
  for (let i = 0; i < pointCount; i++) {
    const angle = i * 2.399963229728653;
    const radius = 28 + Math.sqrt((i + 0.5) / pointCount) * 218;
    const x = 260 + Math.cos(angle) * radius * (0.78 + (i % 5) * 0.055);
    const y = 260 + Math.sin(angle) * radius * (0.82 + (i % 7) * 0.035);
    points.push({
      x: Math.max(16, Math.min(504, x)),
      y: Math.max(16, Math.min(504, y)),
      ox: Math.max(16, Math.min(504, x)),
      oy: Math.max(16, Math.min(504, y)),
      phase: i * 1.71,
      size: i % 9 === 0 ? 3.2 : (i % 4 === 0 ? 2.4 : 1.6),
      cyan: i % 5 === 0
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr * width / 520, 0, 0, dpr * height / 520, 0, 0);
    draw(reducedMotion ? 0 : performance.now() / 1000);
  }

  function draw(time) {
    ctx.clearRect(0, 0, 520, 520);
    const mx = pointer.x / Math.max(1, width) * 520;
    const my = pointer.y / Math.max(1, height) * 520;
    const interactionRadius = 150;

    for (const p of points) {
      const driftX = reducedMotion ? 0 : Math.cos(time * 0.42 + p.phase) * 3.2;
      const driftY = reducedMotion ? 0 : Math.sin(time * 0.35 + p.phase * 1.2) * 3.2;
      let tx = p.ox + driftX;
      let ty = p.oy + driftY;
      if (pointer.active) {
        const dx = tx - mx;
        const dy = ty - my;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < interactionRadius) {
          const force = (1 - distance / interactionRadius) * 22;
          tx += dx / distance * force;
          ty += dy / distance * force;
        }
      }
      p.x += (tx - p.x) * 0.095;
      p.y += (ty - p.y) * 0.095;
    }

    // Draw connections between nearby points, with brighter links around the pointer.
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > connectionDistance) continue;
        const nearPointer = pointer.active && Math.hypot((a.x + b.x) / 2 - mx, (a.y + b.y) / 2 - my) < interactionRadius;
        const alpha = (1 - distance / connectionDistance) * (nearPointer ? 0.48 : 0.2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = nearPointer ? `rgba(143, 207, 225, ${alpha})` : `rgba(181, 165, 255, ${alpha})`;
        ctx.lineWidth = nearPointer ? 1.15 : 0.75;
        ctx.stroke();
      }
    }

    // Soft centre glow.
    const glow = ctx.createRadialGradient(260, 260, 5, 260, 260, 180);
    glow.addColorStop(0, 'rgba(139, 123, 255, 0.12)');
    glow.addColorStop(1, 'rgba(139, 123, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(70, 70, 380, 380);

    for (const p of points) {
      const distance = pointer.active ? Math.hypot(p.x - mx, p.y - my) : Infinity;
      const active = distance < interactionRadius * 0.7;
      const r = p.size + (active ? (1 - distance / (interactionRadius * 0.7)) * 2.2 : 0);
      if (active) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(151, 207, 231, 0.09)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.cyan || active ? '#8fd0df' : '#d8d0ff';
      ctx.globalAlpha = active ? 1 : 0.78;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // A subtle orbit ring anchors the network visually.
    ctx.beginPath();
    ctx.arc(260, 260, 115, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(183, 167, 255, 0.11)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function animate(now) {
    draw(now / 1000);
    if (!reducedMotion) frame = requestAnimationFrame(animate);
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    if (reducedMotion) draw(0);
  }

  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerleave', () => {
    pointer.active = false;
    if (reducedMotion) draw(0);
  });
  canvas.addEventListener('pointerdown', updatePointer);
  window.addEventListener('resize', resize, { passive: true });

  resize();
  if (!reducedMotion) frame = requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
})();
