/* MJ Server Kit 고객 안내서 — 페이지 공통 동작 (외부 자원 없음) */
(function () {
  'use strict';
  var KEY = 'mjkit-guide-progress-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* 저장 안 함 */ } }
  var state = load();
  var checks = Array.prototype.slice.call(document.querySelectorAll('.step-check'));
  function holder(c) { return c.closest('li, .read-check'); }

  /* 이 페이지 목차의 절별 진행 (3/5) */
  function sectionProgress() {
    document.querySelectorAll('[data-progress]').forEach(function (el) {
      var sec = document.getElementById(el.getAttribute('data-progress'));
      var all = sec ? sec.querySelectorAll('.step-check') : [];
      if (!all.length) { el.textContent = ''; return; }
      var n = 0;
      all.forEach(function (c) { if (c.checked) n++; });
      el.textContent = n + '/' + all.length;
      el.classList.toggle('done', n === all.length);
    });
  }
  /* 페이지별 완료 (진행 표시·첫 화면 버튼) — 다른 페이지 단계는 저장된 값으로 셈 */
  function pageProgress() {
    document.querySelectorAll('[data-steps]').forEach(function (el) {
      var ids = (el.getAttribute('data-steps') || '').split(',').filter(Boolean);
      var out = el.querySelector('.page-progress');
      if (!ids.length || !out) return;
      var n = ids.filter(function (id) { return state[id]; }).length;
      var done = n === ids.length;
      el.classList.toggle('done', done);
      out.textContent = done ? '✅' : (n ? n + '/' + ids.length : '');
      out.setAttribute('aria-label', done ? '완료' : n + '/' + ids.length);
    });
  }
  function refresh() { sectionProgress(); pageProgress(); }

  checks.forEach(function (c) {
    var id = c.getAttribute('data-step');
    c.checked = !!state[id];
    if (holder(c)) holder(c).classList.toggle('done', c.checked);
    c.addEventListener('change', function () {
      if (c.checked) state[id] = 1; else delete state[id];
      if (holder(c)) holder(c).classList.toggle('done', c.checked);
      save(state);
      refresh();
    });
  });
  document.querySelectorAll('[data-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      state = {};
      save(state);
      checks.forEach(function (c) { c.checked = false; if (holder(c)) holder(c).classList.remove('done'); });
      refresh();
    });
  });
  refresh();

  /* 복사 버튼 */
  function fallbackCopy(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(t);
    return ok;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.copy');
    if (!b) return;
    e.preventDefault();
    var text = b.getAttribute('data-copy');
    function done() {
      b.textContent = '복사됨'; b.classList.add('copied');
      setTimeout(function () { b.textContent = '복사'; b.classList.remove('copied'); }, 1500);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { if (fallbackCopy(text)) done(); });
    } else if (fallbackCopy(text)) { done(); }
  });

  /* 목차: 휴대폰에서는 접어 두고, 항목을 누르면 닫힘 */
  var toc = document.getElementById('toc');
  var mq = window.matchMedia('(max-width: 860px)');
  if (toc) {
    var syncToc = function () { if (mq.matches) toc.removeAttribute('open'); else toc.setAttribute('open', ''); };
    syncToc();
    if (mq.addEventListener) mq.addEventListener('change', syncToc);
    toc.addEventListener('click', function (e) { if (e.target.closest('a') && mq.matches) toc.removeAttribute('open'); });
  }

  /* 지금 읽는 절 표시 */
  var items = {};
  document.querySelectorAll('[data-toc]').forEach(function (li) { items[li.getAttribute('data-toc')] = li; });
  var sections = Array.prototype.slice.call(document.querySelectorAll('section.chapter'));
  var current = null;
  function onScroll() {
    if (!sections.length) return;
    var y = window.innerHeight * 0.3, id = sections[0].id;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= y) id = s.id; });
    if (id === current) return;
    current = id;
    Object.keys(items).forEach(function (k) { items[k].classList.toggle('active', k === id); });
    if (items[id] && !mq.matches) items[id].scrollIntoView({ block: 'nearest' });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 인쇄: 접힌 설명을 모두 펼쳐서 인쇄하고, 끝나면 원래대로 */
  var reopened = [];
  window.addEventListener('beforeprint', function () {
    reopened = Array.prototype.slice.call(document.querySelectorAll('details.more:not([open])'));
    reopened.forEach(function (d) { d.setAttribute('open', ''); });
    /* 접힌 곳의 사진도 인쇄되게: 늦게 불러오기를 끔 */
    Array.prototype.forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (img) { img.loading = 'eager'; });
  });
  window.addEventListener('afterprint', function () {
    reopened.forEach(function (d) { d.removeAttribute('open'); });
    reopened = [];
  });
})();
