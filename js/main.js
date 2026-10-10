import { loadAssets, buildCarton, makeStage, snapshot, disposeSnapshots, SIZES } from './carton.js';

/* ---------- config & data ---------- */

// Nilara's WhatsApp number with country code, digits only (e.g. '919876543210').
// Left empty, WhatsApp opens and asks who to send the message to.
const WHATSAPP = '';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rupee = (n) => '₹' + n.toLocaleString('en-IN');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wa = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

// Demo prices in ₹.
const PRODUCTS = [
  { id: 'pure-200',  cat: 'pure',     v: 'pure',     s: 200,  name: 'Pure Mini',    size: '200 ml', price: 15, note: 'Lunchbox and meeting size', bg: '#5BBDF0' },
  { id: 'pure-330',  cat: 'pure',     v: 'pure',     s: 330,  name: 'Pure Pocket',  size: '330 ml', price: 20, note: 'Slips into any bag',       bg: '#3EA8EA' },
  { id: 'pure-500',  cat: 'pure',     v: 'pure',     s: 500,  name: 'Pure Classic', size: '500 ml', price: 30, note: 'The everyday carton',      bg: '#1F86DC' },
  { id: 'pure-1000', cat: 'pure',     v: 'pure',     s: 1000, name: 'Pure Family',  size: '1 L',    price: 50, note: 'For the dining table',     bg: '#1667C8' },
  { id: 'alk-500',   cat: 'alkaline', v: 'alkaline', s: 500,  name: 'Alkaline',     size: '500 ml', price: 45, note: 'pH 8.5+, smooth taste',    bg: '#2B4FC4' },
  { id: 'alk-1000',  cat: 'alkaline', v: 'alkaline', s: 1000, name: 'Alkaline',     size: '1 L',    price: 80, note: 'pH 8.5+, share size',      bg: '#1E3696' },
  { id: 'min-500',   cat: 'mineral',  v: 'mineral',  s: 500,  name: 'Mineral+',     size: '500 ml', price: 35, note: 'Calcium and magnesium',    bg: '#1695C2' },
  { id: 'min-1000',  cat: 'mineral',  v: 'mineral',  s: 1000, name: 'Mineral+',     size: '1 L',    price: 60, note: 'Crisp, clean finish',      bg: '#0E78A6' },
  { id: 'act-330',   cat: 'active',   v: 'active',   s: 330,  name: 'Active',       size: '330 ml', price: 40, note: 'Electrolytes, zero sugar', bg: '#36B4EC' },
  { id: 'act-500',   cat: 'active',   v: 'active',   s: 500,  name: 'Active',       size: '500 ml', price: 55, note: 'For workouts and heat',    bg: '#1C9BDB' },
  { id: 'case-500',  cat: 'pack',     v: 'pure',     s: 500,  name: 'Office case',  size: '24 × 500 ml', price: 649, note: 'Desks, meetings, pantry', bg: '#0F4FA6', pack: 3 },
  { id: 'case-200',  cat: 'pack',     v: 'pure',     s: 200,  name: 'Event pack',   size: '48 × 200 ml', price: 599, note: 'Weddings, parties, events', bg: '#2C7BD8', pack: 4 },
];
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

const HERO = [
  { id: 'pure-500',  title: 'Classic',  bg: '#1B7FD8' },
  { id: 'pure-1000', title: 'Family',   bg: '#1A5BC4' },
  { id: 'alk-500',   title: 'Alkaline', bg: '#24399E' },
  { id: 'min-500',   title: 'Mineral+', bg: '#1590BE' },
  { id: 'act-330',   title: 'Active',   bg: '#2E9FE0' },
  { id: 'pure-200',  title: 'Mini',     bg: '#47B2EC' },
];

