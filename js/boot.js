/* ==========================================================
   13. MAIN — text capture, canvas wiring, boot, game loop
   ========================================================== */
const TextCapture = (() => {
  let el = null;
  let active = false;
  return {
    value: '',
    init(domEl) { el = domEl; },
    activate(initial, maxLen) {
      active = true;
      this.value = initial || '';
      if (el) {
        el.value = this.value;
        el.maxLength = maxLen || 32;
        // Defer focus slightly so the click that triggered this doesn't blur it again.
        setTimeout(() => { if (active) el.focus(); }, 0);
      }
    },
    deactivate() {
      active = false;
      if (el) el.blur();
    },
    isActive() { return active; },
    syncFromEl() { if (el) this.value = el.value; },
  };
})();

(function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const frame = document.getElementById('frame');
  const textEl = document.getElementById('textCapture');
  const loadGate = document.getElementById('loadGate');
  const fsBtn = document.getElementById('fsBtn');

  TextCapture.init(textEl);
  textEl.addEventListener('input', () => { TextCapture.syncFromEl(); });
  textEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      Input.buffer.push({ type: 'keydown', key: e.key });
    }
  });

  // ---- Responsive scaling: internal resolution stays SW x SH ----
  function layout() {
    const margin = 24;
    const availW = window.innerWidth - margin * 2;
    const availH = window.innerHeight - margin * 2;
    const scale = Math.max(0.3, Math.min(availW / SW, availH / SH, 1.4));
    frame.style.width = `${Math.floor(SW * scale)}px`;
    frame.style.height = `${Math.floor(SH * scale)}px`;
    canvas.style.width = `${Math.floor(SW * scale)}px`;
    canvas.style.height = `${Math.floor(SH * scale)}px`;
    VIEWPORT_WIDTH = window.innerWidth;
  }
  window.addEventListener('resize', layout);
  layout();

  function canvasPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (SW / rect.width);
    const y = (clientY - rect.top) * (SH / rect.height);
    return [clamp(x, 0, SW), clamp(y, 0, SH)];
  }

  canvas.addEventListener('mousemove', (e) => {
    const [x, y] = canvasPos(e.clientX, e.clientY);
    Input.mx = x; Input.my = y;
  });
  canvas.addEventListener('mousedown', (e) => {
    AudioSys.unlock();
    MusicPlayer.unlock();
    const [x, y] = canvasPos(e.clientX, e.clientY);
    Input.mx = x; Input.my = y;
    if (e.button === 0) Input.mouseDown = true;
    Input.buffer.push({ type: 'mousedown', button: e.button });
    e.preventDefault();
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) Input.mouseDown = false;
    Input.buffer.push({ type: 'mouseup', button: e.button });
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Touch support: map single-touch to left-click equivalent.
  canvas.addEventListener('touchstart', (e) => {
    AudioSys.unlock();
    MusicPlayer.unlock();
    if (e.touches.length) {
      const t = e.touches[0];
      const [x, y] = canvasPos(t.clientX, t.clientY);
      Input.mx = x; Input.my = y;
      Input.mouseDown = true;
      Input.buffer.push({ type: 'mousedown', button: 0 });
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length) {
      const t = e.touches[0];
      const [x, y] = canvasPos(t.clientX, t.clientY);
      Input.mx = x; Input.my = y;
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    Input.mouseDown = false;
    Input.buffer.push({ type: 'mouseup', button: 0 });
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (TextCapture.isActive() && document.activeElement === textEl) return;
    AudioSys.unlock();
    MusicPlayer.unlock();
    if (e.key === 'Escape' || e.key === 'Enter') {
      Input.buffer.push({ type: 'keydown', key: e.key });
    }
    if (e.key === 'F11') return;
  });

  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      (frame.requestFullscreen || frame.webkitRequestFullscreen || function () {}).call(frame);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  });

  // ---- Boot ----
  loadProfile();

  function startGame() {
    loadGate.classList.add('hidden');
    Game.goto('menu');

    let lastT = performance.now();
    function loop(t) {
      let dt = (t - lastT) / 1000.0;
      lastT = t;
      dt = Math.min(dt, 0.05);

      const events = drainEvents();
      const scene = Game.current();
      if (scene) scene.frame(ctx, dt, events, Input.mx, Input.my);

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  if (document.fonts && document.fonts.ready) {
    Promise.race([
      document.fonts.ready,
      new Promise((res) => setTimeout(res, 1200)),
    ]).then(startGame);
  } else {
    setTimeout(startGame, 300);
  }
})();
