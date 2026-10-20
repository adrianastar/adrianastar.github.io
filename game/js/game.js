(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const world = $('.world');
  const embedded = new URLSearchParams(location.search).has('embed');
  if (embedded) document.body.classList.add('embedded');
  const astronaut = $('#astronaut');
  const body = $('#astronaut-body');
  const cat = $('#cat');
  const buttons = [...document.querySelectorAll('[data-action]')];
  const keys = new Set();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const player = { x: 320, y: 470 };
  let discovered = false, fed = false, waiting = false, completed = false;
  let calmTime = 0, paused = false, previous = 0, elapsed = 0;
  let near = false, onNextPlanet = false;
  const portalNear = () => completed && Math.hypot(player.x - 872, player.y - 536) < 65;
  const obstacles = [
    { x: 336, y: 260, w: 329, h: 100 },
    { x: 608, y: 337, w: 128, h: 82 },
    { x: 118, y: 325, w: 101, h: 57 },
    { x: 758, y: 433, w: 93, h: 51 }
  ];
  const directionKeys = {
    ArrowUp: [0, -1], w: [0, -1], z: [0, -1],
    ArrowDown: [0, 1], s: [0, 1],
    ArrowLeft: [-1, 0], a: [-1, 0], q: [-1, 0],
    ArrowRight: [1, 0], d: [1, 0]
  };
  let reactionTime = 0, reaction = 'idle', toastTime = 0;
  const thoughts = { player: { time: 0 }, cat: { time: 0 } };
  let keyCollected = false;
  try { keyCollected = localStorage.getItem('le-petit-chat:moon-key') === 'true'; } catch {}
  const keyNear = () => !keyCollected && Math.hypot(player.x - 220, player.y - 510) < 65;
  function positionSpeech() {
    for (const who of ['player', 'cat']) {
      const bubble = $(`#${who}-thought`);
      const x = who === 'cat' ? 672 : player.x;
      const y = who === 'cat' ? 306 : player.y - 54;
      bubble.style.left = `${Math.max(12, Math.min(88, x / 960 * 100))}%`;
      bubble.style.top = `${y / 640 * 100}%`;
    }
  }
  function think(who, icon, caption, seconds = 3) {
    const bubble = $(`#${who}-thought`);
    bubble.querySelector('.thought-icon').textContent = icon;
    bubble.querySelector('.thought-caption').textContent = caption;
    bubble.hidden = false; thoughts[who].time = seconds;
    positionSpeech();
  }
  function exchange(playerIcon, playerCaption, catIcon, catCaption) {
    think('player', playerIcon, playerCaption);
    think('cat', catIcon, catCaption, 3.5);
    $('#reaction-status').textContent = `You: ${playerCaption}. Mad Nebula: ${catCaption}.`;
  }
  function notify(text) { $('#toast').textContent = text; $('#toast').hidden = false; toastTime = 4; }
  function react(state, duration = 3) {
    reaction = state; reactionTime = duration;
    cat.classList.remove('swipe', 'playful', 'eating', 'relaxed', 'angry');
    if (state !== 'idle') { void cat.getBoundingClientRect(); cat.classList.add(state); }
    $('#scratch-marks').toggleAttribute('hidden', state !== 'swipe');
    $('#cat-ears').setAttribute('d', state === 'swipe' || state === 'angry' ? 'm-17-6-12-8 25 3m8 0 25-3-12 8' : 'm-17-6-1-17 14 10m8 0 14-10-1 19');
    $('#cat-eyes').setAttribute('d', state === 'relaxed' ? 'M-13-2q4 5 8 0m10 0q4 5 8 0' : 'm-12-5 8 2m8 0 8-2');
    $('#cat-emote').textContent = state === 'swipe' ? '!' : state === 'relaxed' ? '♡' : state === 'eating' ? '♪' : '';
    $('#space-toy').toggleAttribute('hidden', state !== 'playful');
  }
  function renderInventory() {
    $('#moon-key').toggleAttribute('hidden', keyCollected);
    $('#inventory-item').textContent = keyCollected ? '⚿ Moon Key' : 'Empty';
  }
  function collectKey() {
    if (!keyNear() || paused) return;
    keyCollected = true;
    let saved = false;
    try { localStorage.setItem('le-petit-chat:moon-key', 'true'); saved = true; } catch {}
    renderInventory();
    notify(saved ? 'Moon Key +1 · saved' : 'Moon Key +1 · this session');
    think('player', '🗝️', 'A key!');
    renderUI();
  }
  $('#collect').addEventListener('click', collectKey);
  const distance = () => Math.hypot(player.x - 672, player.y - 390);
  function renderUI() {
    near = distance() < 140 && !onNextPlanet;
    $('#portal').classList.toggle('active', completed);
    $('#portal').setAttribute('aria-label', completed ? 'Active teleport pad to the next planet' : 'Inactive teleport pad');
    $('#teleport').hidden = !portalNear() || paused || onNextPlanet;
    if (onNextPlanet) return;
    if (near && !discovered) {
      discovered = true;
      $('#cat-name').textContent = 'Mad Nebula';
      $('#cat-hint').setAttribute('hidden', '');
      exchange('👋', 'Hello!', '🍲', 'Hungry'); react('angry', 2); notify('Discovered · Mad Nebula');
    }
    $('.scene-actions').classList.toggle('available', near && !completed);
    $('#collect').hidden = !keyNear() || paused;
    $('#trust').value = completed ? 2 : fed ? 1 : 0;
    $('#trust-level').textContent = completed ? '2 / 2 · Friends' : fed ? '1 / 2' : '0 / 2';
    buttons.forEach(button => { button.disabled = !near || paused || completed; });
    $('#scene-prompt').textContent = paused ? 'Paused. Take your time.' : completed ? (portalNear() ? 'Teleport · E' : 'Next planet → glowing pad, bottom right') : waiting ? 'Step back ←' : near ? 'What will you do?' : keyNear() ? 'Pick up the key · E' : 'Explore with the arrow keys';
    $('#objective').textContent = completed ? 'Next planet ↘' : waiting ? 'Give space' : discovered ? 'Befriend Mad Nebula' : 'Find the cat';
  }
  function action(kind) {
    if (!near || paused || completed) return;
    if (kind === 'feed') {
      if (fed) { exchange('🍲', 'More?', '✓', 'Full'); return; }
      fed = true; waiting = false; calmTime = 0;
      $('#food').removeAttribute('hidden');
      $('#meal-state strong').textContent = '✓ Fed'; $('#meal-state').classList.add('met');
      react('eating', 4); notify('Trust +1');
      exchange('🍲', 'For you', '😋', 'Yummy!');
    } else if (kind === 'cuddle') {
      waiting = false; calmTime = 0; react('swipe', 3);
      exchange('♡', 'Cuddle?', '💢', 'No touching!');
    } else if (kind === 'play') {
      waiting = false; calmTime = 0;
      if (fed) { react('playful', 4); exchange('🧶', 'Play?', '🐾', 'Pounce!'); }
      else { react('angry'); exchange('🧶', 'Play?', '🍲', 'Food first!'); }
    } else if (kind === 'space') {
      waiting = true; calmTime = 0;
      exchange('☾', 'Take your time', fed ? '🌙' : '🍲', fed ? 'Some room…' : 'Still hungry');
      notify(fed ? 'Step back ←' : 'Offer food first');
    }
    renderUI();
  }
  buttons.forEach(button => button.addEventListener('click', () => { action(button.dataset.action); world.focus({ preventScroll: true }); }));
  function clearInput() { keys.clear(); }
  function setPause(value) {
    paused = value; clearInput();
    $('#pause').textContent = paused ? 'Resume' : 'Pause'; renderUI();
  }
  $('#pause').addEventListener('click', () => setPause(!paused));
  world.addEventListener('keydown', event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (directionKeys[key]) { event.preventDefault(); event.stopPropagation(); keys.add(key); }
    if (key === 'e' && portalNear() && !paused && !onNextPlanet) { event.preventDefault(); teleport(); return; }
    if (key === 'e' && keyNear() && !paused) { event.preventDefault(); collectKey(); return; }
    if (key === 'e' && !paused && near && !completed) { event.preventDefault(); buttons[0].focus(); }
    if (key === 'Escape') setPause(!paused);
  });
  window.addEventListener('keyup', event => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
  world.addEventListener('blur', clearInput);
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPause(true); });
  const padKeys = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  document.querySelectorAll('[data-move]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      keys.add(padKeys[button.dataset.move]);
    });
    const release = () => keys.delete(padKeys[button.dataset.move]);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });
  function blocked(x, y) {
    return x < 42 || x > 918 || y < 323 || y > 586 || obstacles.some(o => x > o.x - 18 && x < o.x + o.w + 18 && y > o.y - 12 && y < o.y + o.h + 12);
  }
  function frame(time) {
    const dt = previous ? Math.min((time - previous) / 1000, .05) : 0;
    previous = time;
    if (!paused && !onNextPlanet) {
      elapsed += dt;
      for (const who of ['player', 'cat']) {
        if (thoughts[who].time > 0) {
          thoughts[who].time -= dt;
          if (thoughts[who].time <= 0) $(`#${who}-thought`).hidden = true;
        }
      }
      if (toastTime > 0) { toastTime -= dt; if (toastTime <= 0) $('#toast').hidden = true; }
      if (reactionTime > 0) { reactionTime -= dt; if (reactionTime <= 0) react(completed ? 'relaxed' : 'idle', 0); }
      if (!motion.matches && reaction === 'idle') $('#tail').setAttribute('d', `M15 20q33 2 ${28 + Math.sin(elapsed * 3) * 6}-20`);
      let dx = 0, dy = 0;
      keys.forEach(key => { const vector = directionKeys[key]; if (vector) { dx += vector[0]; dy += vector[1]; } });
      const length = Math.hypot(dx, dy);
      if (length) {
        dx = dx / length * 155 * dt; dy = dy / length * 155 * dt;
        if (!blocked(player.x + dx, player.y)) player.x += dx;
        if (!blocked(player.x, player.y + dy)) player.y += dy;
      }
      astronaut.setAttribute('transform', `translate(${player.x} ${player.y})`);
      body.setAttribute('transform', `translate(0 ${length && !motion.matches ? Math.sin(elapsed * 15) * 1.7 : 0})`);
      if (waiting && fed && !completed) {
        calmTime = distance() > 175 ? calmTime + dt : 0;
        if (calmTime >= 2.5) {
          completed = true; waiting = false;
          $('#space-state strong').textContent = '✓ Calm'; $('#space-state').classList.add('met');
          $('#complete').hidden = false;
          react('relaxed', 0); notify('Friendship earned · Portal unlocked ↘');
          exchange('✨', 'Friends?', '♡', 'Prrrr…');
        }
      }
      positionSpeech(); renderUI();
    }
    requestAnimationFrame(frame);
  }
  $('#restart').addEventListener('click', () => {
    if (onNextPlanet) returnToMoon();
    discovered = fed = waiting = completed = false; calmTime = 0;
    player.x = 320; player.y = 470;
    $('#complete').hidden = true; $('#food').setAttribute('hidden', ''); $('#cat-hint').removeAttribute('hidden');
    for (const who of ['player', 'cat']) { thoughts[who].time = 0; $(`#${who}-thought`).hidden = true; }
    $('#cat-name').textContent = 'Find the cat';
    $('#meal-state strong').textContent = 'Needed'; $('#space-state strong').textContent = 'Needed';
    $('#meal-state').classList.remove('met'); $('#space-state').classList.remove('met');
    cat.classList.remove('swipe', 'playful');
    react('idle', 0); $('#toast').hidden = true; toastTime = 0;
    think('player', '🧭', 'Let’s explore');
    setPause(false); world.focus();
  });
  function teleport() {
    if (!portalNear() || paused || onNextPlanet) return;
    onNextPlanet = true; clearInput();
    $('#arrival').hidden = false;
    $('#arrival-inventory').textContent = keyCollected ? '⚿ Moon Key is in your satchel.' : 'Your satchel travels with you.';
    $('#teleport').hidden = true; $('#scene-prompt').hidden = true;
    for (const who of ['player', 'cat']) $(`#${who}-thought`).hidden = true;
    $('#toast').hidden = true; $('#collect').hidden = true;
    $('#objective').textContent = 'Uncharted planet';
    $('#return-moon').focus({ preventScroll: true });
  }
  function returnToMoon() {
    onNextPlanet = false; clearInput(); player.x = 846; player.y = 545;
    $('#arrival').hidden = true; $('#scene-prompt').hidden = false;
    world.focus({ preventScroll: true }); renderUI();
  }
  $('#teleport').addEventListener('click', teleport);
  $('#return-moon').addEventListener('click', returnToMoon);
  const starGroup = $('#stars');
  for (let i = 0; i < 85; i++) {
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    star.setAttribute('cx', (i * 137.51 + 20) % 960); star.setAttribute('cy', (i * 73.37 + 12) % 260);
    star.setAttribute('r', i % 8 === 0 ? 1.6 : .8); star.setAttribute('opacity', .25 + (i % 5) * .14);
    starGroup.appendChild(star);
  }
  renderInventory(); think('player', '🧭', 'Let’s explore');
  renderUI(); requestAnimationFrame(frame);
  if (embedded) world.focus({ preventScroll: true });
})();