const STORY = [
  { v: 'pure', s: 500, no: '01', sub: 'everyday water', title: 'pure', line: 'Clean, light and quietly refreshing. Water the way it should taste.', chips: ['0 kcal', '7-stage purified', 'pH 7–7.5'], bg: '#2F9BE0', fg: '#fff' },
  { v: 'alkaline', s: 500, no: '02', sub: 'pH 8.5 and up', title: 'alkaline', line: 'Soft, smooth and a little rounder on the tongue.', chips: ['pH 8.5+', '0 kcal', 'No additives'], bg: '#2C4CC0', fg: '#fff' },
  { v: 'mineral', s: 500, no: '03', sub: 'minerals added back', title: 'mineral+', line: 'Calcium and magnesium for a crisp, clean finish.', chips: ['Ca + Mg', 'Low sodium', '0 kcal'], bg: '#138DBA', fg: '#fff' },
  { v: 'active', s: 330, no: '04', sub: 'with electrolytes', title: 'active', line: 'For hot afternoons, long commutes and the gym.', chips: ['Na + K + Mg', '0 sugar', '0 kcal'], bg: '#7CCBF2', fg: '#06104A' },
];

const FACTS = [
  { num: 0, unit: '', title: 'plastic bottles', instead: 'PET bottles', body: 'Every Nilara pour comes from a paper-based carton, not another plastic bottle.', icon: 'carton' },
  { num: 7, unit: '', title: 'purification stages', instead: 'just filtered', body: 'Sand, carbon, micron, reverse osmosis, mineral balance, UV and ozone. Seven checks before it is sealed.', icon: 'filter' },
  { num: 100, unit: '%', title: 'recyclable carton', instead: 'landfill', body: 'Flatten it and drop it in dry waste. The paperboard can come back as paper.', icon: 'recycle' },
  { num: 0, unit: '', title: 'added flavours', instead: 'additives', body: 'Ingredients: water. That is the whole list.', icon: 'drop' },
];

const FAQ = [
  ['Is Nilara mineral water or packaged drinking water?', 'Nilara Pure is packaged drinking water: purified through seven stages, with minerals balanced for a clean taste. Mineral+ has calcium and magnesium added back, and Alkaline is balanced to pH 8.5 and up.'],
  ['Why a carton instead of a plastic bottle?', 'A carton is mostly paperboard, so each one means much less plastic than a bottle. It is light, stacks flat and is simple to recycle. The water inside is the same clean water.'],
  ['Can the carton leak or go soggy?', 'No. The carton has thin food-safe inner layers that keep the water sealed in and the paper dry. The screw cap reseals after every sip.'],
  ['How long does Nilara keep?', 'Best enjoyed within six months of packing (demo). Store it in a cool, dry place away from direct sunlight, and finish an opened carton within a day or two.'],
  ['How do I recycle it?', 'Finish it, flatten it, put the cap back on and drop it in dry waste. Carton recyclers turn the paperboard into new paper products.'],
  ['Do you deliver to offices and events?', 'Yes. Order cases for offices, cafés, weddings and events, and we confirm the price and delivery slot on WhatsApp.'],
  ['Can we get cartons with our own logo?', 'Yes, through My Water, powered by Nilara. Custom-label cartons for hotels, restaurants, events and brands, in any size from the range.'],
];

const ICONS = {
  carton: '<path d="M7 9h10v12H7zM7 9l2-5h6l2 5M10 2h4v2h-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  filter: '<path d="M3 4h18l-7 8v6l-4 2v-8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  recycle: '<path d="M7 19H4l3-5M17 19h3l-3-5M9 5l3-3 3 3M12 2v7M5 14l3-5h8l3 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
};

/* ---------- smooth scroll ---------- */

gsap.registerPlugin(ScrollTrigger);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target) => {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
  else document.querySelector(target)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  closeMenu();
  scrollTo(a.getAttribute('href'));
});

/* ---------- nav ---------- */

const nav = $('#nav'), menuBtn = $('#menuBtn');
function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; }
menuBtn.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Close' : 'Menu';
});

/* ---------- order tray ---------- */

let order = {};
try { order = JSON.parse(localStorage.getItem('nilara-order') || '{}') || {}; } catch (e) { order = {}; }
const save = () => { try { localStorage.setItem('nilara-order', JSON.stringify(order)); } catch (e) { /* private mode */ } };
const tray = $('#tray'), scrim = $('#trayScrim');

