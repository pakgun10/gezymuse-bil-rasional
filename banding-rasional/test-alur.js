/* Simulasi alur Banding Rasional ujung-ke-ujung dengan DOM tiruan (Node). */
'use strict';
var vm = require('vm');
var fs = require('fs');

var elements = {};
function makeEl(id) {
  var _html = '';
  var e = {
    id: id, textContent: '', disabled: false, style: {}, _a: {}, _cls: {},
    classList: {
      add: function (c) { e._cls[c] = true; },
      remove: function (c) { delete e._cls[c]; },
      toggle: function (c, f) { if (f) e._cls[c] = true; else delete e._cls[c]; }
    },
    children: [],
    appendChild: function (c) { this.children.push(c); return c; },
    setAttribute: function (k, v) { this._a[k] = v; },
    getAttribute: function (k) { return this._a[k]; },
    addEventListener: function (t, f) { (this._h = this._h || {})[t] = f; },
    click: function () { if (this._h && this._h.click) this._h.click(); }
  };
  Object.defineProperty(e, 'innerHTML', {
    get: function () { return _html; },
    set: function (v) { _html = String(v); this.children = []; }
  });
  return e;
}
global.window = { scrollTo: function () {} };
global.document = {
  getElementById: function (id) { return elements[id] || (elements[id] = makeEl(id)); },
  createElement: function () { return makeEl('dyn'); },
  addEventListener: function () {}
};
var store = {};
global.localStorage = {
  getItem: function (k) { return k in store ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); }
};
global.setInterval = function () { return 1; };
global.clearInterval = function () {};

function load(f) { vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f }); }
load('js/cards.js');
load('js/audio.js');
var captured = null;
var _g = genLevelPuzzles;
genLevelPuzzles = function (id) { captured = _g(id); return captured; };
load('js/game.js');

var fails = 0;
function assert(c, msg) { if (!c) { fails++; console.log('GAGAL: ' + msg); } }
function el(id) { return elements[id]; }
function cmp(a, b) { return a.n * b.d - b.n * a.d; }

/* tap kartu lalu slot */
function placeCard(cid, slotIdx) {
  var hb = el('hand').children.filter(function (b) { return b.getAttribute('data-cid') === cid; })[0];
  assert(hb, 'kartu ' + cid + ' ada di tangan');
  hb.click();
  el('slots').children[slotIdx].click();
}

/* ---------- level 1: jawab 6 puzzle dengan benar ---------- */
el('btn-start').click();
assert(el('level-grid').children.length === 5, '5 kartu level');
el('level-grid').children[0].click();

var correctCount = 0;
for (var i = 0; i < 6; i++) {
  var p = captured[i];
  var sorted = p.cards.slice().sort(cmp);
  sorted.forEach(function (card, si) { placeCard(card.cid, si); });
  el('btn-check').click();
  if (el('fb-title').textContent.indexOf('Tepat') !== -1) correctCount++;
  else console.log('  info puzzle ' + (i + 1) + ': ' + el('fb-title').textContent);
  el('btn-next').click();
}
assert(correctCount === 6, '6 puzzle benar (' + correctCount + ')');
assert(el('res-title').textContent.indexOf('Lolos') !== -1, 'lolos level 1');
assert(el('hud-lives').textContent === '❤️❤️❤️', 'nyawa utuh');

/* ---------- jawaban salah: susun terbalik ---------- */
el('btn-retry').click();
var p0 = captured[0];
var rev = p0.cards.slice().sort(function (a, b) { return cmp(b, a); });
rev.forEach(function (card, si) { placeCard(card.cid, si); });
el('btn-check').click();
assert(el('fb-title').textContent.indexOf('Belum tepat') !== -1, 'umpan balik salah');
assert(el('hud-lives').textContent === '❤️❤️🖤', 'nyawa berkurang');
var marked = el('slots').children.filter(function (b) { return b.className.indexOf('wrongmark') !== -1; });
assert(marked.length === 2, '2 slot ditandai merah (dapat ' + marked.length + ')');

/* ---------- progres tersimpan ---------- */
var saved = JSON.parse(store['bandingRasional'] || '{}');
assert(saved.unlocked >= 2, 'level 2 terbuka (unlocked=' + saved.unlocked + ')');

console.log(fails === 0 ? 'SIMULASI OK: semua alur game berjalan.' : 'SIMULASI: ' + fails + ' kegagalan.');
process.exit(fails ? 1 : 0);
