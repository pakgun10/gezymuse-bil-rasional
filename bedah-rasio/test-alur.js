/* Simulasi alur Bedah Rasio ujung-ke-ujung dengan DOM tiruan (Node). */
'use strict';
var vm = require('vm');
var fs = require('fs');
var D = require('./js/data.js');

/* ---------- stub DOM ---------- */
var elements = {};
function makeEl(id) {
  var _html = '';
  var e = {
    id: id, textContent: '', disabled: false, style: {},
    classList: {
      add: function () {}, remove: function () {}, toggle: function () {}
    },
    children: [],
    appendChild: function (c) { this.children.push(c); return c; },
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

function load(f) {
  vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
}
load('js/data.js');
load('js/audio.js');
load('js/game.js');

var fails = 0;
function assert(c, msg) {
  if (!c) { fails++; console.log('GAGAL: ' + msg); }
}
function el(id) { return elements[id]; }

function findLabItem() {
  var ctx = el('p-context').textContent;
  return D.LAB_ITEMS.filter(function (it) { return it.ctx === ctx; })[0];
}
function findArenaItem() {
  var ctx = el('p-context').textContent;
  return D.ARENA_ITEMS.filter(function (it) { return it.ctx === ctx; })[0];
}
function playThrough(mode) {
  var n = mode === 'lab' ? 8 : 8;
  for (var i = 0; i < n; i++) {
    var it = mode === 'lab' ? findLabItem() : findArenaItem();
    assert(it, mode + ' soal ' + (i + 1) + ' dikenali');
    var correctIdx = mode === 'lab' ? D.labAnswerIndex(it) : D.arenaAnswerIndex(it);
    var choices = el('p-choices').children;
    assert(choices.length === 3, mode + ': 3 tombol pilihan');
    choices[correctIdx].click();
    assert(el('fb-title').textContent.indexOf('Tepat') !== -1,
      mode + ' soal ' + (i + 1) + ': umpan balik tepat');
    assert(el('fb-explain').innerHTML.indexOf('Pembahasan') !== -1,
      mode + ' soal ' + (i + 1) + ': pembahasan tampil');
    el('btn-next').click();
  }
}

/* ---------- alur: Lab ---------- */
assert(el('stars-lab').textContent === '☆☆☆', 'bintang lab awal kosong');
el('btn-lab').click();
playThrough('lab');
assert(el('done-title').textContent.indexOf('Selesai') !== -1, 'lab: layar selesai');
assert(el('done-stats').innerHTML.indexOf('8 / 8') !== -1, 'lab: skor 8/8');
var saved = JSON.parse(store['bedahRasio'] || '{}');
assert(saved.lab === 3, 'lab: 3 bintang tersimpan (dapat ' + saved.lab + ')');

/* ---------- jawaban salah ---------- */
el('btn-done-retry').click();
var it0 = findLabItem();
var wrongIdx = (D.labAnswerIndex(it0) + 1) % 3;
el('p-choices').children[wrongIdx].click();
assert(el('fb-title').textContent.indexOf('Kurang tepat') !== -1, 'lab: umpan balik salah');
el('btn-back-start').click();

/* ---------- alur: Arena ---------- */
el('btn-arena').click();
playThrough('arena');
assert(el('done-title').textContent.indexOf('Selesai') !== -1, 'arena: layar selesai');
saved = JSON.parse(store['bedahRasio'] || '{}');
assert(saved.arena === 3, 'arena: 3 bintang tersimpan');

el('btn-done-modes').click();
assert(el('stars-lab').textContent === '★★★', 'bintang lab tampil di awal');
assert(el('stars-arena').textContent === '★★★', 'bintang arena tampil di awal');
assert(el('konsep-lab').innerHTML.length > 50, 'konsep lab terisi');
assert(el('konsep-arena').innerHTML.length > 50, 'konsep arena terisi');

console.log(fails === 0 ? 'SIMULASI OK: semua alur Bedah Rasio berjalan.' : 'SIMULASI: ' + fails + ' kegagalan.');
process.exit(fails ? 1 : 0);