function openTray() { $('#toast').classList.remove('show'); tray.classList.add('open'); tray.setAttribute('aria-hidden', 'false'); scrim.hidden = false; lenis?.stop(); }
function closeTray() { tray.classList.remove('open'); tray.setAttribute('aria-hidden', 'true'); scrim.hidden = true; lenis?.start(); }
$('#openTray').addEventListener('click', openTray);
$('#closeTray').addEventListener('click', closeTray);
scrim.addEventListener('click', closeTray);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeTray(); closeMenu(); } });

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

function add(id, n = 1) {
  order[id] = Math.max(0, (order[id] || 0) + n);
  if (!order[id]) delete order[id];
  save(); renderTray();
}

function renderTray() {
  const ids = Object.keys(order).filter((id) => byId[id]);
  const count = ids.reduce((a, id) => a + order[id], 0);
  const total = ids.reduce((a, id) => a + order[id] * byId[id].price, 0);
  $('#navCount').textContent = count;
  $('#trayEmpty').hidden = ids.length > 0;
  $('#trayTotal').textContent = rupee(total);
  $('#trayList').innerHTML = ids.map((id) => {
    const p = byId[id];
    return `<li><div><b>${p.name}</b><span>${p.size} · ${rupee(p.price)}</span></div>
      <div class="qty"><button type="button" data-q="${id}" data-d="-1" aria-label="One less ${p.name} ${p.size}">−</button><span>${order[id]}</span><button type="button" data-q="${id}" data-d="1" aria-label="One more ${p.name} ${p.size}">+</button></div></li>`;
  }).join('');
  const lines = ids.map((id) => `• ${byId[id].name} ${byId[id].size} × ${order[id]} = ${rupee(order[id] * byId[id].price)}`);
  const msg = ids.length
    ? `Hi Nilara, I'd like to order:\n${lines.join('\n')}\nTotal: ${rupee(total)}\n\nDelivery address:`
    : 'Hi Nilara, I would like to order some water.';
  $('#traySend').href = wa(msg);
  $('#traySend').classList.toggle('disabled', !ids.length);
}
$('#trayList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-q]');
  if (b) add(b.dataset.q, Number(b.dataset.d));
});
$('#ctaOrder').addEventListener('click', openTray);
$('#mwCta').href = wa('Hi Nilara, I am interested in My Water custom-label cartons for my business.');
$('#footWa').href = wa('Hi Nilara!');
renderTray();

/* ---------- range grid ---------- */

const grid = $('#rangeGrid');
grid.innerHTML = PRODUCTS.map((p) => `
  <article class="card" data-cat="${p.cat}" style="--c:${p.bg}">
    <div class="card-art"><img alt="${p.name} ${p.size} carton" width="260" height="340" data-snap="${p.id}"></div>
    <div class="card-info">
      <div><h3>${p.name}</h3><p>${p.size} · ${p.note}</p></div>
      <div class="card-buy"><b>${rupee(p.price)}</b><button class="add" type="button" data-add="${p.id}" aria-label="Add ${p.name} ${p.size} to order">Add <span aria-hidden="true">+</span></button></div>
    </div>
  </article>`).join('');
