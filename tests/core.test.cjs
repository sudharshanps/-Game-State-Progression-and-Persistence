const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../core.js');

test('ready, play, pause, resume, restart are guarded', () => {
  assert.equal(G.nextPhase('ready','playing'),'playing');
  assert.equal(G.nextPhase('ready','paused'),'ready');
  assert.equal(G.nextPhase('playing','paused'),'paused');
  assert.equal(G.nextPhase('paused','playing'),'playing');
  assert.equal(G.nextPhase('paused','restarting'),'restarting');
  assert.equal(G.nextPhase('restarting','playing'),'playing');
  assert.equal(G.nextPhase('lost','paused'),'lost');
  assert.equal(G.nextPhase('won','restarting'),'restarting');
});
test('valid win and loss edges', () => {
  const run = G.createRun('normal'); run.phase = 'playing';
  run.hits = 29; assert.equal(G.resultAtTimeout(run),'lost');
  run.hits = 30; assert.equal(G.resultAtTimeout(run),'won');
  run.lives = 0; assert.equal(G.resultAtTimeout(run),'lost');
});
test('scoring requires playing state and correct packet', () => {
  const run = G.createRun('normal');
  assert.equal(G.handlePacket(run,'SAFE'),false);
  assert.equal(run.hits,0);
  run.phase = 'playing';
  assert.equal(G.handlePacket(run,'SAFE'),true);
  assert.equal(run.score,10); assert.equal(run.hits,1);
  run.mode = 'BLOCK';
  assert.equal(G.handlePacket(run,'SAFE'),false);
  assert.equal(run.lives,5); assert.equal(run.streak,0);
  assert.equal(G.handlePacket(run,'INVALID'),false);
  assert.equal(run.misses,1);
});
test('progression at exact 8-match boundaries and capped level', () => {
  for (const [hits,level] of [[0,1],[7,1],[8,2],[15,2],[16,3],[24,4],[32,5],[100,5]])
    assert.equal(G.levelForHits(hits),level);
  assert.ok(G.speedFor(5,'hard') > G.speedFor(1,'hard'));
  assert.ok(G.speedFor(1,'easy') < G.speedFor(1,'normal'));
});
test('restart recreates run counters, retains preferences separately', () => {
  const saved = G.safePrefs({difficulty:'hard',bestScore:280});
  const run = G.createRun(saved.difficulty);
  assert.equal(run.score,0); assert.equal(run.phase,'ready');
  assert.equal(run.lives,4); assert.equal(saved.bestScore,280);
});
test('invalid/corrupt storage values use safe defaults', () => {
  assert.deepEqual(G.safePrefs(null),{difficulty:'normal',bestScore:0});
  assert.deepEqual(G.safePrefs({difficulty:'invalid',bestScore:-3}),{difficulty:'normal',bestScore:0});
  assert.deepEqual(G.safePrefs({difficulty:'easy',bestScore:'240'}),{difficulty:'easy',bestScore:240});
  assert.deepEqual(G.safePrefs({difficulty:'hard',bestScore:Infinity}),{difficulty:'hard',bestScore:0});
});
