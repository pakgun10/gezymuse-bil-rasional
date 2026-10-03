/* Simulasi alur game Laju Perubahan ujung-ke-ujung dengan DOM tiruan (Node). */
'use strict';
var vm = require('vm');
var fs = require('fs');

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
  /* tiru perilaku browser: innerHTML='' menghapus isi elemen */
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
global.setInterval = function () { return 1; }; /* timer dinonaktifkan utk simulasi */
global.clearInterval = function () {};

function load(f) {
  vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
}
load('js/questions.js');
load('js/audio.js');

/* tangkap bank soal yg dipakai game */
var captured = null;
var _gq = genQuestions;
genQuestions = function (id) { captured = _gq(id); return captured; };
load('js/game.js');

var fails = 0;
function assert(c, msg) {
  if (!c) { fails++; console.log('GAGAL: ' + msg); }
}
function el(id) { return elements[id]; }

/* ---------- alur: start -> level 1 -> jawab semua benar ---------- */
el('btn-start').click();
assert(el('level-grid').children.length === 5, '5 kartu level tampil');
assert(el('level-grid').children[1].className.indexOf('locked') !== -1, 'level 2 terkunci');
el('level-grid').children[0].click(); /* mulai level 1 */

var answered = 0;
var COUNT = require('./js/questions.js').LEVELS[0].count;
for (var i = 0; i < COUNT; i++) {
  var prompt = el('q-prompt').innerHTML;
  assert(prompt.length > 10, 'soal ' + (i + 1) + ' tampil: ' + prompt.slice(0, 40));
  var qs = captured.filter(function (q) { return q.prompt === prompt; });
  assert(qs.length === 1, 'soal cocok dgn bank soal');
  var q = qs[0];
  var choices = el('q-choices').children;
  assert(choices.length === 4, '4 tombol jawaban');
  choices[q.answer].click();
  assert(el('fb-title').textContent.indexOf('Benar') !== -1, 'umpan balik Benar utk soal ' + (i + 1));
  assert(el('fb-explain').innerHTML.indexOf('Pembahasan') !== -1, 'pembahasan tampil');
  answered++;
  el('btn-next').click();
}
assert(answered === COUNT, COUNT + ' soal terjawab');
assert(el('res-title').textContent.indexOf('Lolos') !== -1, 'layar hasil: lolos (' + el('res-title').textContent + ')');
assert(el('hud-lives').textContent === '❤️❤️❤️', 'nyawa utuh setelah semua benar');

/* ---------- jawaban salah mengurangi nyawa ---------- */
el('btn-retry').click(); /* ulangi level 1 */
var prompt2 = el('q-prompt').innerHTML;
var q2 = captured.filter(function (q) { return q.prompt === prompt2; })[0];
el('q-choices').children[(q2.answer + 1) % 4].click();
assert(el('fb-title').textContent.indexOf('Kurang tepat') !== -1, 'umpan balik salah');
assert(el('hud-lives').textContent === '❤️❤️🖤', 'nyawa berkurang 1 (dapat: ' + el('hud-lives').textContent + ')');

/* ---------- progres tersimpan ---------- */
var saved = JSON.parse(store['lajuPerubahan'] || '{}');
assert(saved.unlocked >= 2, 'level 2 terbuka setelah lolos (unlocked=' + saved.unlocked + ')');

console.log(fails === 0 ? 'SIMULASI OK: semua alur game berjalan.' : 'SIMULASI: ' + fails + ' kegagalan.');
process.exit(fails ? 1 : 0);