grid.addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  add(b.dataset.add);
  const p = byId[b.dataset.add];
  toast(`${p.name} ${p.size} added`);
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
});
$('#filters').addEventListener('click', (e) => {
  const c = e.target.closest('[data-f]');
  if (!c) return;
  $$('#filters .chip').forEach((x) => x.classList.toggle('is-on', x === c));
  const f = c.dataset.f;
  const cards = $$('.card', grid);
  cards.forEach((card) => card.classList.toggle('hide', f !== 'all' && card.dataset.cat !== f));
  gsap.fromTo(cards.filter((x) => !x.classList.contains('hide')), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out' });
  ScrollTrigger.refresh();
});

/* ---------- FAQ ---------- */

$('#faqList').innerHTML = FAQ.map(([q, a], i) => `
  <div class="qa">
    <button type="button" aria-expanded="false" aria-controls="qa${i}"><span>${q}</span><i aria-hidden="true">+</i></button>
    <div class="qa-a" id="qa${i}"><p>${a}</p></div>
  </div>`).join('');
$('#faqList').addEventListener('click', (e) => {
  const b = e.target.closest('.qa > button');
  if (!b) return;
  const open = b.getAttribute('aria-expanded') !== 'true';
  $$('.qa > button').forEach((x) => { x.setAttribute('aria-expanded', 'false'); x.parentElement.classList.remove('open'); });
  if (open) { b.setAttribute('aria-expanded', 'true'); b.parentElement.classList.add('open'); }
  setTimeout(() => ScrollTrigger.refresh(), 450);
});

/* ---------- facts ---------- */

let fact = 0;
$('#factIcons').innerHTML = FACTS.map((f, i) => `<button type="button" class="ficon" data-i="${i}" aria-label="${f.title}"><svg viewBox="0 0 24 24" width="18" height="18">${ICONS[f.icon]}</svg></button>`).join('');
function showFact(i, animate = true) {
  fact = (i + FACTS.length) % FACTS.length;
  const f = FACTS[fact];
  $('#factEyebrow').textContent = `Why Nilara · 0${fact + 1} / 0${FACTS.length}`;
  $('#factTitle').textContent = f.title;
  $('#factInstead').textContent = f.instead;
  $('#factBody').textContent = f.body;
  $('#factUnit').textContent = f.unit;
  $$('.ficon').forEach((b, j) => b.classList.toggle('on', j === fact));
  const num = $('#factNum');
  if (!animate || reduce) { num.textContent = f.num; return; }
  const o = { v: f.num ? 0 : 9 };
  gsap.to(o, { v: f.num, duration: 0.9, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(o.v); } });
  gsap.fromTo('.facts-copy .fact-title, .facts-copy .fact-instead, .facts-copy .fact-body', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
}
$('#factPrev').addEventListener('click', () => showFact(fact - 1));
$('#factNext').addEventListener('click', () => showFact(fact + 1));
$('#factIcons').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) showFact(Number(b.dataset.i)); });
showFact(0, false);
ScrollTrigger.create({ trigger: '#why', start: 'top 70%', once: true, onEnter: () => showFact(0) });

/* ---------- story DOM ---------- */

$('#storyBgs').innerHTML = STORY.map((s, i) => `<div class="sbg" style="background:${s.bg}" data-i="${i}"></div>`).join('');
$('#storyTexts').innerHTML = STORY.map((s) => `
  <article class="st" style="--fg:${s.fg}">
    <p class="eyebrow">${s.no} · ${s.sub}</p>
    <h2>${s.title}</h2>
    <p class="st-line">${s.line}</p>
    <ul class="st-chips">${s.chips.map((c) => `<li>${c}</li>`).join('')}</ul>
  </article>`).join('');
$('#storyDots').innerHTML = STORY.map((s, i) => `<button type="button" style="--c:${s.bg}" data-i="${i}" aria-label="Show ${s.title}"></button>`).join('');
$('#bubbles').innerHTML = Array.from({ length: 26 }, (_, i) => {
  const r = (n) => ((Math.sin(i * 91.7 + n * 13.3) + 1) / 2);
  return `<i style="left:${(r(1) * 92).toFixed(1)}%;--s:${(6 + r(2) * 22).toFixed(0)}px;--d:${(4 + r(3) * 6).toFixed(1)}s;--l:${(-r(4) * 8).toFixed(1)}s"></i>`;
}).join('');

/* ---------- reveals ---------- */

