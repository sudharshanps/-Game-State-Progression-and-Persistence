(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PacketPulseCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const STATES = Object.freeze({ READY:'ready', PLAYING:'playing', PAUSED:'paused', WON:'won', LOST:'lost', RESTARTING:'restarting' });
  const TRANSITIONS = Object.freeze({
    ready:['playing'],
    playing:['paused','won','lost','restarting'],
    paused:['playing','restarting'],
    won:['restarting'],
    lost:['restarting'],
    restarting:['playing']
  });
  const DIFFICULTIES = Object.freeze({
    easy:Object.freeze({label:'Easy', lives:8, baseSpeed:160}),
    normal:Object.freeze({label:'Normal', lives:6, baseSpeed:205}),
    hard:Object.freeze({label:'Hard', lives:4, baseSpeed:250})
  });
  const GAME_SECONDS = 180;
  const TARGET_MATCHES = 30;
  const LEVEL_STEP = 8;
  const MAX_LEVEL = 5;
  const STORAGE_KEY = 'packet-pulse-v2-prefs';
  function nextPhase(current, wanted) {
    return TRANSITIONS[current]?.includes(wanted) ? wanted : current;
  }
  function levelForHits(hits) {
    return Math.min(MAX_LEVEL, 1 + Math.floor(Math.max(0, Number(hits) || 0) / LEVEL_STEP));
  }
  function speedFor(level, difficulty) {
    return DIFFICULTIES[difficulty || 'normal']?.baseSpeed + (Math.max(1, Math.min(MAX_LEVEL, level)) - 1) * 28 || DIFFICULTIES.normal.baseSpeed;
  }
  function safePrefs(candidate) {
    const data = candidate && typeof candidate === 'object' ? candidate : {};
    const difficulty = Object.hasOwn(DIFFICULTIES, data.difficulty) ? data.difficulty : 'normal';
    const n = Number(data.bestScore);
    const bestScore = Number.isSafeInteger(n) && n >= 0 && n <= 1000000 ? n : 0;
    return {difficulty, bestScore};
  }
  function createRun(difficulty) {
    const key = Object.hasOwn(DIFFICULTIES, difficulty) ? difficulty : 'normal';
    return {phase:STATES.READY, time:GAME_SECONDS, hits:0, misses:0,
      lives:DIFFICULTIES[key].lives, score:0, streak:0, level:1, difficulty:key,
      mode:'ALLOW', packet:null, nextSpawn:0.65, feedbackTimer:0,
      lastFrame:0, lastUi:0, lastKind:null, repeat:0};
  }
  function handlePacket(run, type) {
    if (run.phase !== STATES.PLAYING || !['SAFE','THREAT'].includes(type)) return false;
    const correct = run.mode === (type === 'SAFE' ? 'ALLOW' : 'BLOCK');
    if (correct) {
      run.hits++;
      run.streak++;
      run.score += 10;
      run.level = levelForHits(run.hits);
    } else {
      run.misses++;
      run.streak = 0;
      run.lives = Math.max(0, run.lives - 1);
    }
    return correct;
  }
  function resultAtTimeout(run) {
    return run.hits >= TARGET_MATCHES && run.lives > 0 ? STATES.WON : STATES.LOST;
  }
  return {STATES, TRANSITIONS, DIFFICULTIES, GAME_SECONDS, TARGET_MATCHES, LEVEL_STEP, MAX_LEVEL, STORAGE_KEY,
    nextPhase, levelForHits, speedFor, safePrefs, createRun, handlePacket, resultAtTimeout};
});
