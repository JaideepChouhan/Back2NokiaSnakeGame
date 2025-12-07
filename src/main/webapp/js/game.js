// Updated full game.js: demo layout + SAVE working + leaderboard opens
// Added: Countdown (3..2..1) before Start and Pause <-> Resume toggle
// Everything else left unchanged. Replace your existing js/game.js with this file and hard-refresh (Ctrl+F5).

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // DOM refs (aapke demo jaise)
    const canvas = document.getElementById('board');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const scoreEl = document.getElementById('scoreVal');
    const statusEl = document.getElementById('statusVal');
    const gameModeSelect = document.getElementById('gameMode');
    const tableSelect = document.getElementById('tableSelect');
    const nextInfo = document.getElementById('nextInfo');
    const siteHeader = document.getElementById('siteHeader');
    const demoTop = document.getElementById('demoTop');

    if (!canvas) return console.error('[game.js] canvas #board not found');

    // --- SAME DEMO CONFIG ---
    const GRID = 20;
    const TICK = 120;
    const WALL_MODE = true;
    const MIN_TABLE = 2;
    const MAX_TABLE = 10;
    const PAD_INNER = 18;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    // Countdown config
    const COUNTDOWN_START = 3;      // shows 3,2,1
    const COUNTDOWN_STEP_MS = 800;  // ms per number (change to 1000 for 1s)

    // --- STATE
    let intervalId = null;
    let cols = 0, rows = 0;
    let snake = [];
    let dir = { x: 1, y: 0 };
    let items = [];
    let foodSingle = null;
    let score = 0;
    let gameOver = false;
    let paused = false;
    let currentTarget = 1;
    const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

    // Countdown runtime state
    let rafId = null;
    let countdownRunning = false;
    let countdownEndTs = 0;

    // Toast (same as demo)
    let toastEl = document.getElementById('feedbackToast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'feedbackToast';
      document.body.appendChild(toastEl);
    }
    function showFeedback(msg, type = 'info', duration = 1400) {
      toastEl.textContent = msg;
      toastEl.className = '';
      if (type === 'error') toastEl.classList.add('error');
      else if (type === 'success') toastEl.classList.add('success');
      try {
        const rect = canvas.getBoundingClientRect();
        const toastRect = toastEl.getBoundingClientRect();
        let top = Math.max(8, Math.floor(rect.top - toastRect.height - 8));
        if (top < 8) top = Math.min(rect.top + 8, window.innerHeight - toastRect.height - 8);
        const left = Math.round(rect.left + rect.width / 2);
        toastEl.style.position = 'fixed';
        toastEl.style.left = left + 'px';
        toastEl.style.top = top + 'px';
        toastEl.style.transform = 'translateX(-50%) translateY(-6px)';
      } catch (e) {
        toastEl.style.left = '50%';
        toastEl.style.top = '12px';
        toastEl.style.transform = 'translateX(-50%) translateY(-6px)';
      }
      toastEl.classList.add('show');
      if (toastEl._timeout) clearTimeout(toastEl._timeout);
      toastEl._timeout = setTimeout(() => {
        toastEl.classList.remove('show');
        toastEl._timeout = null;
      }, duration);
    }

    // Canvas/grid utils
    function setupCanvasSize() {
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || canvas.width || 900;
      const cssH = rect.height || canvas.height || 520;
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = 'top';
      return ctx;
    }
    let ctx = setupCanvasSize();

    function resizeCanvasToFill() {
      const viewportH = window.innerHeight;
      const headerH = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
      const topH = demoTop ? demoTop.getBoundingClientRect().height : 0;
      const footerH = 48;
      const availableH = Math.max(120, Math.floor(viewportH - headerH - topH - footerH - 32));
      const maxWidth = Math.min(window.innerWidth - 40, 1200);
      canvas.style.width = maxWidth + 'px';
      canvas.style.height = availableH + 'px';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      ctx = setupCanvasSize();
    }
    function cellsAcross() { const innerW = Math.max(0, canvas.clientWidth - PAD_INNER * 2); return Math.max(2, Math.floor(innerW / GRID)); }
    function cellsDown() { const innerH = Math.max(0, canvas.clientHeight - PAD_INNER * 2); return Math.max(2, Math.floor(innerH / GRID)); }
    function cellToPixelX(x) { return PAD_INNER + x * GRID; }
    function cellToPixelY(y) { return PAD_INNER + y * GRID; }

    function drawFrame() {
      try {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        ctx.clearRect(0, 0, w, h);
        const padOuter = 12;
        ctx.save();
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'square';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,255,51,0.22)';
        ctx.shadowColor = 'rgba(0,255,51,0.28)';
        ctx.shadowBlur = 12;
        ctx.strokeRect(padOuter, padOuter, w - padOuter * 2, h - padOuter * 2);
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,255,51,0.95)';
        ctx.strokeRect(PAD_INNER, PAD_INNER, w - PAD_INNER * 2, h - PAD_INNER * 2);
        ctx.restore();
      } catch (e) {}
    }

    function positionEq(a, b) { return a.x === b.x && a.y === b.y; }
    function isOnList(pos, list) { if (!list || list.length === 0) return false; for (let i = 0; i < list.length; i++) if (positionEq(pos, list[i])) return true; return false; }
    function chebyshevDistance(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
    function buildWallsArray() {
      const w = [];
      if (!WALL_MODE) return w;
      const maxX = cols; const maxY = rows;
      for (let x = 0; x < maxX; x++) { w.push({ x, y: 0 }); w.push({ x, y: maxY - 1 }); }
      for (let y = 1; y < maxY - 1; y++) { w.push({ x: 0, y }); w.push({ x: maxX - 1, y }); }
      return w;
    }
    function isCellOccupied(x, y) {
      for (const s of snake) if (s.x === x && s.y === y) return true;
      for (const it of items) if (it.x === x && it.y === y) return true;
      if (foodSingle && foodSingle.x === x && foodSingle.y === y) return true;
      return false;
    }
    function randCell() { return { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
    function findFreeCell() {
      let attempts = 0; let c = randCell();
      while (isCellOccupied(c.x, c.y) && attempts++ < 500) c = randCell();
      return c;
    }
    function getSafeFoodPosition(innerCols, innerRows, occupiedList = [], walls = [], minDistanceFromWall = 1, marginCells = 1) {
      const allowed = [];
      const minX = Math.max(marginCells, 0);
      const maxX = Math.max(innerCols - marginCells - 1, minX);
      const minY = Math.max(marginCells, 0);
      const maxY = Math.max(innerRows - marginCells - 1, minY);
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const pos = { x, y }; if (isOnList(pos, walls)) continue; if (isOnList(pos, occupiedList)) continue;
          let tooClose = false; for (let i = 0; i < walls.length; i++) { if (chebyshevDistance(pos, walls[i]) <= minDistanceFromWall) { tooClose = true; break; } }
          if (tooClose) continue; allowed.push(pos);
        }
      }
      if (allowed.length === 0 && minDistanceFromWall > 0) {
        return getSafeFoodPosition(innerCols, innerRows, occupiedList, walls, Math.max(0, minDistanceFromWall - 1), Math.max(0, marginCells - 1));
      }
      if (allowed.length === 0) return null;
      return allowed[Math.floor(Math.random() * allowed.length)];
    }
    // -- Learning helpers
    function pickWrongNumber(target, maxTarget = 100) {
      const deltas = [1, -1, 2, -2, 3, -3];
      for (const d of deltas) { const v = target + d; if (v >= 1 && v <= maxTarget && v !== target) return v; }
      let attempts = 0, val = target;
      while ((val === target || val < 1 || val > maxTarget) && attempts++ < 500) val = Math.floor(Math.random() * maxTarget) + 1;
      return val === target ? Math.max(1, Math.min(maxTarget, target + 1)) : val;
    }
    function pickWrongAlphabet(index) {
      const deltas = [1, -1, 2, -2];
      for (const d of deltas) {
        const i = index + d;
        if (i >= 0 && i < ALPHABET.length) return ALPHABET[i];
      }
      let attempts = 0, idx = index;
      while (idx === index && attempts++ < 200) idx = Math.floor(Math.random() * ALPHABET.length);
      return ALPHABET[idx];
    }
    function pickWrongTableValue(tableNum, multiplier) {
      const deltas = [1, -1, 2, -2];
      for (const d of deltas) {
        const m = multiplier + d;
        if (m >= 1 && m <= 12 && m !== multiplier) return tableNum * m;
      }
      let attempts = 0, m = multiplier;
      while (m === multiplier && attempts++ < 200) m = Math.floor(Math.random() * 12) + 1;
      return tableNum * m;
    }

    // --- all spawn functions ---
    function spawnClassic() {
      items = []; foodSingle = null;
      const walls = buildWallsArray();
      const occupied = snake.slice();
      const p = getSafeFoodPosition(cols, rows, occupied, walls, 1, 1) || findFreeCell();
      foodSingle = { x: p.x, y: p.y, label: '●', correct: true };
      updateNextInfo();
    }
    function spawnPairNumbers() {
      items = []; foodSingle = null;
      const walls = buildWallsArray();
      const snakeCells = snake.slice();
      const c1 = getSafeFoodPosition(cols, rows, snakeCells, walls, 1, 1) || findFreeCell();
      const wrongNum = pickWrongNumber(currentTarget, 100);
      const occupied = snakeCells.concat([{ x: c1.x, y: c1.y }]);
      const c2 = getSafeFoodPosition(cols, rows, occupied, walls, 1, 1) || findFreeCell();
      items.push({ x: c1.x, y: c1.y, label: String(currentTarget), correct: true });
      items.push({ x: c2.x, y: c2.y, label: String(wrongNum), correct: false });
      updateNextInfo();
    }
    function spawnPairAlphabets() {
      items = []; foodSingle = null;
      const walls = buildWallsArray();
      const snakeCells = snake.slice();
      const idx = Math.max(0, Math.min(ALPHABET.length - 1, currentTarget - 1));
      const correctLetter = ALPHABET[idx];
      const c1 = getSafeFoodPosition(cols, rows, snakeCells, walls, 1, 1) || findFreeCell();
      const occupied = snakeCells.concat([{ x: c1.x, y: c1.y }]);
      const c2 = getSafeFoodPosition(cols, rows, occupied, walls, 1, 1) || findFreeCell();
      const wrongLetter = pickWrongAlphabet(idx);
      items.push({ x: c1.x, y: c1.y, label: correctLetter, correct: true });
      items.push({ x: c2.x, y: c2.y, label: wrongLetter, correct: false });
      updateNextInfo();
    }
    function spawnPairTables() {
      items = []; foodSingle = null;
      const walls = buildWallsArray();
      const snakeCells = snake.slice();
      const tableNum = parseInt(tableSelect.value, 10) || MIN_TABLE;
      const multiplier = Math.max(1, currentTarget);
      const correctVal = tableNum * multiplier;
      const c1 = getSafeFoodPosition(cols, rows, snakeCells, walls, 1, 1) || findFreeCell();
      const occupied = snakeCells.concat([{ x: c1.x, y: c1.y }]);
      const c2 = getSafeFoodPosition(cols, rows, occupied, walls, 1, 1) || findFreeCell();
      const wrongVal = pickWrongTableValue(tableNum, multiplier);
      items.push({ x: c1.x, y: c1.y, label: String(correctVal), correct: true });
      items.push({ x: c2.x, y: c2.y, label: String(wrongVal), correct: false });
      updateNextInfo();
    }

    function updateNextInfo() {
      if (!nextInfo) return;
      const mode = gameModeSelect ? gameModeSelect.value : 'classic';
      if (mode === 'numbers') nextInfo.textContent = 'Next: ' + currentTarget;
      else if (mode === 'alphabets') {
        const idx = Math.max(0, Math.min(ALPHABET.length - 1, currentTarget - 1));
        nextInfo.textContent = 'Next: ' + ALPHABET[idx];
      } else if (mode === 'times') {
        const t = parseInt(tableSelect.value, 10) || MIN_TABLE;
        nextInfo.textContent = 'Next: ' + t + ' × ' + Math.max(1, currentTarget) + ' = ' + (t * Math.max(1, currentTarget));
      } else nextInfo.textContent = '';
    }

    function draw() {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      drawFrame();
      // draw items
      for (const it of items) {
        ctx.fillStyle = it.correct ? '#00ccff' : '#ff9966';
        ctx.fillRect(cellToPixelX(it.x) + 2, cellToPixelY(it.y) + 2, GRID - 4, GRID - 4);
        ctx.fillStyle = '#000';
        ctx.font = '14px monospace';
        ctx.fillText(it.label, cellToPixelX(it.x) + 4, cellToPixelY(it.y) + 3);
      }
      if (foodSingle) {
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(cellToPixelX(foodSingle.x) + 2, cellToPixelY(foodSingle.y) + 2, GRID - 4, GRID - 4);
        ctx.fillStyle = '#000';
        ctx.font = '14px monospace';
        if (foodSingle.label) ctx.fillText(foodSingle.label, cellToPixelX(foodSingle.x) + 4, cellToPixelY(foodSingle.y) + 3);
      }
      ctx.fillStyle = '#2b9a59';
      for (let i = 0; i < snake.length; i++) {
        const s = snake[i];
        ctx.fillRect(cellToPixelX(s.x) + 1, cellToPixelY(s.y) + 1, GRID - 2, GRID - 2);
      }
      if (gameOver) drawGameOverOverlay();
    }
    function drawGameOverOverlay() {
      try {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,50,50,1)';
        const fontSize = Math.max(28, Math.floor(Math.min(w, h) * 0.06));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', w / 2, h / 2 - Math.max(8, fontSize * 0.25));
        ctx.font = `${Math.max(12, Math.floor(fontSize * 0.35))}px monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('Press Start to play again', w / 2, h / 2 + Math.max(28, fontSize * 0.6));
        ctx.restore();
      } catch (e) {}
    }

    function checkEat(head) {
      const mode = gameModeSelect ? gameModeSelect.value : 'classic';
      if (mode === 'classic') {
        if (foodSingle && head.x === foodSingle.x && head.y === foodSingle.y) {
          score += 10;
          showFeedback('Correct!', 'success', 900);
          updateScore();
          spawnClassic();
          return true;
        }
        return false;
      } else {
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it.x === head.x && it.y === head.y) {
            if (it.correct) {
              score += 10;
              showFeedback('Correct!', 'success', 900);
              if (mode === 'numbers') {
                currentTarget++;
                if (currentTarget > 100) { setStatus('Done!'); gameOver = true; stop(); }
                else spawnPairNumbers();
              } else if (mode === 'alphabets') {
                currentTarget++;
                if (currentTarget > ALPHABET.length) { setStatus('Done!'); gameOver = true; stop(); }
                else spawnPairAlphabets();
              } else if (mode === 'times') {
                currentTarget++;
                spawnPairTables();
              }
            } else {
              if (mode === 'numbers') showFeedback('Incorrect number!', 'error', 1400);
              else if (mode === 'alphabets') showFeedback('Incorrect letter!', 'error', 1400);
              else if (mode === 'times') showFeedback('Incorrect value!', 'error', 1400);
              score = Math.max(0, score - 5);
              if (mode === 'numbers') spawnPairNumbers();
              else if (mode === 'alphabets') spawnPairAlphabets();
              else if (mode === 'times') spawnPairTables();
            }
            updateScore();
            return true;
          }
        }
        return false;
      }
    }

    function step() {
      if (gameOver || paused) return;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const maxX = cols;
      const maxY = rows;
      if (WALL_MODE) {
        if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY) {
          gameOver = true;
          setStatus('Game Over');
          stop();
          draw();
          return;
        }
      } else {
        head.x = (head.x + maxX) % maxX;
        head.y = (head.y + maxY) % maxY;
      }
      snake.unshift(head);
      for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
          gameOver = true;
          setStatus('Game Over');
          stop();
          draw();
          return;
        }
      }
      const ate = checkEat(head);
      if (!ate) snake.pop();
      draw();
    }

    function setStatus(txt) { if (statusEl) statusEl.textContent = txt; }
    function updateScore() { if (scoreEl) scoreEl.textContent = String(score); updateNextInfo(); }

    // --- Actual backend save for login game ---
	async function saveScore() {
	  try {
	    const params = new URLSearchParams();
	    params.append('score', score);

	    // Correct subject value for all modes
	    let subject = '';
	    if (gameModeSelect) {
	      if (gameModeSelect.value === 'classic') subject = 'classic';
	      else if (gameModeSelect.value === 'numbers') subject = 'numbers';
	      else if (gameModeSelect.value === 'alphabets') subject = 'alphabets';
	      else if (gameModeSelect.value === 'times') {
	        subject = 'times-' + (tableSelect && tableSelect.value ? tableSelect.value : '2');
	      } else subject = gameModeSelect.value;
	    } else {
	      subject = 'classic';
	    }
	    params.append('subject', subject);

	    const res = await fetch('save-score', {
	      method: 'POST',
	      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
	      body: params.toString()
	    });

	    if (res.status === 401) {
	      showFeedback('Please login to save scores.', 'error', 3000);
	      return;
	    }
	    if (!res.ok) {
	      showFeedback('Error saving score', 'error', 2500);
	      return;
	    }
	    showFeedback('Score saved!', 'success', 1800);
	  } catch (e) {
	    showFeedback('Network error: could not save', 'error', 2500);
	  }
	}

	// Leaderboard button code
	document.addEventListener('DOMContentLoaded', () => {
	  const leaderboardBtn = document.getElementById('leaderboardBtn');
	  if (leaderboardBtn) {
	    leaderboardBtn.style.display = 'inline-block';
	    leaderboardBtn.addEventListener('click', () => {
	      window.location.href = 'leaderboard.html';
	    });
	  }
	});

    // Start, stop, reset game
    function start() {
      if (intervalId) clearInterval(intervalId);
      if (gameOver) resetGame();
      paused = false;
      intervalId = setInterval(step, TICK);
      setStatus('Running');
      if (pauseBtn) pauseBtn.textContent = 'Pause';
    }
    function stop() {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      setStatus(gameOver ? 'Game Over' : 'Paused');
    }
    function resetGame() {
      // cancel countdown if any
      cancelCountdown();

      resizeCanvasToFill();
      ctx = setupCanvasSize();
      cols = cellsAcross();
      rows = cellsDown();
      snake = [{ x: Math.max(1, Math.floor(cols / 2)), y: Math.max(1, Math.floor(rows / 2)) }];
      dir = { x: 1, y: 0 };
      score = 0; gameOver = false; paused = false; currentTarget = 1;
      items = []; foodSingle = null;
      const mode = gameModeSelect ? gameModeSelect.value : 'classic';
      if (mode === 'classic') spawnClassic();
      else if (mode === 'numbers') spawnPairNumbers();
      else if (mode === 'alphabets') spawnPairAlphabets();
      else if (mode === 'times') spawnPairTables();
      updateScore();
      draw();
      setStatus('Ready');
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      if (pauseBtn) pauseBtn.textContent = 'Pause';
    }

    // Countdown: use RAF to render countdown on canvas reliably
    function drawCountdownNumber(value) {
      try {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        ctx.save();
        // dim background lightly (overlay)
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, w, h);

        // big number
        const fs = Math.max(72, Math.floor(Math.min(w, h) * 0.18));
        ctx.font = `bold ${fs}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#bfffd6';
        ctx.shadowColor = 'rgba(0,255,51,0.9)';
        ctx.shadowBlur = 18;
        ctx.fillText(String(value), w / 2, h / 2);
        ctx.restore();
      } catch (e) { /* ignore */ }
    }

    function startWithCountdown() {
      if (intervalId) return;
      if (countdownRunning) return;
      if (gameOver) resetGame();

      countdownRunning = true;
      countdownEndTs = Date.now() + COUNTDOWN_START * COUNTDOWN_STEP_MS;
      setStatus('Get Ready');

      if (rafId) cancelAnimationFrame(rafId);
      (function rafLoop() {
        draw(); // draw board underneath
        const remainingMs = Math.max(0, countdownEndTs - Date.now());
        const ticksRemaining = Math.ceil(remainingMs / COUNTDOWN_STEP_MS);
        if (ticksRemaining <= 0) {
          countdownRunning = false;
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
          paused = false;
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(step, TICK);
          setStatus('Running');
          if (pauseBtn) pauseBtn.textContent = 'Pause';
          draw();
          return;
        } else {
          drawCountdownNumber(ticksRemaining);
          rafId = requestAnimationFrame(rafLoop);
        }
      })();
    }

    function cancelCountdown() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      countdownRunning = false;
      countdownEndTs = 0;
      draw();
    }

    // Controls
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && dir.x !== 1) dir = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && dir.x !== -1) dir = { x: 1, y: 0 };
      if (e.key === 'ArrowUp' && dir.y !== 1) dir = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && dir.y !== -1) dir = { x: 0, y: 1 };
    });

    if (startBtn) startBtn.addEventListener('click', startWithCountdown);

    if (pauseBtn) pauseBtn.addEventListener('click', () => {
      // If countdown running, cancel it and mark paused
      if (countdownRunning) {
        cancelCountdown();
        paused = true;
        setStatus('Paused');
        pauseBtn.textContent = 'Resume';
        return;
      }

      paused = !paused;
      if (paused) {
        stop();
        pauseBtn.textContent = 'Resume';
      } else {
        // resume
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(step, TICK);
        setStatus('Running');
        pauseBtn.textContent = 'Pause';
      }
    });

    if (resetBtn) resetBtn.addEventListener('click', () => { cancelCountdown(); resetGame(); });
    if (saveBtn) saveBtn.addEventListener('click', saveScore);

    // Time table dropdown options populate (same logic as demo)
    (function populateTableOptions() {
      if (!tableSelect) return;
      tableSelect.innerHTML = '';
      for (let n = MIN_TABLE; n <= MAX_TABLE; n++) {
        const opt = document.createElement('option');
        opt.value = String(n);
        opt.textContent = String(n);
        tableSelect.appendChild(opt);
      }
    })();

    // Mode switch (show/hide tableSelect just like demo!)
    function updateModeUI() {
      const mode = gameModeSelect ? gameModeSelect.value : 'classic';
      if (tableSelect) tableSelect.style.display = (mode === 'times') ? 'inline-block' : 'none';
      currentTarget = 1;
      cancelCountdown();
      resetGame();
    }
    if (gameModeSelect) gameModeSelect.addEventListener('change', updateModeUI);
    if (tableSelect) tableSelect.addEventListener('change', () => { currentTarget = 1; cancelCountdown(); resetGame(); });

    window.addEventListener('resize', () => {
      resizeCanvasToFill();
      ctx = setupCanvasSize();
      draw();
    });

    // Initial setup
    updateModeUI();
    resetGame();

    window.Back2Nokia = {
      start, stop, resetGame,
      getState: () => ({ score, gameOver, snakeLen: snake.length, currentTarget, mode: (gameModeSelect && gameModeSelect.value) || 'classic' })
    };
  });
})();

// Leaderboard btn [yahan sirf redirect karo, toast mat dikhana!]
document.addEventListener('DOMContentLoaded', () => {
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  if (leaderboardBtn) {
    leaderboardBtn.style.display = 'inline-block';
    leaderboardBtn.addEventListener('click', () => {
      window.location.href = 'leaderboard.html'; // ya '/leaderboard' as per your routing
    });
  }
});