$$('[data-split]').forEach((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
  if (reduce) return;
  gsap.from($$('.w > span', el), { yPercent: 110, duration: 0.9, stagger: 0.06, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});
if (!reduce) {
  gsap.set('[data-reveal]', { y: 30, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', { start: 'top 88%', onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' }) });
  gsap.to('.about-photo img', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.h2o-l1', { xPercent: -12 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: '#h2o', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.h2o-l2', { xPercent: 12 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '#h2o', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.foot-mark', { yPercent: 30, opacity: 0.3 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* ---------- 3D ---------- */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const stages = [];
let pointerX = 0, pointerY = 0;
addEventListener('pointermove', (e) => { pointerX = e.clientX / innerWidth - 0.5; pointerY = e.clientY / innerHeight - 0.5; }, { passive: true });

async function init3D() {
  await loadAssets();
  setupHero();
  setupStory();
  setupH2O();
  makeSnapshots();
  gsap.ticker.add((time) => {
    for (const s of stages) {
      if (!s.visible) continue;
      s.onFrame && s.onFrame(time);
      s.renderer.render(s.scene, s.camera);
    }
  });
  document.body.classList.add('webgl');
  ScrollTrigger.refresh();
}

/* hero carousel */
let heroIndex = 0;
function setupHero() {
  const stage = makeStage($('#heroCanvas'), { fov: 26, z: 18 });
  stages.push(stage);
  const hero = $('#hero');
  const items = HERO.map((h) => {
    const p = byId[h.id];
    const m = buildCarton(p.v, p.s);
    m.scale.setScalar(0.001);
    stage.scene.add(m);
    return { ...h, p, m, k: 0, spin: Math.random() * 6 };
  });
  $('#heroDots').innerHTML = HERO.map((_, i) => `<button type="button" data-i="${i}" aria-label="Show carton ${i + 1}"></button>`).join('');

  const N = items.length;
  const offset = (i) => { let k = (i - heroIndex) % N; if (k < -N / 2) k += N; if (k >= N / 2) k -= N; return k; };
  const layout = (instant) => {
    const narrow = stage.viewW < stage.viewH * 0.9;
    const gap = stage.viewW * (narrow ? 0.4 : 0.23);
    const base = (stage.viewH * 0.5) / 3.2;           // a 500 ml carton fills ~half the hero
    items.forEach((it, i) => {
      const k = offset(i), ak = Math.abs(k);
      const jump = Math.abs(k - it.k) > 2;
      it.k = k;
      // one scale for every size, so 200 ml really looks smaller than 1 L
      const slot = k === 0 ? 1.12 : ak === 1 ? 0.72 : 0.56;
      const sc = Math.min(base * slot, (stage.viewH * 0.6 * slot) / it.m.userData.height);
      const target = {
        x: k * gap * (ak === 2 ? 0.92 : 1),
        y: stage.viewH * (k === 0 ? 0.07 : 0.11 + ak * 0.02),
        z: k === 0 ? 0 : -1.5 * ak,
        rz: -k * 0.22,
        s: ak >= 3 ? 0.001 : sc,
      };
      if (instant || jump || reduce) {
        it.m.position.set(target.x, target.y, target.z); it.m.rotation.z = target.rz; it.m.scale.setScalar(target.s);
      } else {
        gsap.to(it.m.position, { x: target.x, y: target.y, z: target.z, duration: 0.9, ease: 'power3.inOut', overwrite: true });
        gsap.to(it.m.rotation, { z: target.rz, duration: 0.9, ease: 'power3.inOut', overwrite: 'auto' });
        gsap.to(it.m.scale, { x: target.s, y: target.s, z: target.s, duration: 0.9, ease: 'power3.inOut', overwrite: true });
      }
    });
  };
  const setText = () => {
    const it = items[heroIndex];
    hero.style.setProperty('--hero-bg', it.bg);
    document.querySelector('meta[name="theme-color"]').content = it.bg;
    $('#heroName').textContent = it.title;
    $('#heroMeta').textContent = `0${heroIndex + 1} / 0${N} · ${it.p.size} · ${rupee(it.p.price)}`;
    $$('#heroDots button').forEach((b, i) => b.classList.toggle('on', i === heroIndex));
    if (!reduce) gsap.fromTo('#heroName, #heroMeta', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' });
  };
  const go = (i) => { heroIndex = (i + N) % N; layout(false); setText(); };
  $('#heroPrev').addEventListener('click', () => go(heroIndex - 1));
  $('#heroNext').addEventListener('click', () => go(heroIndex + 1));
  $('#heroDots').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) go(Number(b.dataset.i)); });
  // swipe
  let sx = null;
  hero.addEventListener('pointerdown', (e) => { if (!e.target.closest('button,a')) sx = e.clientX; });
  hero.addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(heroIndex + (dx < 0 ? 1 : -1)); });
  // auto-advance until the visitor interacts
  let auto = reduce ? null : setInterval(() => { if (stage.visible && !document.hidden) go(heroIndex + 1); }, 4500);
  const stopAuto = () => { clearInterval(auto); auto = null; };
  ['#heroPrev', '#heroNext', '#heroDots'].forEach((s) => $(s).addEventListener('click', stopAuto));
  hero.addEventListener('pointerdown', stopAuto);

  stage.onResize = () => layout(true);
  layout(true);
  setText();

  // intro: cartons rise in
  if (!reduce) {
    items.forEach((it, i) => {
      const s = it.m.scale.x;
      it.m.scale.setScalar(0.001);
      const y = it.m.position.y;
      it.m.position.y = y - stage.viewH * 0.6;
      gsap.to(it.m.position, { y, duration: 1.4, delay: 0.15 + Math.abs(it.k) * 0.12, ease: 'expo.out' });
      gsap.to(it.m.scale, { x: s, y: s, z: s, duration: 1.2, delay: 0.15 + Math.abs(it.k) * 0.12, ease: 'expo.out' });
    });
  }

  // scroll away: hero cartons drift up
  let heroScroll = 0;
  ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: (st) => { heroScroll = st.progress; } });

  stage.onFrame = (t) => {
    items.forEach((it) => {
      const ak = Math.abs(it.k);
      const center = it.k === 0;
      const ty = (center ? -0.35 + pointerX * 0.8 : -0.5 - it.k * 0.15) + (reduce ? 0 : Math.sin(t * 0.6 + it.spin) * (center ? 0.35 : 0.12));
      it.m.rotation.y += (ty - it.m.rotation.y) * 0.06;
      it.m.rotation.x += ((center ? pointerY * 0.25 : 0.05 * (ak + 1)) + heroScroll * 0.4 - it.m.rotation.x) * 0.06;
    });
    stage.camera.position.y = -heroScroll * stage.viewH * 0.35;
    stage.camera.lookAt(0, stage.camera.position.y, 0);
  };
}

