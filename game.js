(() => {
  'use strict';
  const core = window.PacketPulseCore;
  const $ = id => document.getElementById(id);
  const ui = {
    field:$('field'), time:$('time'), hits:$('hits'), lives:$('lives'), mode:$('mode'),
    flow:$('flowStatus'), container:$('packetContainer'), feedback:$('feedback'), target:$('target'),
    gateLabel:$('gateLabel'), overlay:$('overlay'), overlayTitle:$('overlayTitle'),
    overlayText:$('overlayText'), overlayIcon:$('overlayIcon'), overlayRules:$('overlayRules'),
    start:$('startButton'), toggle:$('toggleButton'), pause:$('pauseButton'), restart:$('restartButton'),
    score:$('scoreText'), level:$('level'), progress:$('progressFill'), nextLevel:$('nextLevel'),
    difficulty:$('difficultySelect'), best:$('bestScore'), saveStatus:$('saveStatus')
  };
  const readSaved = () => {
    try { return core.safePrefs(JSON.parse(localStorage.getItem(core.STORAGE_KEY) || '{}')); }
    catch (_) { return core.safePrefs(null); }
  };
  const prefs = readSaved();
  let run = core.createRun(prefs.difficulty);
  let storageReady = true;
  let feedbackTimeout = 0;

  function savePrefs() {
    try {
      localStorage.setItem(core.STORAGE_KEY, JSON.stringify(prefs));
      storageReady = true;
    } catch (_) { storageReady = false; }
    ui.saveStatus.textContent = storageReady ? 'Difficulty and best score are saved on this device.'
      : 'Browser storage is disabled; settings are kept only until this tab closes.';
  }
  function clearPacket() { if (run.packet?.node) run.packet.node.remove(); run.packet = null; }
  function setPhase(next) {
    const value = core.nextPhase(run.phase, next);
    if (value === run.phase) return false;
    run.phase = value;
    return true;
  }
  function updateUI() {
    const sec = Math.ceil(Math.max(0, run.time));
    ui.time.textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
    ui.hits.textContent = `${run.hits} / ${core.TARGET_MATCHES}`;
    ui.lives.textContent = '♥ '.repeat(run.lives).trim() || '—';
    ui.lives.setAttribute('aria-label', `${run.lives} lives`);
    ui.mode.textContent = run.mode;
    ui.mode.style.color = run.mode === 'ALLOW' ? 'var(--cyan)' : 'var(--amber)';
    ui.target.classList.toggle('block', run.mode === 'BLOCK');
    ui.target.querySelector('.symbol').textContent = run.mode === 'ALLOW' ? '✓' : '✕';
    ui.gateLabel.textContent = run.mode === 'ALLOW' ? 'ALLOW SAFE' : 'BLOCK THREAT';
    ui.score.textContent = `Score: ${run.score} · Streak: ${run.streak}`;
    ui.level.textContent = String(run.level);
    const levelProgress = run.level >= core.MAX_LEVEL ? 100 : (run.hits % core.LEVEL_STEP) / core.LEVEL_STEP * 100;
    ui.progress.style.width = `${levelProgress}%`;
    ui.progress.parentElement.setAttribute('aria-valuenow', String(Math.floor(levelProgress)));
    ui.nextLevel.textContent = run.level >= core.MAX_LEVEL ? 'Maximum level reached' : `${core.LEVEL_STEP - run.hits % core.LEVEL_STEP} matches to next level`;
    ui.best.textContent = String(prefs.bestScore);
    ui.difficulty.value = prefs.difficulty;
    ui.difficulty.disabled = ![core.STATES.READY,core.STATES.WON,core.STATES.LOST].includes(run.phase);
    ui.toggle.disabled = run.phase !== core.STATES.PLAYING;
    ui.pause.disabled = ![core.STATES.PLAYING,core.STATES.PAUSED].includes(run.phase);
    ui.restart.disabled = run.phase === core.STATES.READY;
    ui.pause.textContent = run.phase === core.STATES.PAUSED ? 'Resume game (P)' : 'Pause game (P)';
    ui.flow.textContent = '● ' + run.phase.toUpperCase();
    ui.field.setAttribute('data-phase',run.phase);
  }
  function showOverlay(title, body, button, icon, rules='') {
    ui.overlay.hidden = false;
    ui.overlayTitle.textContent = title;
    ui.overlayText.textContent = body;
    ui.start.textContent = button;
    ui.overlayIcon.textContent = icon;
    ui.overlayRules.hidden = !rules;
    ui.overlayRules.textContent = rules;
  }
  function hideOverlay() { ui.overlay.hidden = true; }
  function freshRun() {
    clearPacket();
    run = core.createRun(prefs.difficulty);
    ui.feedback.className = 'feedback';
    run.lastFrame = performance.now();
    run.lastUi = run.lastFrame;
  }
  function begin() {
    if (run.phase === core.STATES.PAUSED) { resume(); return; }
    if (run.phase === core.STATES.READY) {
      freshRun();
      setPhase(core.STATES.PLAYING);
    } else if ([core.STATES.WON, core.STATES.LOST].includes(run.phase)) {
      restart(); return;
    } else return;
    hideOverlay(); updateUI(); ui.field.focus({preventScroll:true});
  }
  function restart() {
    if (run.phase === core.STATES.READY || run.phase === core.STATES.RESTARTING) return;
    if (!setPhase(core.STATES.RESTARTING)) return;
    freshRun();
    run.phase = core.STATES.RESTARTING;
    setPhase(core.STATES.PLAYING);
    hideOverlay(); updateUI(); ui.field.focus({preventScroll:true});
  }
  function toggle() {
    if (run.phase !== core.STATES.PLAYING) return;
    run.mode = run.mode === 'ALLOW' ? 'BLOCK' : 'ALLOW'; updateUI();
  }
  function pause() {
    if (!setPhase(core.STATES.PAUSED)) return;
    showOverlay('Mission paused', 'The timer and all packets are frozen. Resume when ready.', 'Resume mission →', 'Ⅱ', 'Press P to resume or use the button. Restart starts a fresh run.');
    updateUI();
  }
  function resume() {
    if (!setPhase(core.STATES.PLAYING)) return;
    run.lastFrame = performance.now();
    hideOverlay(); updateUI(); ui.field.focus({preventScroll:true});
  }
  function finish(phase, reason) {
    if (![core.STATES.WON,core.STATES.LOST].includes(phase) || !setPhase(phase)) return;
    clearPacket();
    const isRecord = run.score > prefs.bestScore;
    if (isRecord) { prefs.bestScore = run.score; savePrefs(); }
    showOverlay(phase === core.STATES.WON ? 'Network secured!' : 'Mission ended',
      `${reason} Correct: ${run.hits} · Score: ${run.score}.${isRecord ? ' NEW HIGH SCORE!' : ''}`,
      'Play again →', phase === core.STATES.WON ? '★' : '!');
    updateUI();
  }
  function spawn() {
    let type = Math.random() < .5 ? 'SAFE' : 'THREAT';
    if (type === run.lastKind) { run.repeat++; if (run.repeat >= 3) { type = type === 'SAFE' ? 'THREAT' : 'SAFE'; run.repeat = 0; } }
    else run.repeat = 0;
    run.lastKind = type;
    const node = document.createElement('div');
    node.className = 'packet' + (type === 'THREAT' ? ' threat' : '');
    node.innerHTML = `<span class="symbol" aria-hidden="true">${type === 'SAFE' ? '✓' : '✕'}</span><span>${type}</span>`;
    ui.container.appendChild(node);
    run.packet = {type, node, y:-45, speed:core.speedFor(run.level,prefs.difficulty)};
  }
  function resolvePacket() {
    if (run.phase !== core.STATES.PLAYING || !run.packet) return;
    const type = run.packet.type;
    const previousLevel = run.level;
    const correct = core.handlePacket(run,type);
    ui.feedback.textContent = correct ? `+10 · ${type} handled${previousLevel !== run.level ? ' · LEVEL UP!' : ''}` : `−1 life · ${type} mishandled`;
    ui.feedback.className = 'feedback visible ' + (correct ? 'good' : 'bad');
    feedbackTimeout = 1;
    clearPacket();
    run.nextSpawn = Math.max(.22,.65 - (run.level - 1) * .09);
    if (run.lives === 0) finish(core.STATES.LOST,'The gateway ran out of lives.');
    updateUI();
  }
  function frame(now) {
    const dt = Math.min(Math.max((now - (run.lastFrame || now)) / 1000,0), .06);
    run.lastFrame = now;
    if (run.phase === core.STATES.PLAYING) {
      run.time = Math.max(0,run.time - dt);
      if (feedbackTimeout > 0) { feedbackTimeout -= dt; if (feedbackTimeout <= 0) ui.feedback.classList.remove('visible'); }
      if (run.time === 0) {
        const outcome = core.resultAtTimeout(run);
        finish(outcome, outcome === core.STATES.WON ? 'You met the 30-match target and survived all 3 minutes.' : 'You did not reach 30 matches before time ran out.');
      } else if (run.packet) {
        run.packet.y += run.packet.speed * dt;
        run.packet.node.style.transform = `translate(-50%, ${run.packet.y}px)`;
        if (run.packet.y >= ui.field.clientHeight - 118) resolvePacket();
      } else {
        run.nextSpawn -= dt;
        if (run.nextSpawn <= 0) spawn();
      }
      if (now - run.lastUi > 120) { updateUI(); run.lastUi = now; }
    }
    requestAnimationFrame(frame);
  }
  ui.start.addEventListener('click', begin);
  ui.toggle.addEventListener('click',toggle);
  ui.pause.addEventListener('click', () => run.phase === core.STATES.PAUSED ? resume() : pause());
  ui.restart.addEventListener('click',restart);
  ui.field.addEventListener('click',e => { if (!e.target.closest('button')) toggle(); });
  ui.difficulty.addEventListener('change',e => {
    if (![core.STATES.READY,core.STATES.WON,core.STATES.LOST].includes(run.phase)) return;
    prefs.difficulty = core.safePrefs({difficulty:e.target.value,bestScore:prefs.bestScore}).difficulty;
    if (run.phase === core.STATES.READY) freshRun();
    savePrefs(); updateUI();
  });
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
    const key = e.key.toLowerCase();
    if (e.code === 'Space') { if (document.activeElement?.tagName === 'BUTTON') return; e.preventDefault(); toggle(); }
    else if (key === 'p') { e.preventDefault(); run.phase === core.STATES.PAUSED ? resume() : pause(); }
    else if (key === 'r') { e.preventDefault(); restart(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && run.phase === core.STATES.PLAYING) pause();
    run.lastFrame = performance.now();
  });
  savePrefs(); updateUI(); requestAnimationFrame(frame);
})();