/* variety story: one carton per variety, swapped as you scroll */
function setupStory() {
  const stage = makeStage($('#storyCanvas'), { fov: 26, z: 16 });
  stages.push(stage);
  const cartons = STORY.map((s) => { const m = buildCarton(s.v, s.s); stage.scene.add(m); return m; });
  const bgs = $$('#storyBgs .sbg'), texts = $$('#storyTexts .st'), visuals = $$('#storyVisuals .sv'), dots = $$('#storyDots button');
  const N = STORY.length;
  let progress = 0, held = 0;
  const section = $('#varieties');
  ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', onUpdate: (st) => { progress = st.progress; } });
  dots.forEach((d, i) => d.addEventListener('click', () => {
    const top = section.offsetTop + (section.offsetHeight - innerHeight) * ((i + 0.3) / (N - 1 + 0.6));
    lenis ? lenis.scrollTo(top, { duration: 1.2 }) : scrollTo(`#varieties`);
  }));

  const anchor = () => {
    // carton sits between the text and the photo panel
    const wide = innerWidth > 860;
    return { x: wide ? stage.viewW * -0.02 : -stage.viewW * 0.2, y: wide ? 0 : -stage.viewH * 0.1, s: (stage.viewH * (wide ? 0.62 : 0.36)) / 3.4 };
  };

  stage.onFrame = (t) => {
    const s = clamp(progress * (N - 1 + 0.6) - 0.3, 0, N - 1);
    const i = Math.floor(s), f = s - i;
    const target = i + smooth(0.3, 1, f);
    held += (target - held) * (reduce ? 1 : 0.14);
    const a = anchor();
    cartons.forEach((m, j) => {
      const d = held - j;
      const vis = Math.abs(d) < 1.2;
      m.visible = vis;
      if (!vis) return;
      const sizeFix = 2.6 / SIZES[STORY[j].s].h;
      m.scale.setScalar(a.s * Math.min(1.15, Math.pow(sizeFix, 0.5)));
      m.position.set(a.x + d * stage.viewW * 0.04, a.y + d * stage.viewH * 1.05, 0);
      m.rotation.set(0.08 + d * 0.3, -0.45 + d * 2.2 + (reduce ? 0 : Math.sin(t * 0.7) * 0.12) + pointerX * 0.3, d * 0.5 + 0.06);
    });
    const active = Math.round(held);
    bgs.forEach((b, j) => {
      if (j === 0) return;
      const r = clamp(held - (j - 1));
      b.style.clipPath = `circle(${(r * 150).toFixed(2)}% at 50% 115%)`;
    });
    texts.forEach((el, j) => {
      const d = held - j;
      el.style.opacity = String(1 - clamp(Math.abs(d) * 2.4));
      el.style.transform = `translateY(${(-d * 60).toFixed(1)}px)`;
      el.style.visibility = Math.abs(d) < 0.5 ? 'visible' : 'hidden';
    });
    visuals.forEach((el, j) => {
      const d = held - j;
      el.style.opacity = String(1 - clamp(Math.abs(d) * 1.8));
      el.style.transform = `translateY(${(-d * 30).toFixed(1)}%) scale(${(1 - Math.min(0.08, Math.abs(d) * 0.08)).toFixed(3)})`;
    });
    dots.forEach((d, j) => d.classList.toggle('on', j === active));
    section.style.setProperty('--fg', STORY[active].fg);
    $('#storyBar').style.transform = `scaleX(${progress.toFixed(3)})`;
  };
}

/* "just eco H2O." — a 1 L carton turning with the scroll */
function setupH2O() {
  const stage = makeStage($('#h2oCanvas'), { fov: 26, z: 16 });
  stages.push(stage);
  const m = buildCarton('pure', 1000);
  stage.scene.add(m);
  let p = 0.5;
  ScrollTrigger.create({ trigger: '#h2o', start: 'top bottom', end: 'bottom top', onUpdate: (st) => { p = st.progress; } });
  let cur = p;
  stage.onFrame = (t) => {
    cur += (p - cur) * (reduce ? 1 : 0.1);
    const sc = (stage.viewH * (innerWidth < 900 ? 0.44 : 0.52)) / m.userData.height;
    m.scale.setScalar(sc);
    m.position.set(0, (0.5 - cur) * stage.viewH * 0.4, 0);
    m.rotation.set(0.12 + (cur - 0.5) * 0.5, -0.6 + cur * Math.PI * 1.2, -0.12 + (cur - 0.5) * 0.3);
  };
}

/* still renders for cards and decorations */
function makeSnapshots() {
  const set = (img, url) => { if (img) img.src = url; };
  PRODUCTS.forEach((p, i) => {
    let spec;
    if (p.pack === 3) {
      spec = { cartons: [{ v: p.v, s: p.s, x: -1.15, z: -0.4, ry: 0.15 }, { v: p.v, s: p.s, x: 1.15, z: -0.4, ry: -0.15 }, { v: p.v, s: p.s, x: 0, z: 0.7 }], ry: -0.35, fill: 0.84 };
    } else if (p.pack === 4) {
      spec = { cartons: [{ v: p.v, s: p.s, x: -0.95, z: -0.5 }, { v: p.v, s: p.s, x: 0, z: -0.6 }, { v: p.v, s: p.s, x: 0.95, z: -0.5 }, { v: p.v, s: p.s, x: -0.48, z: 0.55 }, { v: p.v, s: p.s, x: 0.48, z: 0.55 }], ry: -0.3, fill: 0.84 };
    } else {
      spec = { cartons: [{ v: p.v, s: p.s }], ry: -0.5 + (i % 3) * 0.12, rz: -0.07, fill: 0.62 + (SIZES[p.s].h / 3.2) * 0.26 };
    }
    set($(`[data-snap="${p.id}"]`), snapshot({ ...spec, w: 520, h: 680 }));
  });
  // different angles from the range cards, so no image repeats on the page
  set($('#faqCarton'), snapshot({ cartons: [{ v: 'mineral', s: 330 }], w: 480, h: 640, rx: 0.32, ry: 0.55, rz: 0.32, fill: 0.8 }));
  set($('#ctaLeft'), snapshot({ cartons: [{ v: 'alkaline', s: 330 }], w: 400, h: 540, rx: 0.2, ry: 0.6, rz: 0.35, fill: 0.8 }));
  set($('#ctaRight'), snapshot({ cartons: [{ v: 'active', s: 200 }], w: 400, h: 540, rx: 0.15, ry: -0.9, rz: -0.3, fill: 0.8 }));
  disposeSnapshots();
}

init3D().catch((err) => {
  console.warn('3D disabled:', err);
  document.body.classList.add('no-webgl');
});
