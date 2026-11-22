/* REFORM · version 1 — one continuous flow, built from everything approved (Figma section 10 + approvedMotion.js). */
'use strict';
const $ = id => document.getElementById(id);
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const clone = o => JSON.parse(JSON.stringify(o));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ======================= approved values ======================= */
const APPROVED = {
  sunny: { loop: 8, sunSways: 2, sunRange: 4.5, stripeCycles: 2, stripeMove: 10.5, stripeStagger: 0.6,
    sunPath: 'M94.2188 4.34277C164.732 -14.1344 236.873 28.0486 255.351 98.5615C273.828 169.075 231.644 241.215 161.131 259.692C90.6179 278.169 18.4773 235.987 0 165.474C50.9805 77.3211 50.9806 76.7261 94.2188 4.34277ZM128.326 89.3936C105.161 89.3936 86.3829 108.172 86.3828 131.337C86.3828 154.502 105.161 173.28 128.326 173.28C151.491 173.28 170.27 154.502 170.27 131.337C170.269 108.172 151.491 89.3937 128.326 89.3936Z' },
  rainy: { style: 'float', stripeMode: 'cycle', stripesOn: true, stripesMove: 10, stripesRot: 0, stagger: 0.25, cycleSpeed: 5, spacing: 1, fade: 0.3,
    g1Flow: 'across', g1Dir: 1, g2Flow: 'across', g2Dir: 1, circlesOn: true, circlesMove: 0, circlesScale: 0.03, speed: 1, duration: 8, intensity: 1, centerTop: true, topBehind: false },
  partly: { style: 'float', loop: 6, overall: 1, intensity: 1, stripesOn: true, stripeSpeed: 1, stripeMove: 12.5, stagger: 0.85, direction: 'together', stripeEase: 'smooth',
    stretchOn: false, stretch: 4, stripes: Array.from({ length: 6 }, () => ({ on: true, speed: 1, range: 100, delay: 0 })),
    yellowOn: true, ySpeed: 1, yEase: 'smooth', yX: true, yMoveX: 5, yY: true, yMoveY: 4, yR: true, yRot: 4, yS: true, yScale: 1.5 },
  stormy: { cloudPeriod: 7.2, cloudMoveX: 6, cloudScale: 2, barsPeriod: 3.2, barsAlong: 10, barsStagger: 0.45 },
  dusty: { move: 2.8, holdApart: 0.6, holdOther: 0.8, ease: [0.65, 0.27, 0.2, 1.03], groupLag: 0.15 },
  hot: { pulsePct: 3, pulsePeriod: 1.8, spikePx: 13, spikeEveryMs: 2250, spikeMs: 1450, floatPx: 27, floatPeriod: 5.5 },
};
const M = clone(APPROVED);
const VIS_KEYS = [['sunny', 'SUNNY'], ['rainy', 'RAINY'], ['partly', 'PARTLY CLOUDY'], ['stormy', 'STORMY'], ['dusty', 'DUSTY'], ['hot', 'HOT']];
const MS_DEF = {
  catchExit: [720, 'Catch · יציאה'], catchHold: [1100, 'Catch · עצירה בחוץ'], catchReturn: [700, 'Catch · חזרה'],
  catchOpen: [720, 'Catch · גדילה למצלמה'], catchClose: [650, 'מצלמה · סגירה'],
  weekLift: [600, 'גרף · הרמת השבוע'], lineDraw: [1000, 'גרף · ציור הקו'],
  moodFly: [700, 'מצב רוח · מעוף החותמת'], filterOpen: [750, 'סינון · פתיחה'], filterPick: [600, 'סינון · בחירה'],
  recompose: [1050, 'Memories · הרכבה מחדש'], detailOpen: [750, 'זיכרון · פתיחה'], detailSwipe: [600, 'זיכרון · החלקה'],
};
/* 22.11: the approved filter bar is option B (folded); on a new device (her phone) it used to start in the always-open mode */
const DEF_STATE = { speed: 1, vis: Object.fromEntries(VIS_KEYS.map(([k]) => [k, { on: true, k: 1 }])), ms: Object.fromEntries(Object.entries(MS_DEF).map(([k, v]) => [k, v[0]])), cam: 'live', graph: 'big', fv: 'A', mb: 'fold', mi: 'pile' };   // 20.11: Noya chose the pile icon
let S = Object.assign(clone(DEF_STATE), lsGet('reform-v1-settings', {}));
S.vis = Object.assign(clone(DEF_STATE.vis), S.vis || {}); S.ms = Object.assign(clone(DEF_STATE.ms), S.ms || {});
let SLOW = 1, PAUSED = false;
const saveS = () => lsSet('reform-v1-settings', S);
const K = () => (REDUCED ? 0.02 : 1) / (S.speed / SLOW);   // time stretch for every UI motion
const D = ms => ms * K();
const MS = key => D(S.ms[key]);

/* ======================= tiny motion helpers ======================= */
const EASE = {
  out: bezierEase(.22, 1, .36, 1), io: bezierEase(.65, 0, .35, 1), io2: bezierEase(.65, 0, .25, 1), glide: bezierEase(.16, 1, .3, 1),
  y: bezierEase(.55, 0, .75, .25), gentle: bezierEase(.33, 1, .68, 1), lin: x => x,
};
function tween(dur, ease, fn, delay = 0) {
  return new Promise(res => {
    const t0 = performance.now() + delay;
    const step = now => { if (now < t0) { requestAnimationFrame(step); return; } const u = dur <= 0 ? 1 : Math.min(1, (now - t0) / dur); fn(ease(u), u); u < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });
}
const anim = (el, frames, o) => el.animate(frames, { fill: 'forwards', ...o }).finished.catch(() => {});
const wait = ms => new Promise(r => setTimeout(r, ms));
const lerp = (a, b, t) => a + (b - a) * t;
const fade = (el, to, ms) => { el.style.transition = `opacity ${ms}ms ease`; el.style.opacity = to; };

/* ======================= data ======================= */
const DAYS = [
  // 17.11: Today and Thu traded graph shapes (designer's choice); temperatures re-fitted to each day
  { k: 'TODAY', x: 33, tw: 49, vis: 'sunny', temp: 26, cond: 'SUNNY', start: 10, now: true,
    t: [26, 27.5, 28.6, 29.6, 29.6, 28.8, 27.4, 25.8, 25, 24.2, 23.4, 23.4, 24.2], w: 'sun sun sun sun sun part night night night night night part sun' },
  { k: 'MON', x: 100, tw: 36, vis: 'rainy', temp: 16, cond: 'RAINY', start: 6,
    t: [13, 14, 15, 16, 16, 15, 14, 13, 13, 12, 12, 12, 11], w: 'rain rain cloud rain rain rain cloud night night rain rain night cloud' },
  { k: 'TUE', x: 154, tw: 26, vis: 'partly', temp: 25, cond: 'PARTLY CLOUDY', start: 6,
    t: [19, 21, 23, 24, 25, 25, 23, 21, 20, 19, 18, 18, 19], w: 'part part sun part part cloud part night night night night night part' },
  { k: 'WED', x: 198, tw: 32, vis: 'stormy', temp: 14, cond: 'STORMY', start: 6,
    t: [12, 12, 13, 14, 14, 13, 12, 12, 11, 11, 10, 10, 11], w: 'rain rain rain rain cloud rain rain rain rain night rain rain cloud' },
  { k: 'THU', x: 248, tw: 28, vis: 'dusty', temp: 31, cond: 'DUSTY', start: 14,
    t: [31, 33.2, 33.7, 34, 31.6, 30.6, 29, 29.5, 30, 30.9, 31.5, 32.6, 33.1], w: 'cloud part part part cloud cloud night night night night part cloud cloud' },
  { k: 'FRI', x: 294, tw: 22, vis: 'hot', temp: 25, cond: 'HOT', start: 6,
    t: [21, 23, 25, 25, 25, 24, 23, 22, 21, 20, 20, 19, 20], w: 'sun sun sun sun sun sun part night night night night night sun' },
  { k: 'SAT', x: 334, tw: 25, vis: 'sunny', temp: 27, cond: 'SUNNY', start: 6,
    t: [21, 24, 26, 27, 27, 26, 24, 22, 21, 20, 19, 19, 20], w: 'sun sun sun sun sun part sun night night night night night sun' },
];
DAYS.forEach(d => { d.w = d.w.split(' '); });
/* 17.11: one margin for every screen — 29px, the edge of the photo box (335 wide) */
const MARGIN = 29;
/* 18.11: the temperature number defines the grid — GRID is the visible left edge of "26°c" (its box sits at 29).
   The weather line, the week row and the graph run from GRID to 393 − GRID; so does the Revealed screen. */
let GRID = 31;
function layoutDays() { const LS = 2.38, sum = DAYS.reduce((a, d) => a + d.tw, 0), gap = (393 - 2 * GRID + LS - sum) / (DAYS.length - 1); let x = GRID; DAYS.forEach(d => { d.x = x; x += d.tw + gap; if (d.el) d.el.style.left = d.x - 4 + 'px'; }); }
layoutDays();
function measureGrid() {
  try {
    const c = document.createElement('canvas').getContext('2d'); c.font = '400 48px "Afacad Flux"';
    const m = c.measureText('26°c'), bear = -m.actualBoundingBoxLeft;
    if (isFinite(bear) && bear > -1 && bear < 8) GRID = Math.round((29 + bear) * 10) / 10;
  } catch (e) {}
  phone.style.setProperty('--g', GRID + 'px');
  layoutDays(); placeInd(day, true); if (graphOpen) drawGraph(false);
}
const HCOL = { sun: '#F5C400', part: '#E8CF6A', cloud: '#A3A39C', rain: '#3E7FBF', night: '#2B3A73' };
const VIS_TO_FILTER = { sunny: 'sunny', rainy: 'rainy', partly: 'cloudy', stormy: 'rainy', dusty: 'windy', hot: 'heat' };
const WLABEL = { sunny: 'SUNNY', cloudy: 'CLOUDY', rainy: 'RAINY', windy: 'DUSTY', heat: 'HOT' };

const P = n => `photos/${n}.jpg`;
const BASE_MEM = [
  { id: 'm01', title: 'Kaia Meets the Waves', src: P('kaia-waves'), date: '2026-08-03', weather: 'sunny', temp: 31, place: 'TEL AVIV', mood: 'excited', note: 'She ran straight in. No hesitation at all.' },
  { id: 'm02', title: 'Last Light at Gordon', src: P('sunset'), date: '2026-09-12', weather: 'cloudy', temp: 24, place: 'TEL AVIV', mood: 'sad', note: 'Took the long way home along the beach.\nGlad I did.' },   // 21.11: text from Noya's Figma
  { id: 'm03', title: 'Beach Day with Kaia and Nadav', src: P('beach-umbrella'), date: '2026-07-24', weather: 'sunny', temp: 26, place: 'TEL AVIV', mood: 'excited', note: 'A beautiful day for a picnic.' },
  { id: 'm04', title: 'Turquoise Bay', src: P('turquoise-bay'), date: '2026-06-18', weather: 'sunny', temp: 36, place: 'CORFU', mood: 'happy', note: 'Too hot to move, too beautiful to leave.' },
  { id: 'm05', title: 'Iced Coffee Afternoon', src: P('window-afternoon'), date: '2026-08-21', weather: 'heat', temp: 31, place: 'TEL AVIV', mood: 'happy', note: 'It was way too hot outside, so we spent the afternoon at my place catching up.' },   // 21.11: Figma — 31°C, HAPPY
  { id: 'm06', title: 'Ice Cream Between Storms', src: P('ice-cream'), date: '2026-10-28', weather: 'rainy', temp: 19, place: 'TEL AVIV', mood: 'happy', note: 'We waited out the thunder and ran out the minute it stopped.' },
  { id: 'm07', title: 'Rainy Day In', src: P('rainy-day-in'), date: '2026-11-08', weather: 'rainy', temp: 16, place: 'TEL AVIV', mood: 'cozy', note: '' },
  { id: 'm08', title: 'Wind on the Water', src: P('wind-on-water'), date: '2026-10-05', weather: 'windy', temp: 22, place: 'JAFFA', mood: 'calm', note: 'The sea was all texture today.' },
  { id: 'm09', title: 'Golden Hour Together', src: P('golden-hour'), date: '2026-07-02', weather: 'heat', temp: 27, place: 'TEL AVIV', mood: 'calm', note: 'Soft light, soft clouds, nowhere to be.' },
  // 18.11: seven more photos, as in the RE Memories prototype
  // 19.11: three of the photo files carry each other's names (outdoor-tub.jpg is the coffee, cozy-coffee.jpg the fire, campfire.jpg the hot tub) — matched here by content
  { id: 'm10', title: 'Rosé for Everyone', src: P('rose-toast'), date: '2026-06-27', weather: 'sunny', temp: 29, place: 'TEL AVIV', mood: 'happy', note: 'Too many glasses, one table, nobody wanted to leave.' },
  { id: 'm11', title: 'Pink Water', src: P('pond-reflection'), date: '2026-09-30', weather: 'cloudy', temp: 21, place: 'TEL AVIV', mood: 'calm', note: 'The sky showed up twice.' },
  { id: 'm12', title: 'Morning in the Galilee', src: P('garden-view'), date: '2026-10-11', weather: 'windy', temp: 23, place: 'GALILEE', mood: 'calm', note: '' },
  { id: 'm13', title: 'Coffee Under the Blanket', src: P('outdoor-tub'), date: '2026-11-12', weather: 'rainy', temp: 14, place: 'TEL AVIV', mood: 'cozy', note: 'Spent most of the day on the couch catching up\non my favorite series' },   // 21.11: Figma
  { id: 'm14', title: 'Fire Night', src: P('cozy-coffee'), date: '2026-10-19', weather: 'windy', temp: 17, place: 'NEGEV', mood: 'excited', note: 'Smoke in our hair for two days.' },
  { id: 'm15', title: 'Moon at Noon', src: P('daytime-moon'), date: '2026-09-04', weather: 'sunny', temp: 28, place: 'TEL AVIV', mood: 'calm', note: '' },
  { id: 'm16', title: 'Hot Tub in the Desert', src: P('campfire'), date: '2026-07-15', weather: 'heat', temp: 37, place: 'ARAVA', mood: 'happy', note: 'Somehow the water was colder than the air.' },
];
let USER_MEM = lsGet('reform-v1-mem', []);
// 21.11: Noya asked to remove the grey test capture (no photo, just the camera's placeholder) from SUNNY
USER_MEM = USER_MEM.filter(m => m.id !== 'u1795275901238'); lsSet('reform-v1-mem', USER_MEM);
// 18.11: every photo appears once — a memory whose photo is already in the archive is not shown twice
const allMem = () => { const seen = new Set(); return [...USER_MEM, ...BASE_MEM].filter(m => { if (seen.has(m.src)) return false; seen.add(m.src); return true; }); };
const memById = id => allMem().find(m => m.id === id);
const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/* ======================= shapes ======================= */
const MOODS = ['cozy', 'sad', 'excited', 'happy', 'calm'];
const MOOD_X = { cozy: 51, sad: 117, excited: 183, happy: 247, calm: 310 };   // (old 40px slots, kept for reference)
/* 20.11: the row uses the exact Mood Sheet shapes (Figma 33:2141) at their natural proportions, 40 high — no more squashing.
   The shapes keep the same span as before (x 51 → 350) with equal gaps between them; each word is centred under its shape. */
const MOOD_Q = { cozy: 'What made it cozy?', sad: 'What made it sad?', excited: 'What made it exciting?', happy: 'What made it happy?', calm: 'What made it calm?' };
/* mood shapes exported from Figma (17.11): ROW = the 40×40 instances on "15 · choose mood"; NAT = the Mood Shape component (stamp, memory view) */
const MOOD_ROW = {
  cozy: ['0 0 40 40', '<path d="M29.5047 4.82196L31.2983 24.1717L10.3691 14.5767L29.5047 4.82196Z" fill="#075B33"/><ellipse cx="12.9781" cy="12.0713" rx="12.9781" ry="12.0713" transform="matrix(0.907996 0.418978 -0.511876 0.859059 12.3579 8.38477)" fill="#075B33"/>'],
  sad: ['0 0 40 40', '<g fill="#000"><path d="M30.0249 40L21.3574 23.6364L38.6923 23.6364L30.0249 40Z"/><path d="M10.0083 40L1.34083 23.6364L18.6757 23.6364L10.0083 40Z"/><path d="M10.0083 21.8184L1.34083 5.45476L18.6757 5.45477L10.0083 21.8184Z"/><path d="M30.0249 21.8184L21.3574 5.45476L38.6923 5.45477L30.0249 21.8184Z"/></g>'],
  excited: ['0 0 40 40', '<circle cx="20" cy="20" r="20" fill="#D6402B"/>'],
  happy: ['0 0 41 40', '<g fill="#F5C400"><ellipse cx="9.41555" cy="28.771" rx="9.41555" ry="11.228"/><ellipse cx="30.6006" cy="28.771" rx="9.41555" ry="11.228"/><ellipse cx="27.9525" cy="8.07016" rx="6.76743" ry="8.07016"/><ellipse cx="13.2406" cy="8.07016" rx="6.76743" ry="8.07016"/></g>'],
  calm: ['0 0 41 40', '<g fill="#3E7FBF"><ellipse cx="20.0264" cy="8.11594" rx="8.11594" ry="20.0264" transform="rotate(90 20.0264 8.11594)"/><ellipse cx="20.0264" cy="19.9995" rx="8.4058" ry="20.0264" transform="rotate(90 20.0264 19.9995)"/><ellipse cx="20.0264" cy="31.8835" rx="8.11594" ry="20.0264" transform="rotate(90 20.0264 31.8835)"/></g>'],
};
const MOOD_NAT = {
  cozy: [35.2, '<path d="M25.9642 4.82196L27.5426 24.1717L9.12488 14.5767L25.9642 4.82196Z" fill="#075B33"/><circle cx="15.8075" cy="24.1923" r="11.7091" fill="#075B33"/>'],
  sad: [43.6, '<g fill="#000"><path d="M32.7272 40.0005L23.2797 23.6369L42.1747 23.6369L32.7272 40.0005Z"/><path d="M10.9091 40.0005L1.46154 23.6369L20.3566 23.6369L10.9091 40.0005Z"/><path d="M10.9091 21.8184L1.46154 5.45476L20.3566 5.45477L10.9091 21.8184Z"/><path d="M32.7272 21.8184L23.2797 5.45476L42.1747 5.45477L32.7272 21.8184Z"/></g>'],
  excited: [40, '<circle cx="20" cy="20" r="20" fill="#D6402B"/>'],
  happy: [47.7, '<g fill="#F5C400"><circle cx="11.228" cy="28.772" r="11.228"/><circle cx="36.4911" cy="28.772" r="11.228"/><circle cx="33.3332" cy="8.07016" r="8.07016"/><circle cx="15.7894" cy="8.07016" r="8.07016"/></g>'],
  calm: [33, '<g fill="#3E7FBF"><ellipse cx="16.5217" cy="8.11594" rx="16.5217" ry="8.11594"/><ellipse cx="16.5217" cy="20" rx="16.5217" ry="8.4058"/><ellipse cx="16.5217" cy="31.884" rx="16.5217" ry="8.11594"/></g>'],
};
function moodRowSVG(m) { const [vb, body] = MOOD_ROW[m]; return `<svg width="40" height="40" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`; }
// natural proportions, sized by height (stamp 40, memory view 22, revealed 24)
// 21.11: COZY is a compact drop and has about half the ink of the others, so it looked smaller — it is drawn 18% larger (centred on
// the same line, so it still lines up with the rest) everywhere a mood appears
const MOOD_OPT = { cozy: 1.18 };
function moodSVG(m, h = 40) { if (!MOOD_NAT[m]) return ''; const [w, body] = MOOD_NAT[m], k = MOOD_OPT[m] || 1, H = h * k, pad = (H - h) / 2;
  return `<svg width="${(w * H / 40).toFixed(1)}" height="${H.toFixed(1)}" viewBox="0 0 ${w} 40" aria-hidden="true"${k !== 1 ? ` style="margin:${(-pad).toFixed(1)}px 0"` : ''}>${body}</svg>`; }
/* 21.11: spacing by the INK of each shape, not its box (COZY's drop leaves empty space at its sides, so its gaps looked bigger).
   The row now runs margin to margin (x 29 → 364, like the title and SAVE MEMORY), with equal gaps between the visible shapes;
   each word is centred under its shape's ink. */
const MOOD_INK = { cozy: [4.098, 27.543], sad: [1.462, 42.175], excited: [0, 40], happy: [0, 47.719], calm: [0, 33.04] };   // x range in the shape's own units (40 high)
const MOOD_K = m => (MOOD_OPT[m] || 1);   // drawn scale at 40 high
const MOOD_W = Object.fromEntries(Object.keys(MOOD_NAT).map(m => [m, MOOD_NAT[m][0] * MOOD_K(m)]));
const MOOD_C = (() => { const order = ['cozy', 'sad', 'excited', 'happy', 'calm'], L = 29, R = 364;
  const ink = m => (MOOD_INK[m][1] - MOOD_INK[m][0]) * MOOD_K(m);
  const gap = (R - L - order.reduce((a, m) => a + ink(m), 0)) / (order.length - 1), c = {}; let x = L;
  // c[m] = where the shape's BOX centre goes, so that its ink lands on x … x + ink
  order.forEach(m => { const k = MOOD_K(m); c[m] = x - MOOD_INK[m][0] * k + MOOD_W[m] / 2; x += ink(m) + gap; }); return c; })();
const MOOD_LABEL_DX = m => ((MOOD_INK[m][0] + MOOD_INK[m][1]) / 2 - MOOD_NAT[m][0] / 2) * MOOD_K(m);   // ink centre vs box centre
const STAR48 = (() => { let d = ''; for (let i = 0; i < 48; i++) { const a = -Math.PI / 2 + (i / 48) * Math.PI * 2, r = i % 2 ? 15.2 : 18.5; d += `${i ? 'L' : 'M'}${(18.5 + r * Math.cos(a)).toFixed(2)} ${(18.5 + r * Math.sin(a)).toFixed(2)}`; } return d + 'Z'; })();
const GLYPHS = {
  sunny: '<svg viewBox="0 0 30 29"><path fill="#F5C400" fill-rule="evenodd" d="M14.6455 0C22.7336 0 29.29 6.492 29.29 14.5C29.29 22.508 22.7337 29 14.6455 29C6.5572 29 0 22.508 0 14.5C0 6.4919 6.5573 0 14.6455 0ZM14.5 6.959C10.3359 6.959 6.96 10.335 6.96 14.499C6.96 18.663 10.3358 22.039 14.5 22.039C18.6643 22.039 22.04 18.663 22.04 14.499C22.04 10.335 18.6641 6.959 14.5 6.959Z"/></svg>',
  cloudy: '<svg viewBox="0 0 44 29"><ellipse cx="13" cy="14.5" rx="13" ry="13.5" fill="#3E7FBF"/><circle cx="30.5" cy="14.5" r="13.1" fill="#3E7FBF"/></svg>',
  rainy: '<svg viewBox="-2 -2 42 41"><circle cx="14.5" cy="17.5" r="14.5" fill="#999"/><g stroke="#000" stroke-width="5"><line x1="37" y1="4" x2="16" y2="35.5"/><line x1="30" y1="0" x2="9" y2="31.5"/></g></svg>',
  windy: '<svg viewBox="0 0 20 28" fill="#000"><circle cx="15.5" cy="4.5" r="4.5"/><circle cx="4.5" cy="11.5" r="4.5"/><circle cx="15.5" cy="16.5" r="4.5"/><circle cx="4.5" cy="23.5" r="4.5"/></svg>',
  heat: `<svg viewBox="0 0 37 37"><path d="${STAR48}" fill="#D6402B"/></svg>`,
};
function starPts(cx, cy, ro, ri, n, rot = 0) { const p = []; for (let i = 0; i < n * 2; i++) { const a = (rot - 90 + i * 180 / n) * Math.PI / 180, r = i % 2 ? ri : ro; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' '); }
// decorative shapes for the memory view (from Figma: Memory view · 13 and the two transition demos)
const DSHAPE = {
  sunny: { side: -1, svg: '<path fill="#F5C400" fill-rule="evenodd" d="M-122 291a112 112 0 1 0 224 0a112 112 0 1 0 -224 0ZM-56 291a46 46 0 1 0 92 0a46 46 0 1 0 -92 0Z"/>' },
  cloudy: { side: -1, svg: '<g stroke="#3E7FBF" stroke-width="18.5"><line x1="-118" y1="318" x2="176" y2="318"/><line x1="-118" y1="357" x2="176" y2="357"/><line x1="-118" y1="397" x2="176" y2="397"/><line x1="-118" y1="435" x2="176" y2="435"/></g>' },
  rainy: { side: 1, svg: (() => { const L = 77, a = -40.8 * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a);
    const st = [[279, 429], [304, 455], [330, 485], [354, 513], [380, 541]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${(x + ux * L).toFixed(1)}" y2="${(y + uy * L).toFixed(1)}"/>`).join('');
    return `<circle cx="436" cy="378" r="41" fill="#3E7FBF"/><g stroke="#000" stroke-width="17">${st}</g>`; })() },
  windy: { side: 1, svg: (() => { let s = '<g fill="#000">'; for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) s += `<circle cx="${275.5 + c * 29.6}" cy="${216.5 + r * 33.3}" r="7.5"/>`; return s + '</g>'; })() },
  heat: { side: -1, svg: `<polygon fill="#D6402B" points="${starPts(-1.5, 539.5, 91.5, 75, 24, 10)}"/>` },
};

/* ======================= layout of the phone ======================= */
const device = $('device'), phone = $('phone');
const IS_PHONE = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
/* on a phone: "real" = true size, the app is exactly as wide as the screen (1:1 on an iPhone 16) and the page scrolls up/down for the rest;
   "fit" = the whole app squeezed into the visible area */
function fit() {
  const wide = innerWidth >= 900;
  document.body.classList.toggle('phoneMode', IS_PHONE);
  document.body.classList.remove('realSize');
  document.body.classList.toggle('stackMode', !IS_PHONE && !wide);
  const o = $('devOuter');
  if (IS_PHONE) {
    /* on a real phone the phone's own status bar replaces the app's top 47px, so that strip is cropped
       and the rest (805px) is fitted into the visible screen: no scrolling, nothing hidden behind browser bars */
    const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;
    const H = (window.visualViewport ? visualViewport.height : innerHeight) - top;
    const s = Math.min(innerWidth / 393, H / 805);
    device.style.width = o.style.width = 393 * s + 'px';
    device.style.height = o.style.height = 805 * s + 'px';
    phone.style.transform = `translateY(${-47 * s}px) scale(${s})`;
    device.style.marginTop = top + 'px';
    return;
  }
  let s;
  if (wide) s = Math.min((innerHeight - 64) / 852, 440 / 393);
  else s = Math.min((innerWidth - 60) / 393, (innerHeight - 56) / 852);
  device.style.width = 393 * s + 'px'; device.style.height = 852 * s + 'px';
  o.style.width = 393 * s + 'px'; o.style.height = 852 * s + 'px';
  phone.style.transform = `scale(${s})`;
  device.style.marginTop = '';
}
if (window.visualViewport) visualViewport.addEventListener('resize', fit);
addEventListener('resize', fit); fit();
const toPhone = e => { const r = phone.getBoundingClientRect(), s = r.width / 393; return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };

/* ======================= weather visual stage ======================= */
const visSvg = $('vis'), VIS_UP = 40;
let curVis = null, visT = 0, visKey = '';
function setVisual(key) {
  visSvg.innerHTML = ''; visKey = key; visT = 0;
  const up = document.createElementNS(NS, 'g'); up.setAttribute('transform', `translate(0 ${-VIS_UP})`); visSvg.appendChild(up);
  curVis = VISUALS[key](up); curVis.draw(0);
}
let lastNow = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - lastNow) / 1000); lastNow = now;
  const k = PAUSED ? 0 : (REDUCED ? 0 : S.speed / SLOW);
  if (curVis && S.vis[visKey]?.on) { visT += dt * k * S.vis[visKey].k; curVis.draw(visT); }
  canvasFrame(PAUSED ? 0 : REDUCED ? dt * 50 : dt * k);
  requestAnimationFrame(frame);
}

/* ======================= TODAY ======================= */
let day = 0, graphOpen = false;
const daysEl = $('days');
DAYS.forEach((d, i) => {
  const b = document.createElement('button'); b.className = 'day' + (i ? '' : ' on'); b.textContent = d.k; b.style.left = d.x - 4 + 'px';
  b.onclick = () => selectDay(i); d.el = b; daysEl.appendChild(b);
});
const ind = document.createElement('i'); ind.className = 'ind'; daysEl.appendChild(ind);
const chev = document.createElement('button'); chev.className = 'chev'; chev.setAttribute('aria-label', 'Hourly forecast');
chev.innerHTML = '<svg width="8" height="5" viewBox="0 0 8 5"><polyline points="0.5,0.5 4,4 7.5,0.5" fill="none" stroke="#000" stroke-width="1"/></svg>';
chev.onclick = () => toggleGraph(); daysEl.appendChild(chev);
function placeInd(i, instant) {
  const d = DAYS[i], c = d.x + d.tw / 2;
  [ind, chev].forEach(el => { if (instant) el.style.transition = 'none'; });
  ind.style.left = c - 12 + 'px'; chev.style.left = c - 11.5 + 'px';
  if (instant) { void ind.offsetWidth; ind.style.transition = chev.style.transition = ''; }
}
placeInd(0, true);
function applyDay(i) {
  const d = DAYS[i];
  $('tTemp').textContent = d.temp + '°c'; $('tCond').textContent = d.cond;
  setVisual(d.vis);
  $('reveal').style.display = i === 0 ? '' : 'none';
}
async function selectDay(i) {
  if (i === day) return;
  DAYS[day].el.classList.remove('on'); DAYS[i].el.classList.add('on');
  const was = day; day = i; placeInd(i);
  const hdr = document.querySelector('.hdr');
  fade(visSvg, 0, D(250)); fade(hdr, 0, D(250));
  if (i === 0) showCatch(true); else if (was === 0) { stopCatch(); catchState = 'rest'; catchEl.style.transform = tf(REST); showCatch(false); }
  await wait(D(250));
  applyDay(i);
  fade(visSvg, 1, D(350)); fade(hdr, 1, D(350));
  if (graphOpen) drawGraph(true);
  if (i === 0 && was !== 0) launchCatch(400);
}

/* ---------- hourly graph (option B) ---------- */
const gsvg = $('graph');
const GX = i => GRID + (393 - 2 * GRID) / 12 * i;
let touched = new Set(), gNodes = null;
const GRAPH = {   // the row is lifted 46px when the graph is open; everything below sits under it
  big:   { top: 614, h: 40, tFs: 12, hFs: 11, labY: 685, hourY: 701, curTop: 602, curBot: 672, dot: 2, dotOn: 3.2, curR: 5.5 },
  figma: { top: 614, h: 28, tFs: 9, hFs: 8, labY: 669, hourY: 682, curTop: 604, curBot: 660, dot: 1.5, dotOn: 2.5, curR: 4.5 },
};
function drawGraph(animate) {
  const G = GRAPH[S.graph] || GRAPH.big;
  const d = DAYS[day], mn = Math.min(...d.t), mx = Math.max(...d.t), GY = v => G.top + G.h - G.h * (v - mn) / ((mx - mn) || 1);
  const pts = d.t.map((v, i) => [GX(i), GY(v)]);
  const path = 'M' + pts.map(p => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' L');
  touched = new Set();
  let s = '';
  [14, 7, 0].forEach((o, j) => { s += `<path class="gl" d="${path}" transform="translate(0 ${o})" fill="none" stroke="#000" stroke-width="${S.graph === 'big' ? .8 : .6}" opacity="${o ? .25 : 1}" data-o="${j}"/>`; });
  pts.forEach((p, i) => { s += `<circle class="gd" cx="${p[0]}" cy="${p[1]}" r="${G.dot}" fill="#000" data-i="${i}"/>`; });
  const lab = (i, txt) => `<text class="gtxt gfade glab" x="${i === 0 ? GRID : i === 12 ? 393 - GRID : pts[i][0]}" y="${G.labY}" text-anchor="${i === 0 ? 'start' : i === 12 ? 'end' : 'middle'}" font-size="${G.tFs}">${txt}</text>`;
  const iMax = d.t.indexOf(mx), iMin = d.t.indexOf(mn);
  s += lab(0, Math.round(d.t[0]) + '°');
  if (iMax > 1) s += lab(iMax, Math.round(mx) + '°');
  if (iMin > 1 && iMin !== iMax) s += lab(iMin, Math.round(mn) + '°');
  for (let i = 0; i <= 12; i += 2) {
    const hh = String((d.start + 2 * i) % 24).padStart(2, '0');
    if (i === 0) s += `<text class="ghour gfade" x="${GRID}" y="${G.hourY}" font-size="${G.hFs}" style="fill:${d.now ? '#000' : '#999'}">${d.now ? 'NOW' : hh}</text>`;
    else s += `<text class="ghour gfade" x="${i === 12 ? 393 - GRID : GX(i)}" y="${G.hourY}" text-anchor="${i === 12 ? 'end' : 'middle'}" font-size="${G.hFs}">${hh}</text>`;
  }
  s += `<g id="gcur" opacity="0"><line x1="0" y1="${G.curTop}" x2="0" y2="${G.curBot}" stroke="#000" stroke-width=".7"/><circle r="${G.curR}" cy="0"/></g><text id="gcurT" class="gtxt" opacity="0" y="${G.labY}" text-anchor="middle" font-size="${G.tFs}"></text>`;
  s += `<rect class="hit" x="20" y="${G.curTop - 10}" width="353" height="${G.hourY - G.curTop + 20}" fill="transparent"/>`;
  gsvg.innerHTML = s;
  gsvg.querySelectorAll('.gl').forEach(p => {
    const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = animate ? L : 0;
    if (animate) anim(p, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: MS('lineDraw'), delay: D(200 + 130 * (2 - +p.dataset.o)), easing: 'cubic-bezier(.65,0,.35,1)' });
  });
  gsvg.querySelectorAll('.gd,.gfade').forEach(el => { el.style.opacity = 0; anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: D(400), delay: animate ? D(700) : 0 }).then(() => { el.getAnimations().forEach(x => x.cancel()); el.style.opacity = 1; }); });
  const hit = gsvg.querySelector('.hit');
  let dragging = false;
  const show = e => {
    const { x } = toPhone(e); const i = Math.max(0, Math.min(12, Math.round((x - GRID) / ((393 - 2 * GRID) / 12))));
    const p = pts[i], col = HCOL[d.w[i]] || '#000', cur = $('gcur'), tx = $('gcurT');
    cur.setAttribute('opacity', 1); cur.setAttribute('transform', `translate(${p[0]} 0)`);
    cur.querySelector('circle').setAttribute('cy', p[1]); cur.querySelector('circle').setAttribute('fill', col);
    tx.textContent = `${String((d.start + 2 * i) % 24).padStart(2, '0')}:00  ·  ${Math.round(d.t[i])}°`;
    // the reading sits under the lines, in the temperatures row (which steps aside while dragging)
    tx.setAttribute('x', Math.max(GRID + 34, Math.min(393 - GRID - 34, p[0]))); tx.setAttribute('opacity', 1);
    gsvg.querySelectorAll('.glab').forEach(l => { l.style.transition = 'opacity .15s'; l.style.opacity = 0; });
    if (!touched.has(i)) { touched.add(i); const dot = gsvg.querySelector(`.gd[data-i="${i}"]`); dot.setAttribute('r', G.dotOn); dot.setAttribute('fill', col); }
  };
  hit.onpointerdown = e => { dragging = true; hit.setPointerCapture(e.pointerId); show(e); };
  hit.onpointermove = e => { if (dragging) show(e); };
  hit.onpointerup = hit.onpointercancel = () => { dragging = false; $('gcur')?.setAttribute('opacity', 0); $('gcurT')?.setAttribute('opacity', 0); gsvg.querySelectorAll('.glab').forEach(l => { l.style.opacity = 1; }); };
}
function toggleGraph(force) {
  const open = force ?? !graphOpen; if (open === graphOpen) return; graphOpen = open;
  anim(daysEl, [{ transform: `translateY(${open ? 0 : -46}px)` }, { transform: `translateY(${open ? -46 : 0}px)` }], { duration: MS('weekLift'), easing: 'cubic-bezier(.65,0,.25,1)' });
  chev.querySelector('svg').style.transitionDuration = D(450) + 'ms';
  chev.querySelector('svg').style.transform = open ? 'rotate(180deg)' : '';
  if (open) {
    drawGraph(true);
    // the open graph needs the bottom of the screen: the Catch shape goes back to its edge
    if (catchState === 'launch' || catchState === 'out' || catchState === 'return') {
      const from = curPose(); stopCatch(); catchState = 'rest';
      anim(catchEl, [{ transform: tf(from) }, { transform: tf(REST) }], { duration: D(450), easing: 'cubic-bezier(.65,0,.35,1)' }).then(() => { catchEl.getAnimations().forEach(x => x.cancel()); catchEl.style.transform = tf(REST); });
      catchEl.querySelector('.plus').style.opacity = 1; catchEl.querySelector('.cam').style.opacity = 0; archSvg.style.opacity = 0;
    }
  }
  else { const g = gsvg; anim(g, [{ opacity: 1 }, { opacity: 0 }], { duration: D(300) }).then(() => { if (!graphOpen) { g.innerHTML = ''; } g.getAnimations().forEach(a => a.cancel()); }); }
}

/* ---------- Catch a New Memory (option A) ---------- */
const catchEl = $('catch');
const REST = { cx: 389, cy: 734, s: 0.8, r: 21.7 }, OUT = { cx: 333, cy: 722, s: 1.15, r: 0 };
const BOX = { cx: 29 + 335 / 2, cy: 120 + 200, s: 335 / 70, r: 0 };
const tf = p => `translate(${p.cx - 35}px,${p.cy - 41.79}px) rotate(${p.r}deg) scale(${p.s})`;
let catchState = 'rest', launchTimer = 0, catchAnims = [], archRun = 0;
catchEl.style.transform = tf(REST);
const archText = $('archText'), archSvg = catchEl.querySelector('.arch');
let LOOP = 0, TXT = 0;
function archMeasure() { const p = $('archPath'); LOOP = p.getTotalLength() / 2; try { TXT = archText.getComputedTextLength(); } catch (e) { TXT = 92; } if (!TXT) TXT = 92; }
// the words sit on the shape's inner edge; "home" = centred over the top
const archHome = () => LOOP / 2 - TXT / 2;
function showCatch(on) { catchEl.style.transition = `opacity ${D(300)}ms`; catchEl.style.opacity = on ? 1 : 0; catchEl.style.pointerEvents = on ? '' : 'none'; }
function stopCatch() { clearTimeout(launchTimer); catchAnims.forEach(a => a.cancel()); catchAnims = []; archRun++; }
const cA = (el, fr, o) => { const a = el.animate(fr, { fill: 'forwards', ...o }); catchAnims.push(a); return a.finished.catch(() => {}); };
// one continuous journey along the inner edge: in → settle at the top → keep turning on the way back
function archJourney(tIn, tHold, tRet) {
  const run = ++archRun, t0 = performance.now(), home = archHome(), from = home - 130, total = tIn + tHold + tRet;
  const step = now => {
    if (run !== archRun) return;
    const t = now - t0;
    let off;
    if (t < tIn) off = lerp(from, home, EASE.out(t / tIn));                       // travels in along the edge and settles over the top
    else if (t < tIn + tHold) off = home + 6 * ((t - tIn) / tHold);              // holds, barely drifting
    else off = home + 6 + 95 * Math.pow((t - tIn - tHold) / tRet, 1.5);          // keeps turning while the shape goes back
    archText.setAttribute('startOffset', ((off % LOOP) + LOOP) % LOOP);
    const fin = Math.min(1, t / (tIn * .35)), fout = t > tIn + tHold + tRet * .35 ? Math.max(0, 1 - (t - tIn - tHold - tRet * .35) / (tRet * .65)) : 1;
    archSvg.style.opacity = Math.min(fin, fout);
    if (t < total) requestAnimationFrame(step); else archSvg.style.opacity = 0;
  };
  requestAnimationFrame(step);
}
function launchCatch(delay = 600) {
  stopCatch(); catchState = 'rest'; catchEl.style.transform = tf(REST);
  const plus = catchEl.querySelector('.plus'), cam = catchEl.querySelector('.cam');
  plus.style.opacity = 1; cam.style.opacity = 0; archSvg.style.opacity = 0;
  launchTimer = setTimeout(async () => {
    if (scr !== 'today' || day !== 0 || dState || graphOpen) return;
    if (!LOOP) archMeasure();
    catchState = 'launch';
    const ex = MS('catchExit'), ts = D(120), tt = D(1300), hold = MS('catchHold'), ret = MS('catchReturn');
    cA(catchEl, [{ transform: tf(REST) }, { transform: tf(OUT) }], { duration: ex, easing: 'cubic-bezier(.22,1,.36,1)' });
    cA(plus, [{ opacity: 1 }, { opacity: 0 }], { duration: ex * 0.3 });
    cA(cam, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: D(380), delay: ex * 0.45, easing: 'cubic-bezier(.22,1,.36,1)' });
    setTimeout(() => { if (catchState !== 'opening') archJourney(tt, hold, ret); }, ts);
    await wait(ts + tt);
    if (catchState !== 'launch') return;
    catchState = 'out';
    const drift = { ...OUT, cy: OUT.cy - 4 };
    cA(catchEl, [{ transform: tf(OUT) }, { transform: tf(drift) }], { duration: hold, easing: 'ease-in-out' });
    await wait(hold);
    if (catchState !== 'out') return;
    catchState = 'return';
    cA(cam, [{ opacity: 1 }, { opacity: 0 }], { duration: ret * .5 });
    cA(plus, [{ opacity: 0 }, { opacity: 1 }], { duration: D(300), delay: ret * .6 });
    const lean = { cx: lerp(drift.cx, REST.cx, .55), cy: lerp(drift.cy, REST.cy, .45), s: lerp(drift.s, REST.s, .5), r: 9 };
    await cA(catchEl, [{ transform: tf(drift) }, { transform: tf(lean), offset: .45 }, { transform: tf(REST) }], { duration: ret, easing: 'cubic-bezier(.65,0,.35,1)' });
    if (catchState === 'return') catchState = 'rest';
  }, D(delay));
}
const curPose = () => { const m = new DOMMatrix(getComputedStyle(catchEl).transform); const s = Math.hypot(m.a, m.b), r = Math.atan2(m.b, m.a) * 180 / Math.PI; return { cx: m.e + 35 * m.a + 41.79 * m.c, cy: m.f + 35 * m.b + 41.79 * m.d, s, r }; };
/* 19.11: the Catch shape is pulled, not tapped. Dragging it moves it a little (with resistance, as if it's being pulled out of its
   place); once it has come out far enough it carries on, in the same motion, into the camera. Let go early and it springs back.
   A plain tap gives a small tug, to show it can be pulled. */
/* 20.11: sketches for the Memories tab icon, all built from our photo shape (320×382, corners 45.7% / 38.3%) */
const ph = (x, y, w, rot = 0, acc = false, sep = false) => { const h = w * 382 / 320, cx = x + w / 2, cy = y + h / 2;
  return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${(w * .457).toFixed(2)}" ry="${(h * .383).toFixed(2)}" transform="rotate(${rot} ${cx.toFixed(2)} ${cy.toFixed(2)})"${acc ? ' data-a="1"' : ''}${sep ? ' style="stroke:var(--bg);stroke-width:1.6;paint-order:stroke"' : ''}/>`; };
const NAV_ICONS = {
  grid: { label: 'A · רשת (נוכחי)', svg: ph(1.6, 0, 8.4) + ph(12, 0, 8.4, 0, true) + ph(1.6, 12, 8.4) + ph(12, 12, 8.4) },
  two: { label: 'B · שתיים', svg: ph(-0.2, 3.6, 10.8) + ph(11.4, 3.6, 10.8, 0, true) },
  // 20.11: optically matched to FORECAST — same baseline and centre, and the same amount of ink as the ring (about 7% larger than drawn)
  pile: { label: 'C · ערימה (נבחר)', svg: '<g transform="translate(11 11) scale(1.07) translate(-11.5 -9.5)">' + ph(7.6, -0.6, 13, 14, true) + ph(1.4, 3.6, 13.4, -6, false, true) + '</g>' },
  fan: { label: 'D · מניפה', svg: ph(0, 4, 10.8, -16) + ph(11.2, 4, 10.8, 16) + ph(5.4, 1.6, 11.2, 0, true, true) },
  collage: { label: 'E · קולאז׳', svg: ph(10.4, -0.4, 11, 10, true) + ph(0, 6, 12.4, -8, false, true) },
};
function navIconPaint(on) {
  const svg = $('navMi'), k = NAV_ICONS[S.mi] ? S.mi : 'grid';
  if (svg.dataset.k !== k) { svg.innerHTML = NAV_ICONS[k].svg; svg.dataset.k = k; }
  svg.querySelectorAll('rect').forEach(r => r.setAttribute('fill', on ? (r.dataset.a ? '#3E7FBF' : '#000') : '#999'));
}
const PULL = 10, PULL_R = 20;   // 20.11: a quick flick out (was 26 / 34)   // finger distance that opens the camera; how far the shape itself can travel (rubber band)
let cDrag = null;
catchEl.addEventListener('pointerdown', e => {
  if (scr !== 'today' || catchState === 'opening') return;
  e.preventDefault(); try { catchEl.setPointerCapture(e.pointerId); } catch (_) {}
  const from = curPose(); stopCatch(); catchEl.style.transform = tf(from);
  cDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, from, k: phone.getBoundingClientRect().width / 393 || 1, d: 0, t0: performance.now() };
});
catchEl.addEventListener('pointermove', e => {
  if (!cDrag || e.pointerId !== cDrag.id) return;
  const dx = (e.clientX - cDrag.x) / cDrag.k, dy = (e.clientY - cDrag.y) / cDrag.k, d = Math.hypot(dx, dy);
  cDrag.d = Math.max(cDrag.d, d);
  const rd = PULL_R * (1 - Math.exp(-d / PULL_R)), f = d ? rd / d : 0, u = rd / PULL_R;
  catchEl.style.transform = tf({ cx: cDrag.from.cx + dx * f, cy: cDrag.from.cy + dy * f, s: cDrag.from.s * (1 + .08 * u), r: cDrag.from.r * (1 - .5 * u) });
  if (d >= PULL) { cDrag = null; catchState = 'rest'; openCamera(); }
});
const catchRelease = e => {
  if (!cDrag || e.pointerId !== cDrag.id) return;
  const c = cDrag; cDrag = null;
  const from = curPose(), plus = catchEl.querySelector('.plus'), cam = catchEl.querySelector('.cam');
  plus.style.opacity = 1; cam.style.opacity = 0; archSvg.style.opacity = 0;
  let frames;
  if (c.d < 6) {   // a tap: a small tug out and back
    const vx = OUT.cx - from.cx, vy = OUT.cy - from.cy, L = Math.hypot(vx, vy) || 1;
    const tug = { cx: from.cx + vx / L * 16, cy: from.cy + vy / L * 16, s: from.s * 1.05, r: from.r * .7 };
    frames = [{ transform: tf(from) }, { transform: tf(tug), offset: .38 }, { transform: tf(REST) }];
  } else frames = [{ transform: tf(from) }, { transform: tf(REST) }];
  catchState = 'return';
  cA(catchEl, frames, { duration: D(c.d < 6 ? 620 : 480), easing: 'cubic-bezier(.34,1.3,.64,1)' }).then(() => {
    if (catchState !== 'return') return;
    catchAnims.forEach(a => a.cancel()); catchAnims = []; catchEl.style.transform = tf(REST); catchState = 'rest';
  });
};
catchEl.addEventListener('pointerup', catchRelease);
catchEl.addEventListener('pointercancel', catchRelease);

/* ======================= screens / navigation ======================= */
let scr = 'today';
const SECT = { today: $('sToday'), cam: $('sCam'), new: $('sNew'), mem: $('sMem') };
function show(name) {
  Object.entries(SECT).forEach(([k, el]) => el.classList.toggle('hide', k !== name));
  scr = name;
  $('nav').classList.toggle('hide', !(name === 'today' || name === 'mem'));
  $('nav').classList.toggle('clear', name === 'mem');
  const f = name === 'today';
  $('navFi').setAttribute('fill', f ? '#F5C400' : '#999');
  $('navM').classList.toggle('on', name === 'mem'); $('navF').classList.toggle('on', f);
  navIconPaint(name === 'mem');
  markJump();
}
function goToday(opts = {}) {
  closeDetail(true); stopCamera(); resetReveal();
  show('today'); $('todayUI').style.opacity = 1;
  if (opts.day != null && opts.day !== day) { DAYS[day].el.classList.remove('on'); day = opts.day; DAYS[day].el.classList.add('on'); placeInd(day, true); applyDay(day); }
  else if (!curVis) applyDay(day);
  showCatch(day === 0); catchEl.style.transform = tf(REST);
  if (opts.graph != null) toggleGraph(opts.graph);
  if (day === 0 && opts.launch !== false) launchCatch(opts.launchDelay ?? 600);
}
$('navF').onclick = () => { if (scr !== 'today') goToday(); };
$('navM').onclick = () => { if (scr !== 'mem') goMem(); };

/* ======================= CAMERA ======================= */
let stream = null, camReady = false, camSource = 'sample', camFacing = 'environment';   // 22.11: front/back camera (selfie)
const vf = $('vf');
async function startCamera() {
  vf.innerHTML = ''; camReady = false; $('camAlt').innerHTML = ''; $('camFlip').classList.remove('on');
  const sample = () => { camSource = 'sample'; vf.innerHTML = ''; };   // 18.11: an empty viewfinder (plain background), not a photo from the archive
  if (S.cam === 'live' && navigator.mediaDevices?.getUserMedia) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: camFacing, width: { ideal: 1280 } }, audio: false });
      const v = document.createElement('video'); v.playsInline = true; v.muted = true; v.autoplay = true; v.srcObject = stream;
      const tr = stream.getVideoTracks()[0]; if ((tr.getSettings?.().facingMode || camFacing) === 'user') v.className = 'mirror';
      vf.appendChild(v); await v.play().catch(() => {}); camSource = 'live'; camReady = true; camFlipShow(); return;
    } catch (e) {
      sample(); $('camAlt').innerHTML = 'המצלמה החיה חסומה כאן · <label for="fileCam">לצלם עם מצלמת הטלפון</label>'; return;
    }
  }
  if (S.cam === 'phone') { camSource = 'phone'; vf.innerHTML = ''; $('camAlt').innerHTML = 'לחיצה על הכפתור פותחת את מצלמת הטלפון'; return; }
  sample(); if (S.cam === 'live') $('camAlt').innerHTML = '<label for="fileCam">לצלם עם מצלמת הטלפון</label>';
}
async function camFlipShow() {   // the flip button appears only when the phone has more than one camera
  try { const n = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput').length; $('camFlip').classList.toggle('on', n > 1); } catch (e) {}
}
$('camFlip').onclick = async () => {
  if (camSource !== 'live') return;
  camFacing = camFacing === 'user' ? 'environment' : 'user';
  vf.style.transition = `opacity ${D(140)}ms`; vf.style.opacity = 0;
  stopCamera(); await startCamera(); vf.style.opacity = 1;
};
function stopCamera() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } camReady = false; }
/* tap → the shape is "pulled out": one continuous move that first leans out of the edge, then curves into the viewfinder */
async function openCamera() {
  if (scr !== 'today' || catchState === 'opening') return;
  const from = curPose();
  stopCatch(); catchEl.style.transform = tf(from); catchState = 'opening'; toggleGraph(false);
  catchEl.querySelectorAll('svg').forEach(s => { s.style.transition = `opacity ${D(160)}ms`; s.style.opacity = 0; });
  fade($('todayUI'), 0, D(320)); $('nav').style.transition = `opacity ${D(300)}ms`; $('nav').style.opacity = 0;
  // the path: a quadratic curve whose control point sits out to the left of the button (the "pull")
  const ctrl = { cx: Math.min(from.cx, OUT.cx) - 70, cy: from.cy - 30 };
  const dur = MS('catchOpen') + D(260), ease = bezierEase(.55, 0, .2, 1), r0 = ((from.r + 540) % 360) - 180;
  const pose = u => { const e = ease(u), q = 1 - e;
    return { cx: q * q * from.cx + 2 * q * e * ctrl.cx + e * e * BOX.cx, cy: q * q * from.cy + 2 * q * e * ctrl.cy + e * e * BOX.cy,
      s: lerp(from.s, BOX.s, Math.pow(e, 1.35)), r: lerp(r0, 0, Math.min(1, e * 1.6)) }; };
  setTimeout(startCamera, D(240));   // the camera starts once the move is under way, so it never stalls the motion
  await tween(dur, x => x, u => { catchEl.style.transform = tf(pose(u)); });
  show('cam'); $('nav').style.opacity = 1;
  catchEl.style.transform = tf(REST);
  catchEl.querySelectorAll('svg').forEach(s => { s.style.transition = 'none'; s.style.opacity = ''; });
  catchEl.querySelector('.cam').style.opacity = 0; archSvg.style.opacity = 0;
  const ui = $('camUI'); ui.style.opacity = 0; await wait(D(200)); fade(ui, 1, D(350));
  catchState = 'rest';
}
async function closeCamera() {
  stopCamera(); fade($('camUI'), 0, D(200));
  const box = $('vf');
  show('today'); $('todayUI').style.opacity = 0;
  // the viewfinder shrinks back to the Catch shape at the edge
  catchEl.style.transform = tf(BOX); catchEl.querySelector('.plus').style.opacity = 0;
  await anim(catchEl, [{ transform: tf(BOX) }, { transform: tf(REST) }], { duration: MS('catchClose'), easing: 'cubic-bezier(.65,0,.35,1)' });
  catchEl.getAnimations().forEach(a => a.cancel()); catchEl.style.transform = tf(REST); catchEl.querySelector('.plus').style.opacity = 1;
  fade($('todayUI'), 1, D(350)); box.innerHTML = '';
}
$('camClose').onclick = closeCamera;
async function takePhoto(src) {
  // a quick flash: the photo was taken
  const fl = $('flash'); fl.getAnimations().forEach(a => a.cancel());
  await anim(fl, [{ opacity: 0 }, { opacity: 1 }], { duration: D(70), easing: 'ease-out' });
  stopCamera(); goNew(src);
  fl.getAnimations().forEach(a => a.cancel()); fl.style.opacity = 0;
  const f2 = document.createElement('div'); f2.className = 'flash'; f2.style.opacity = 1; $('sNew').appendChild(f2);
  anim(f2, [{ opacity: 1 }, { opacity: 0 }], { duration: D(420), easing: 'ease-out' }).then(() => f2.remove());
}
/* a stand-in photo while there is no camera: a soft plain background */
function PLAIN_SHOT() {
  const c = document.createElement('canvas'); c.width = 670; c.height = 800; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 800); gr.addColorStop(0, '#E4E4E2'); gr.addColorStop(1, '#CFCFCC'); g.fillStyle = gr; g.fillRect(0, 0, 670, 800);
  return c.toDataURL('image/jpeg', 0.8);
}
function shrinkToData(img, w, h, mirror) {
  const c = document.createElement('canvas'), tw = 670, th = 800; c.width = tw; c.height = th;
  if (mirror) { const g = c.getContext('2d'); g.translate(tw, 0); g.scale(-1, 1); }   // a selfie is kept as it was seen on screen
  const k = Math.max(tw / w, th / h), sw = tw / k, sh = th / k;
  c.getContext('2d').drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, tw, th);
  return c.toDataURL('image/jpeg', 0.82);
}
$('shutter').onclick = () => {
  if (camSource === 'live' && camReady) { const v = vf.querySelector('video'); if (v && v.videoWidth) { takePhoto(shrinkToData(v, v.videoWidth, v.videoHeight, v.classList.contains('mirror'))); return; } }
  if (camSource === 'phone') { $('fileCam').click(); return; }
  takePhoto(PLAIN_SHOT());
};
$('fileCam').onchange = e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const img = new Image(); img.onload = () => { takePhoto(shrinkToData(img, img.naturalWidth, img.naturalHeight)); URL.revokeObjectURL(img.src); }; img.src = URL.createObjectURL(f);
  e.target.value = '';
};

/* ======================= NEW MEMORY (option 2) ======================= */
let newSrc = null, chosen = null, stampEl = null;
const moodsEl = $('moods');
MOODS.forEach(m => {
  const b = document.createElement('button'); b.className = 'mood'; b.style.left = (MOOD_C[m] - MOOD_W[m] / 2) + 'px'; b.style.width = MOOD_W[m] + 'px'; b.dataset.m = m;
  b.innerHTML = moodSVG(m, 40) + `<b style="transform:translateX(${MOOD_LABEL_DX(m).toFixed(1)}px)">${m.toUpperCase()}</b>`; b.onclick = () => pickMood(m); moodsEl.appendChild(b);
});
function goNew(src) {
  newSrc = src; chosen = null;
  $('newPhoto').innerHTML = `<img src="${src}" alt="">`;
  show('new');
  const ui = $('newUI'); ui.style.transition = 'none'; ui.style.opacity = 0;
  $('moodRow').style.transition = 'none'; $('moodRow').style.opacity = 1; $('moodRow').style.pointerEvents = '';
  $('note').style.opacity = 0; $('note').style.pointerEvents = 'none'; $('noteIn').value = '';
  if (stampEl) { stampEl.remove(); stampEl = null; }
  moodsEl.querySelectorAll('.mood svg').forEach(s => { s.style.visibility = ''; });
  void ui.offsetWidth; fade(ui, 1, D(400));
}
const STAMP = { x: 330, y: 468 }, STAMP_S = 1.5;
async function pickMood(m) {
  if (chosen) return; chosen = m;
  const slot = moodsEl.querySelector(`[data-m="${m}"]`), icon = slot.querySelector('svg');
  const sx = MOOD_C[m], sy = 612;
  stampEl = document.createElement('div'); stampEl.className = 'stamp';
  stampEl.innerHTML = `<div class="sx"><div class="sy"><div class="sr">${moodSVG(m)}</div></div></div>`;
  stampEl.style.left = STAMP.x - 28 + 'px'; stampEl.style.top = STAMP.y - 28 + 'px';
  $('sNew').appendChild(stampEl); icon.style.visibility = 'hidden';
  const sxEl = stampEl.querySelector('.sx'), syEl = stampEl.querySelector('.sy'), sr = stampEl.querySelector('.sr');
  const dur = MS('moodFly');
  anim(sxEl, [{ transform: `translateX(${sx - STAMP.x}px)` }, { transform: 'translateX(0)' }], { duration: dur, easing: 'cubic-bezier(.22,1,.36,1)' });
  anim(syEl, [{ transform: `translateY(${sy - STAMP.y}px)` }, { transform: 'translateY(0)' }], { duration: dur, easing: 'cubic-bezier(.55,0,.75,.25)' });
  // 20.11: the stamp grows a little on its way to the photo's edge (×1.5)
  anim(sr, [{ transform: 'rotate(0) scale(1)' }, { transform: `rotate(10deg) scale(${STAMP_S})` }], { duration: dur, easing: 'cubic-bezier(.22,1,.36,1)' });
  anim(stampEl, [{ filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))' }, { filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.18))' }], { duration: dur });
  fade($('moodRow'), 0, D(350)); $('moodRow').style.pointerEvents = 'none';
  const note = $('note'), inp = $('noteIn'); inp.placeholder = MOOD_Q[m];
  await wait(D(250));
  fade(note, 1, D(300)); note.style.pointerEvents = 'auto';
  anim($('noteLine'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: D(500), easing: 'cubic-bezier(.65,0,.35,1)' });
  stampEl.onclick = unpickMood;
}
async function unpickMood() {
  if (!chosen || !stampEl) return;
  const m = chosen, el = stampEl, dur = MS('moodFly') * .8;
  const sx = MOOD_C[m], sy = 612;
  fade($('note'), 0, D(200)); $('note').style.pointerEvents = 'none';
  anim(el.querySelector('.sx'), [{ transform: 'translateX(0)' }, { transform: `translateX(${sx - STAMP.x}px)` }], { duration: dur, easing: 'cubic-bezier(.65,0,.35,1)' });
  anim(el.querySelector('.sy'), [{ transform: 'translateY(0)' }, { transform: `translateY(${sy - STAMP.y}px)` }], { duration: dur, easing: 'cubic-bezier(.65,0,.35,1)' });
  await anim(el.querySelector('.sr'), [{ transform: `rotate(10deg) scale(${STAMP_S})` }, { transform: 'rotate(0) scale(1)' }], { duration: dur, easing: 'cubic-bezier(.65,0,.35,1)' });
  el.remove(); stampEl = null; chosen = null;
  moodsEl.querySelector(`[data-m="${m}"] svg`).style.visibility = '';
  fade($('moodRow'), 1, D(300)); $('moodRow').style.pointerEvents = '';
}
function pressable(el, after) {
  el.addEventListener('pointerdown', () => el.classList.add('press'));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, () => el.classList.remove('press')));
  if (after) el.addEventListener('click', after);
}
pressable($('save'), async () => {
  await wait(D(160));
  const d = DAYS[0], mem = { id: 'u' + Date.now(), title: $('noteIn').value.trim() || 'A new memory', src: newSrc, date: new Date().toISOString().slice(0, 10), weather: VIS_TO_FILTER[d.vis], temp: d.temp, place: 'TEL AVIV', mood: chosen, note: $('noteIn').value.trim(), user: true };
  USER_MEM.unshift(mem);
  if (!lsSet('reform-v1-mem', USER_MEM.slice(0, 6))) say('הזיכרון נשמר רק לביקור הזה (אין מקום בדפדפן).');
  await saveStack(mem);
  goMem({ fresh: mem.id });
});
/* after Save (19.11): the photo shrinks to the middle onto a neat pile — the other photos sit exactly behind it, only one peeks out a little.
   Then only the photos of the first screen fly from the pile to their places (the approved "gather" motion); the rest are already in place.
   Pile poses are in canvas coordinates (screen y − 122). */
const PILE_W = 140, PILE_C = { x: 196.5, y: 292, rot: -3 }, PEEK = { dx: 11, dy: -6, rot: 6 };   // 19.11: a smaller pile
let PILE = { peek: null };
function pileOf(id) { const p = { x: PILE_C.x, y: PILE_C.y, rot: PILE_C.rot, w: PILE_W }; if (id === PILE.peek) { p.x += PEEK.dx; p.y += PEEK.dy; p.rot += PEEK.rot; } return p; }
const onFirstScreen = r => r.x + r.w > 0 && r.x < 393;
async function saveStack(mem) {
  const host = $('sNew'), ph = $('newPhoto');
  fade($('newUI'), 0, D(260));
  if (stampEl) { const st = stampEl; stampEl = null; anim(st, [{ opacity: 1 }, { opacity: 0 }], { duration: D(220) }).then(() => st.remove()); }
  const L = layoutFor('all', allMem());
  const firstOthers = Object.entries(L).filter(([id, r]) => id !== mem.id && onFirstScreen(r)).map(([id]) => id);
  PILE.peek = firstOthers[0] || null;
  // the one photo that peeks out from behind
  let peekEl = null;
  if (PILE.peek) {
    const m = memById(PILE.peek), p = pileOf(PILE.peek), h = PILE_W * ASPECT;
    peekEl = document.createElement('div'); peekEl.className = 'stackPh';
    peekEl.style.width = PILE_W + 'px'; peekEl.style.height = h + 'px';
    peekEl.style.transform = `translate(${p.x - PILE_W / 2}px,${p.y + CANVAS_TOP - h / 2}px) rotate(${p.rot}deg)`;
    peekEl.innerHTML = `<img src="${m.src}" alt="">`; host.insertBefore(peekEl, ph);
    // static: it simply waits behind the pile (hidden under the big photo until that has shrunk)
  }
  const k = PILE_W / 335;
  // 19.11: fast — the photo drops onto the pile at once, then the photos burst out
  await anim(ph, [{ transform: 'none' }, { transform: `translate(${PILE_C.x - 196.5}px,${PILE_C.y + CANVAS_TOP - 320}px) rotate(${PILE_C.rot}deg) scale(${k})` }], { duration: D(380), easing: 'cubic-bezier(.5,0,.2,1)' });
  await wait(D(220));
  setTimeout(() => { ph.getAnimations().forEach(a => a.cancel()); peekEl && peekEl.remove(); }, 80);
}
pressable($('reveal'));
$('newClose').onclick = () => { if (stampEl) { stampEl.remove(); stampEl = null; } goToday({ launchDelay: 900 }); };

/* ======================= MEMORIES ======================= */
const ASPECT = 400 / 335;
/* 18.11 (b): the archive uses the designer's own saved composition ("Floating Collage", exported from the RE Memories tool):
   her positions, sizes and angles for "all". A new memory takes the first place (m01's) and every photo after it moves one place on;
   extra places continue to the right. It slides sideways only. Canvas coordinates (the canvas starts at y122). */
// designer's export "Floating Collage" (18.11, 16 photos): raw positions + her composition (size .97, spacing 1.06, overlap 1.16, rotation ×3)
const SAVED_RAW = {
  m03: { x: 154, y: 9, w: 150, r: -4, z: 3 }, m04: { x: -15, y: 68, w: 123, r: 3, z: 2 }, m01: { x: 56.5, y: 227.96, w: 185, r: -2, z: 8 },
  m08: { x: -48, y: 461, w: 132, r: -6, z: 5 }, m05: { x: 244, y: 423, w: 146, r: 4, z: 6 }, m06: { x: 310, y: 118, w: 161, r: 5, z: 4 },
  m02: { x: 498, y: 15, w: 140, r: 0.5, z: 3 }, m09: { x: 441, y: 361, w: 176, r: -5, z: 7 }, m07: { x: 608, y: 189, w: 156, r: 3, z: 4 },
  m10: { x: 760, y: 20, w: 150, r: -4, z: 5 }, m11: { x: 702, y: 422.39, w: 146, r: 4, z: 6 }, m12: { x: 895, y: 456, w: 108, r: -3, z: 7 },
  m13: { x: 982, y: 26, w: 140, r: 4, z: 4 }, m14: { x: 871, y: 194.51, w: 176, r: -6, z: 5 }, m15: { x: 1128, y: 199, w: 140, r: 2.5, z: 3 },
  m16: { x: 1060, y: 420, w: 150, r: -2, z: 6 },
};
const COMP = { size: 0.97, spacing: 1.06, overlap: 1.16, rotation: 3 };
function compose(raw) {   // the RE Memories renderRect, so positions match her tool exactly
  const sizeK = COMP.size * (0.75 + 0.25 * COMP.overlap), spreadK = COMP.spacing * (1.15 - 0.15 * COMP.overlap);
  const w = raw.w * sizeK, h = w * ASPECT, cx = raw.x + raw.w / 2, cy = raw.y + raw.w * ASPECT / 2;
  const rcx = 196.5 + (cx - 196.5) * spreadK, rcy = 300 + (cy - 300) * spreadK;
  return { x: rcx - w / 2, y: rcy - h / 2, w, r: raw.r * COMP.rotation, z: raw.z };
}
const MEM_IDS = Array.from({ length: 16 }, (_, i) => 'm' + String(i + 1).padStart(2, '0'));
const SLOT_ORDER = MEM_IDS.map(k => compose(SAVED_RAW[k]));
const EXTRA_SLOTS = [{ x: 1290, y: 40, w: 150, r: 6, z: 5 }, { x: 1300, y: 420, w: 150, r: -8, z: 4 }, { x: 1450, y: 230, w: 160, r: 4, z: 5 }, { x: 1600, y: 30, w: 150, r: -5, z: 4 }, { x: 1610, y: 420, w: 150, r: 7, z: 5 }];
const BANDS = [{ y: 495 - 122, w: 165 }, { y: 308 - 122, w: 150 }, { y: 118 - 122, w: 140 }];   // filtered views: three bands, sideways strip
const COL = 110, STRIP_X0 = -55;
/* 19.11: each weather gets its own loose arrangement — the order of the three bands and every photo's offset, size and tilt are
   seeded by the weather + the photo, so SUNNY, RAINY… each look different (and stay the same every time you return to them). */
const BAND_ORDERS = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [1, 0, 2], [2, 1, 0]];
function stripSlot(i, id, filter = '') {
  const key = id + ':' + filter, j = k => (seeded(key, k) - .5);
  const ord = BAND_ORDERS[Math.floor(seeded(filter, 31) * BAND_ORDERS.length) % BAND_ORDERS.length];
  const b = BANDS[ord[i % 3]];
  const w = b.w + j(5) * 30;
  return { x: STRIP_X0 + i * COL + j(6) * 30, y: b.y + j(7) * 50, w, h: w * ASPECT, rot: j(8) * 18, z: 10 + (i % 3) };
}
/* 21.11: Noya arranges a filtered screen herself (panel → "עריכת מסך SUNNY"); her layout is kept per weather */
let CUSTOM = lsGet('reform-v1-layouts', {});
// Noya's SUNNY arrangement (21.11, from the editor) — built in, so it shows on every device
const BAKED = { sunny: {"m01":{"x":-23.2,"y":16.7,"w":150,"rot":8,"z":11},"m03":{"x":254.2,"y":383.1,"w":174,"rot":3,"z":12},"m04":{"x":138.6,"y":196.7,"w":147,"rot":-0.8,"z":10},"m10":{"x":268.3,"y":-29.5,"w":146,"rot":-4,"z":11},"m15":{"x":9.6,"y":412.4,"w":139,"rot":-11.5,"z":12}} };
function layoutFor(filter, mems) {
  const base = layoutForBase(filter, mems), C = CUSTOM[filter] || BAKED[filter];
  if (C) mems.forEach(m => { const c = C[m.id]; if (c) base[m.id] = { ...base[m.id], x: c.x, y: c.y, w: c.w, h: c.w * ASPECT, rot: c.rot, z: c.z ?? base[m.id].z }; });
  return base;
}
function layoutForBase(filter, mems) {
  const out = {};
  if (filter === 'all') {
    const users = mems.filter(m => m.user), base = mems.filter(m => !m.user);
    const order = users.concat(MEM_IDS.map(k => base.find(m => m.id === k)).filter(Boolean));
    const slots = SLOT_ORDER.concat(EXTRA_SLOTS);
    order.forEach((m, i) => { const s = slots[i % slots.length]; out[m.id] = { x: s.x, y: s.y, w: s.w, h: s.w * ASPECT, rot: s.r, z: s.z + (i === 0 && users.length ? 20 : 0) }; });
    return out;
  }
  if (mems.length <= 3) {
    const x0 = (393 - (mems.length - 1) * COL - 150) / 2 - STRIP_X0;
    mems.forEach((m, i) => { const s = stripSlot(i, m.id, filter); s.x = Math.max(8, Math.min(393 - s.w - 8, s.x + x0)); out[m.id] = s; });   // one screen: keep every photo whole
  } else mems.forEach((m, i) => { out[m.id] = stripSlot(i, m.id, filter); });
  return out;
}
function seeded(str, salt = 0) { let h = 2166136261 ^ salt; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967295; }

const cvEl = $('cv'), canvasEl = $('canvas');
let memFilter = 'all', items = {}, visible = [], pan = { x: 0, y: 0, vx: 0, vy: 0 }, memClock = 0, entry = null, hiddenId = null;
const CENTER = { x: 393 / 2, y: 300 };
function makeItem(m) {
  const el = document.createElement('div'); el.className = 'mi'; el.dataset.id = m.id;
  el.innerHTML = `<div style="border-radius:46% / ${(46 / ASPECT).toFixed(2)}%"><img src="${m.src}" alt="" draggable="false"></div>`;
  cvEl.appendChild(el);
  return { id: m.id, el, cur: null, from: null, to: null, t0: 0, dur: 0, delay: 0, op: 0, opT: null, s1: seeded(m.id, 21), s2: seeded(m.id, 22), leaving: false };
}
function recompose(animate = true) {
  // 21.11: photos you capture yourself show in ALL, but not in SUNNY (SUNNY keeps Noya's arranged five)
  const mems = allMem().filter(m => memFilter === 'all' || (m.weather === memFilter && !(memFilter === 'sunny' && m.user)));
  visible = mems.map(m => m.id);
  const L = layoutFor(memFilter, mems);
  const order = Object.entries(L).map(([id, r]) => [id, Math.hypot(r.x + r.w / 2 - CENTER.x, r.y + r.h / 2 - CENTER.y)]).sort((a, b) => a[1] - b[1]).map(e => e[0]);
  const now = memClock;
  Object.values(items).forEach(it => { if (!L[it.id] && !it.leaving) { it.leaving = true; it.opT = { from: it.op, to: 0, t0: now, dur: 0.45, sc: true }; } });
  mems.forEach(m => {
    let it = items[m.id];
    if (!it || it.leaving) { if (it) it.el.remove(); it = items[m.id] = makeItem(m); it.cur = { ...L[m.id] }; it.op = 0;
      it.opT = { from: 0, to: 1, t0: now + (animate ? order.indexOf(m.id) * 0.07 * 0.6 : 0), dur: 0.6, sc: true }; }
    const rank = order.indexOf(m.id);
    it.rank = rank;
    it.from = { ...it.cur }; it.to = { ...L[m.id] }; it.t0 = now; it.delay = animate ? rank * 0.07 * 0.6 : 0; it.dur = animate ? S.ms.recompose / 1000 : 0;
    it.el.style.zIndex = L[m.id].z;
  });
  $('empty').style.opacity = mems.length ? 0 : 1;
  pan.vx = pan.vy = 0;
  pan.y = 0; slideAnim = null; panTw++; tween(D(800), EASE.io, (e => { const sx = pan.x; return v => { pan.x = lerp(sx, 0, v); }; })());
}
// entry: compact pile → open collage (approved Memories preset "Floating Collage")
function startEntry(burst, movers) { entry = { t0: memClock, burst: !!burst, movers: movers || null }; }
const smoothE = bezierEase(.65, 0, .35, 1), burstE = bezierEase(.33, .8, .25, 1.02);
function entryState(it, t) {
  if (!entry) return null;
  if (entry.movers && !entry.movers.has(it.id)) return null;   // after Save: photos off the first screen are already in place
  const rank = entry.movers ? entry.movers.get(it.id) : it.rank;
  const local = Math.max(0, Math.min(1, (t - entry.t0 - rank * 0.07) / 1.4));
  if (local >= 1) return null;
  const r1 = seeded(it.id, 1) - .5, r2 = seeded(it.id, 2) - .5, r3 = seeded(it.id, 3) - .5, rc = it.to;
 const F = { x: rc.x + rc.w / 2, y: rc.y + rc.h / 2 };
  if (entry.burst) {   // from the pile after Save: burst out, fast then soft
    // the designer's approved "gather" motion (Floating Collage: smooth, 1.4s, stagger .07, arcing paths) — only it starts from the pile
    const p = pileOf(it.id), e = smoothE(local), vx = F.x - p.x, vy = F.y - p.y, len = Math.hypot(vx, vy) || 1, arc = Math.sin(Math.PI * e) * r2 * 110;
    return { dx: lerp(p.x, F.x, e) + (-vy / len) * arc - F.x, dy: lerp(p.y, F.y, e) + (vx / len) * arc - F.y, rot: lerp(p.rot - rc.rot, 0, e), sc: lerp(p.w / rc.w, 1, e), fk: e };
  }
  const Sp = { x: CENTER.x + r1 * 40, y: CENTER.y - 30 + r2 * 40 };
  const e = smoothE(local), vx = F.x - Sp.x, vy = F.y - Sp.y, len = Math.hypot(vx, vy) || 1, arc = Math.sin(Math.PI * e) * r2 * 110;
  const Px = lerp(Sp.x, F.x, e) + (-vy / len) * arc, Py = lerp(Sp.y, F.y, e) + (vx / len) * arc;
  return { dx: Px - F.x, dy: Py - F.y, rot: lerp(r3 * 26, 0, e), sc: lerp(0.58, 1, e) };
}
function itemRect(it) { return it.cur; }
function canvasFrame(dt) {
  memClock += dt;
  if (scr !== 'mem') return;
  // pan inertia
  cvEl.style.transform = 'none';
  const nowMs = performance.now();
  const t = memClock, fi = ED.on ? 0 : 0.6;
  for (const id in items) {
    const it = items[id];
    if (it.to && it.dur > 0) { const u = Math.max(0, Math.min(1, (t - it.t0 - it.delay) / it.dur)), e = smoothE(u);
      it.cur = { x: lerp(it.from.x, it.to.x, e), y: lerp(it.from.y, it.to.y, e), w: lerp(it.from.w, it.to.w, e), h: lerp(it.from.h, it.to.h, e), rot: lerp(it.from.rot, it.to.rot, e) }; if (u >= 1) it.dur = 0; }
    else if (it.to) it.cur = { ...it.to };
    let sc = 1;
    if (it.opT) { const u = Math.max(0, Math.min(1, (t - it.opT.t0) / it.opT.dur)), e = smoothE(u); it.op = lerp(it.opT.from, it.opT.to, e); if (it.opT.sc) sc = it.opT.to ? lerp(.6, 1, e) : lerp(1, .55, e); if (u >= 1) { it.opT = null; if (it.leaving) { it.el.remove(); delete items[id]; continue; } } }
    const es = entryState(it, t) || { dx: 0, dy: 0, rot: 0, sc: 1 };
    const fq = es.fk ?? 1;   // no floating while a photo still sits in the pile
    const p = 2 * Math.PI * ((t / (6 + it.s1 * 4)) + it.s2 * .3);
    const fx = fq * 3 * fi * (it.s1 - .3) * Math.sin(p), fy = fq * -6 * fi * Math.sin(p * 2) * .5, fr = fq * .8 * fi * (it.s2 - .5) * Math.sin(p);
    const c = it.cur; it.screen = { x: c.x, y: c.y, w: c.w, h: c.h, rot: c.rot };
    it.el.style.width = c.w + 'px'; it.el.style.height = c.h + 'px';
    it.px = slidePx(it, nowMs);
    it.el.style.transform = `translate(${c.x + es.dx + fx + it.px}px,${c.y + es.dy + fy}px) rotate(${c.rot + es.rot + fr}deg) scale(${sc * es.sc})`;
    it.el.style.opacity = id === hiddenId ? 0 : it.op;
  }
}
function bounds() {
  let a = Infinity, b = -Infinity;
  Object.values(items).forEach(it => { if (it.leaving || !it.to) return; a = Math.min(a, it.to.x); b = Math.max(b, it.to.x + it.to.w); });
  if (!isFinite(a)) return { x: [0, 0], y: [0, 0] };
  // the first and last photos may stay half out of the screen, as in the design
  return { x: [Math.min(0, 393 - b - 0), Math.max(0, -a - 60)], y: [0, 0] };
}
function clampPan() { const B = bounds(); pan.x = Math.max(B.x[0], Math.min(B.x[1], pan.x)); pan.y = 0; }
/* a swipe, not a drag: the photos don't follow the finger; when the finger lifts, they glide sideways and ease to a stop */
let panDrag = null, panTw = 0;
const easeOutCubic = u => 1 - Math.pow(1 - u, 3);
const ED = { on: false, sel: null, drag: null };
function edSave(id) {
  const it = items[id]; if (!it || !it.to) return;
  const C = CUSTOM[memFilter] || (CUSTOM[memFilter] = {});
  C[id] = { x: +it.to.x.toFixed(1), y: +it.to.y.toFixed(1), w: +it.to.w.toFixed(1), rot: +it.to.rot.toFixed(1), z: +it.el.style.zIndex || 10 };
  lsSet('reform-v1-layouts', CUSTOM);
}
function edSelect(id) {
  if (ED.sel && items[ED.sel]) items[ED.sel].el.classList.remove('edSel1');
  ED.sel = id; const it = id && items[id];
  $('edBox').classList.toggle('on', !!it);
  if (!it) return; it.el.classList.add('edSel1');
  $('edW').value = it.to.w; $('edWv').textContent = Math.round(it.to.w); $('edR').value = it.to.rot; $('edRv').textContent = it.to.rot.toFixed(1) + '°';
}
function edSet(id, patch) { const it = items[id]; if (!it) return; it.to = { ...it.to, ...patch }; if (patch.w) it.to.h = patch.w * ASPECT; it.dur = 0; it.cur = { ...it.to }; edSave(id); }
canvasEl.addEventListener('pointerdown', e => {
  const it = e.target.closest('.mi');
  if (ED.on) {   // edit mode: drag the photo itself
    if (!it) edSelect(null);   // empty space: still swipe sideways, to reach the photos off the screen
    else {
    const id = it.dataset.id, I = items[id]; edSelect(id);
    ED.drag = { id, p0: toPhone(e), x0: I.to.x, y0: I.to.y }; it.classList.add('edDrag');
    canvasEl.setPointerCapture(e.pointerId); return; }
  }
  panDrag = { id: it?.dataset.id, p0: toPhone(e), t0: performance.now() };
  canvasEl.setPointerCapture(e.pointerId);
});
canvasEl.addEventListener('pointermove', e => {
  if (ED.drag) { e.preventDefault(); const p = toPhone(e), d = ED.drag, I = items[d.id]; if (!I) return; I.to = { ...I.to, x: d.x0 + p.x - d.p0.x, y: d.y0 + p.y - d.p0.y }; I.dur = 0; I.cur = { ...I.to }; return; }
  if (panDrag) e.preventDefault(); });
/* 18.11 (c): the photos don't move as one sheet — each one sets off a little after the one before it, starting with the photos
   nearest the finger and rippling outwards (the rule from the designer's reference video: neighbours follow with a small delay) */
let slideAnim = null;
const slideEase = bezierEase(.4, 0, .2, 1), LAG_MAX = 0.07;   // 18.11: gentler — a softer start and a short ripple, so neighbours never slide over each other
function slidePx(it, now) {
  const a = slideAnim; if (!a) return pan.x;
  if (it.lag == null) { const cx = (it.screen ? it.screen.x + it.screen.w / 2 : 196) + (it.px ?? a.from); it.lag = Math.min(1, Math.abs(cx - a.origin) / 393) * LAG_MAX * 1000 * K(); }
  const u = Math.max(0, Math.min(1, (now - a.t0 - it.lag) / a.dur));
  return a.nudge ? a.from + a.dir * 14 * Math.sin(Math.PI * u) * (1 - u) : lerp(a.from, a.to, slideEase(u));
}
function slideBy(dir, speed = 0, origin = 196) {
  const B = bounds(), sx = slideAnim && !slideAnim.nudge ? slideAnim.to : pan.x, tx = Math.max(B.x[0], Math.min(B.x[1], sx + dir * (COL * 2 + Math.min(COL, speed * 0.1))));
  Object.values(items).forEach(it => { it.lag = null; });
  const nudge = tx === sx;   // at the end: a small nudge so the swipe is felt
  slideAnim = { from: sx, to: nudge ? sx : tx, t0: performance.now(), dur: D(nudge ? 420 : 900), origin, dir, nudge };
  pan.x = slideAnim.to;
  const run = ++panTw; setTimeout(() => { if (run === panTw) slideAnim = null; }, slideAnim.dur + LAG_MAX * 1000 * K() + 60);
}
const endPan = e => {
  if (ED.on && panDrag && !panDrag.id) { const g = panDrag; panDrag = null; const p = toPhone(e), dx = p.x - g.p0.x; if (Math.abs(dx) >= 18) slideBy(dx < 0 ? -1 : 1, 0, g.p0.x); return; }
  if (ED.drag) { const id = ED.drag.id; ED.drag = null; items[id]?.el.classList.remove('edDrag'); edSave(id); return; }
  if (!panDrag) return; const g = panDrag; panDrag = null;
  const p = toPhone(e), dx = p.x - g.p0.x, dy = p.y - g.p0.y, dt = Math.max(1, performance.now() - g.t0);
  if (Math.hypot(dx, dy) < 8) { if (g.id) openDetail(g.id); return; }
  if (Math.abs(dx) < Math.abs(dy) * .8 || Math.abs(dx) < 18) return;   // vertical or tiny: nothing moves
  slideBy(dx < 0 ? -1 : 1, Math.abs(dx) / dt * 1000, g.p0.x);
};
canvasEl.addEventListener('pointerup', endPan); canvasEl.addEventListener('pointercancel', () => { panDrag = null; });
let wheelLock = 0;
canvasEl.addEventListener('wheel', e => { e.preventDefault(); const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (Math.abs(d) < 8 || performance.now() < wheelLock) return; wheelLock = performance.now() + 600; slideBy(d > 0 ? -1 : 1); }, { passive: false });

function goMem(opts = {}) {
  closeDetail(true); stopCamera(); stopCatch(); resetReveal();
  show('mem'); wfSet(memFilter);
  if (opts.filter && opts.filter !== memFilter) { memFilter = opts.filter; wfSet(memFilter); }
  if (opts.fresh) { memFilter = 'all'; wfSet('all'); }
  if (opts.fresh) mbOpen = false;
  mbarMark(); mbarLayout();
  Object.values(items).forEach(it => it.el.remove()); items = {};
  pan.x = pan.y = 0; recompose(false);
  Object.values(items).forEach(it => { it.opT = null; it.op = 1; });
  if (opts.fresh && items[opts.fresh]) {
    // only the photos on the first screen leave the pile: the new one first (on top), the peeking one next, then the rest hidden behind
    const ids = Object.values(items).filter(it => it.to && onFirstScreen(it.to)).sort((a, b) => a.rank - b.rank).map(it => it.id);
    const order = [opts.fresh, PILE.peek, ...ids.filter(id => id !== opts.fresh && id !== PILE.peek)].filter(id => id && items[id]);
    const movers = new Map(order.map((id, i) => [id, i]));
    const keep = order.map(id => [items[id].el, items[id].el.style.zIndex]);
    order.forEach((id, i) => { items[id].el.style.zIndex = 60 - i; });
    setTimeout(() => keep.forEach(([el, z]) => { el.style.zIndex = z; }), D(1400 + order.length * 70 + 100));
    startEntry(true, movers);
  } else if (opts.burst) startEntry(true);
  else {   // 19.11: from the tab bar every photo is already in its place; the screen only fades in
    entry = null; const cv = $('canvas'); cv.getAnimations().forEach(a => a.cancel());
    anim(cv, [{ opacity: 0 }, { opacity: 1 }], { duration: D(260), easing: 'ease-out' });
  }
}

/* ---------- 19.11: the new Memories filter bar (Figma 01 · Components, "nav bar memories"): an outlined capsule at the height of the
   temperature number, pills in Afacad Flux Medium 14 / 20%; the bar is wider than the screen, so it scrolls sideways. The chosen
   weather fills black with light text. ---------- */
const MBAR = [['all', 'ALL'], ['sunny', 'SUNNY'], ['cloudy', 'CLOUDY'], ['rainy', 'RAINY'], ['windy', 'DUSTY'], ['heat', 'HOT']];
const mbarIn = $('mbarIn');
MBAR.forEach(([k, label]) => { const b = document.createElement('button'); b.className = 'mpill'; b.dataset.k = k; b.textContent = label; b.onclick = () => mbarPick(k); mbarIn.appendChild(b); });
/* Equal spacing: the first and last words sit 19px from the bar's outer edges (so the black pill keeps the same 5.5px inset on all
   sides), and the gap between every two words is the same. Each pill reaches 13.5px past its word, as in Noya's Figma. */
// 20.11: font 12 → the words start 16px from the frame and the black pill reaches 12px past its word, for more room to the next word
const MBAR_EDGE = 16, MBAR_PAD = 12, MBAR_LS = 2.4;   // 0.2em at 12px: the trailing letter-spacing is not part of the visible word
const mbar = $('mbar'), mbSlot = {};
let mbOpen = false;   // option B only: is the folded bar open
const mbFold = () => S.mb === 'fold';
function mbarLayout() {
  const bs = [...mbarIn.querySelectorAll('.mpill')];
  const k = phone.getBoundingClientRect().width / 393 || 1;   // the phone is scaled; measure exact (sub-pixel) word widths
  const words = bs.map(b => { const r = document.createRange(); r.selectNodeContents(b); return r.getBoundingClientRect().width / k - MBAR_LS; });
  if (words.some(w => !(w > 0))) return;   // hidden: measure again when the screen is shown
  const inner = 354 - 2 * (MBAR_EDGE - 1), gap = (inner - words.reduce((a, w) => a + w, 0)) / (bs.length - 1);
  let x = MBAR_EDGE - 1;   // -1: positions are inside the 1px border
  bs.forEach((b, i) => { mbSlot[b.dataset.k] = x - MBAR_PAD; x += words[i] + gap; });
  mbarApply(false);
}
/* Option B (19.11): the bar folds to the chosen weather alone (ALL at first). Tapping it opens the bar to the right: the frame grows,
   the chosen pill slides to its own place and the other words appear one after another. Choosing a weather closes it again. */
function mbarApply(animate, opening) {
  const bs = [...mbarIn.querySelectorAll('.mpill')], sel = bs.find(b => b.dataset.k === memFilter) || bs[0];
  mbar.classList.toggle('anim', !!animate);
  mbar.style.setProperty('--mt', D(opening ? 520 : 440) + 'ms'); mbar.style.setProperty('--ot', D(opening ? 260 : 160) + 'ms');
  const open = !mbFold() || mbOpen;
  mbar.classList.toggle('folded', !open);
  mbar.style.width = open ? '356px' : (sel.offsetWidth + 2 * 4 + 2) + 'px';   // the chosen pill, 4px inset + the 1px border on each side
  bs.forEach((b, i) => {
    const show = open || b === sel;
    b.style.left = (open ? mbSlot[b.dataset.k] : (b === sel ? 4 : mbSlot[b.dataset.k])) + 'px';
    b.style.opacity = show ? 1 : 0;
    b.style.pointerEvents = show ? '' : 'none';
    b.style.setProperty('--d', (animate && opening && b !== sel ? D(140 + i * 45) : 0) + 'ms');
  });
}
function mbarToggle(o) { if (!mbFold() || o === mbOpen) return; mbOpen = o; mbarApply(true, o); }
function mbarMark() { mbarIn.querySelectorAll('.mpill').forEach(b => b.classList.toggle('on', b.dataset.k === memFilter)); }
function mbarPick(k) {
  if (mbFold()) {
    if (!mbOpen) { mbarToggle(true); return; }
    if (k === memFilter) { mbarToggle(false); return; }
    memFilter = k; mbarMark(); recompose(true);
    setTimeout(() => mbarToggle(false), D(380));
    return;
  }
  if (k === memFilter) return; memFilter = k; mbarMark(); recompose(true);
}
let mbSwallow = false;   // a tap outside the open bar only closes it (it doesn't also open a photo)
document.addEventListener('pointerdown', e => { if (mbOpen && !mbar.contains(e.target) && phone.contains(e.target)) { e.stopPropagation(); e.preventDefault(); mbSwallow = true; mbarToggle(false); } }, true);
document.addEventListener('click', e => { if (mbSwallow) { mbSwallow = false; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('pointerup', e => { if (mbSwallow) { e.stopPropagation(); setTimeout(() => { mbSwallow = false; }, 0); } }, true);
mbarLayout(); mbarMark();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(mbarLayout);

/* ---------- weather filter (approved 15.11) — vanilla port of WeatherFilter.js (replaced by the bar above, 19.11; kept hidden) ---------- */
const FILTERS = [{ id: 'all', label: 'ALL' }, { id: 'sunny', label: 'SUNNY' }, { id: 'cloudy', label: 'CLOUDY' }, { id: 'rainy', label: 'RAINY' }, { id: 'windy', label: 'DUSTY' }, { id: 'heat', label: 'HOT' }];
const wf = $('wf'), wfItems = {}, wfS = { sel: 'all', open: false, busy: false, swallow: false };
const wfCap = document.createElement('i'); wfCap.className = 'wf-cap'; wf.appendChild(wfCap);
FILTERS.forEach(f => {
  const b = document.createElement('button'); b.className = 'wf-item'; b.dataset.k = f.id;
  b.innerHTML = `<span class="wf-in"><b class="wf-name">${f.label}</b></span>`;
  b.onclick = () => wfTap(f.id); wf.appendChild(b); wfItems[f.id] = b;
});
const wfChev = document.createElement('span'); wfChev.className = 'wf-chev';
wfChev.innerHTML = '<svg width="8" height="5" viewBox="0 0 8 5"><polyline points="0.5,0.5 4,4 7.5,0.5" fill="none" stroke="#000" stroke-width="1"/></svg>'; wf.appendChild(wfChev);
const FV = { A: { padCur: 13, chev: -20, gap: 6 }, B: { padCur: 13, chev: -20, gap: 6 }, C: { padCur: 13, chev: -18, gap: 4 }, D: { padCur: 2, chev: 6, gap: 14 } };
const ROW_W = 335;   // 17.11: same 29px margin on both sides as every other screen
const fvc = () => FV[S.fv] || FV.A, padBase = () => 2;
function wfApplyVariant() { wf.className = 'wf fv' + (S.fv || 'A'); wfS.open = false; wfRest(); }
const wW = k => wfItems[k].offsetWidth, rowKeys = () => FILTERS.map(f => f.id).filter(k => k !== wfS.sel), rowStart = () => wW(wfS.sel) + fvc().gap;
const rowX = k => { const ks = rowKeys(), st = rowStart(), gap = (ROW_W - st - ks.reduce((a, x) => a + wW(x), 0)) / ks.length; let x = st + gap; for (const q of ks) { if (q === k) break; x += wW(q) + gap; } return x; };
const startX = k => { const from = rowStart() - 8; return from + (rowX(k) - from) * 0.3; };
const chevX = k => wW(k) + fvc().chev, T = (x, ex = '') => `translate(${x}px,0px)${ex}`;
const wa = (el, fr, o) => el.animate(fr, { fill: 'forwards', ...o, duration: D(o.duration), delay: D(o.delay || 0) }).finished.catch(() => {});
function wfPlace(k, x, on) { const b = wfItems[k]; b.getAnimations().forEach(a => a.cancel()); b.style.transform = T(x); b.style.opacity = on ? 1 : 0; b.style.pointerEvents = on ? 'auto' : 'none'; }
function wfChevSet(open, dur) { wfChev.getAnimations().forEach(a => a.cancel()); const to = `${T(chevX(wfS.sel))} rotate(${open ? 90 : -90}deg)`; if (!dur) { wfChev.style.transform = to; wfChev.style.opacity = 1; return Promise.resolve(); } const from = getComputedStyle(wfChev).transform; return wa(wfChev, [{ transform: from === 'none' ? to : from }, { transform: to }], { duration: dur, easing: 'cubic-bezier(.34,1.56,.64,1)' }); }
function wfMarkCur() { FILTERS.forEach(f => wfItems[f.id].classList.toggle('cur', f.id === wfS.sel)); }
function wfCapTo(w, dur, ease) { wfCap.getAnimations().forEach(a => a.cancel()); if (!dur) { wfCap.style.width = w + 'px'; return Promise.resolve(); } const from = wfCap.getBoundingClientRect().width / (phone.getBoundingClientRect().width / 393); wfCap.style.width = w + 'px'; return wa(wfCap, [{ width: from + 'px' }, { width: w + 'px' }], { duration: dur, easing: ease }); }
function wfRest() { wfMarkCur(); FILTERS.forEach(f => wfPlace(f.id, f.id === wfS.sel ? 0 : rowX(f.id), f.id === wfS.sel)); wfS.open = false; wfChevSet(false); wfCapTo(wW(wfS.sel)); }
function wfSet(k) { wfS.sel = k; wfRest(); }
async function wfOpen() { if (wfS.open || wfS.busy) return; wfS.busy = true; wfS.open = true; const jobs = [wfChevSet(true, 450)];
  if (S.fv === 'C') jobs.push(wfCapTo(ROW_W, S.ms.filterOpen, 'cubic-bezier(.33,1,.68,1)'));
  rowKeys().forEach(k => { const x = rowX(k); wfPlace(k, x, true); jobs.push(wa(wfItems[k], [{ transform: T(startX(k)), opacity: 0 }, { opacity: 1, offset: .4 }, { transform: T(x), opacity: 1 }], { duration: S.ms.filterOpen, easing: 'cubic-bezier(.33,1,.68,1)' })); });
  await Promise.all(jobs); wfS.busy = false; markJump(); }
async function wfClose() { wfS.busy = true; const jobs = [wfChevSet(false, 450)], dur = S.ms.filterOpen * 490 / 750;
  if (S.fv === 'C') jobs.push(wfCapTo(wW(wfS.sel), dur, 'cubic-bezier(.65,0,.35,1)'));
  rowKeys().forEach(k => { wfItems[k].style.pointerEvents = 'none'; jobs.push(wa(wfItems[k], [{ transform: T(rowX(k)), opacity: 1 }, { opacity: 1, offset: .5 }, { transform: T(startX(k)), opacity: 0 }], { duration: dur, easing: 'cubic-bezier(.65,0,.35,1)' })); });
  await Promise.all(jobs); wfRest(); wfS.busy = false; markJump(); }
async function wfPick(k) {
  wfS.busy = true; const old = wfS.sel, fromX0 = rowX(k), oldC = chevX(old), others = rowKeys().filter(x => x !== k); wfS.sel = k; const jobs = [];
  others.forEach(x => { const el = wfItems[x], m = new DOMMatrix(getComputedStyle(el).transform).m41; el.style.pointerEvents = 'none'; jobs.push(wa(el, [{ opacity: 1, transform: T(m) }, { opacity: 0, transform: T(m) }], { duration: 350, easing: 'ease-out' })); });
  jobs.push(wa(wfItems[old], [{ opacity: 1, transform: T(0) }, { opacity: 0, transform: T(0, ' scale(.9)') }], { duration: 220, easing: 'ease-in' }));
  // the chosen word takes its frame at once and glides with it to the left slot (text stays where it was)
  wfItems[old].classList.remove('cur'); wfItems[k].classList.add('cur');
  const fromX = fromX0 - (fvc().padCur - padBase());
  wfItems[k].style.pointerEvents = 'none';
  jobs.push(wa(wfItems[k], [{ transform: T(fromX) }, { transform: T(0) }], { duration: S.ms.filterPick, easing: 'cubic-bezier(.65,0,.25,1)' }));
  if (S.fv === 'C') jobs.push(wfCapTo(wW(k), S.ms.filterPick, 'cubic-bezier(.65,0,.25,1)'));
  const nx = chevX(k); wfChev.getAnimations().forEach(a => a.cancel());
  jobs.push(wa(wfChev, [{ transform: `${T(oldC)} rotate(90deg)`, opacity: 1 }, { transform: `${T(oldC)} rotate(90deg)`, opacity: 1, offset: .15 }, { transform: `${T(oldC)} rotate(90deg)`, opacity: 0, offset: .35 }, { transform: `${T(nx)} rotate(-90deg)`, opacity: 0, offset: .7 }, { transform: `${T(nx)} rotate(-90deg)`, opacity: 1 }], { duration: 750, easing: 'linear' }));
  setTimeout(() => { memFilter = k; recompose(true); }, D(250));
  await Promise.all(jobs); wfRest(); wfS.busy = false; markJump();
}
function wfTap(k) { if (wfS.busy) return; if (k === wfS.sel) { wfS.open ? wfClose() : wfOpen(); return; } if (wfS.open) wfPick(k); }
document.addEventListener('pointerdown', e => { if (!wfS.open || wfS.busy || scr !== 'mem') return; if (Object.values(wfItems).some(el => el.contains(e.target))) return; if (!phone.contains(e.target)) return; e.stopPropagation(); e.preventDefault(); wfS.swallow = true; wfClose(); }, true);
document.addEventListener('click', e => { if (wfS.swallow) { wfS.swallow = false; e.stopPropagation(); e.preventDefault(); } }, true);

/* ======================= MEMORY DETAIL (approved 15.11) ======================= */
const det = $('sDet'), strip = $('dstrip'), dshape = $('dshape');
let dState = null;
const TARGET = { x: 36, y: 214, w: 320, h: 382 };   // 21.11: back to the app's fixed photo proportion 320×382 (v1.36 had stretched it to 452)   // 20.11 (v1.36): as in Figma "Transition demo" — 320×452 at y214 (was 382 tall at y212)
const NB_X = 400, NB_ROT_IN = 5.2, NB_ROT_OUT = 2.8;   // v1.36: from Figma — neighbours wait 400px aside; the next photo comes in turned 5.2°, the one leaving goes out turned 2.8°
const tiltOf = i => (i % 2 ? 1.2 : -1.2);
function photoEl(m) { const d = document.createElement('div'); d.className = 'dph'; d.style.borderRadius = `45.7% / ${(45.7 * 320 / TARGET.h).toFixed(1)}%`; d.innerHTML = `<img src="${m.src}" alt="">`; strip.appendChild(d); return d; }
function setBox(el, b) { el.style.width = b.w + 'px'; el.style.height = b.h + 'px'; el.style.transform = `translate(${b.x}px,${b.y}px) rotate(${b.rot}deg)`; }
const CANVAS_TOP = 160;   // 19.11: the canvas starts under the new filter bar
function canvasRectOf(id) { const it = items[id]; if (!it || !it.screen) return null; const c = it.screen; return { x: c.x + (it.px ?? pan.x), y: c.y + CANVAS_TOP, w: c.w, h: c.h, rot: c.rot }; }
function fillInfo(m) {
  // 21.11: weather and place written like the rest of the sentence (Hot · Tel Aviv), not in capitals
  const tc = t => (t || '').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
  $('ddate').textContent = `${fmtDate(m.date)} · ${m.temp}°C · ${tc(WLABEL[m.weather])} · ${tc(m.place)}`;
  $('dmood').innerHTML = m.mood ? moodSVG(m.mood, 22) : '';
  $('dnote').textContent = noOrphan(m.note);
}
/* 20.11 (v2): around every photo there are (at least) two shapes taken from its weather's forecast image — as on the Memory Reveal
   screen (the sun + the stripes). Each memory places them differently around the photo (seeded, so always the same for that photo).
   While you swipe, every shape travels — position, turn, size — to where its counterpart sits on the next photo, and cross-fades
   into it. (v3 below: they now leave and enter sideways instead.) */
const DPARTS = (() => {
  const stripes = (col, n = 4, len = 250, w = 18, gap = 40) => Array.from({ length: n }, (_, i) => `<rect x="${-len / 2}" y="${(i - (n - 1) / 2) * gap - w / 2}" width="${len}" height="${w}" fill="${col}"/>`).join('');
  const dots = (cols, rows, dx = 29.6, dy = 33.3, r = 7.5) => { let o = '<g fill="#000">'; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) o += `<circle cx="${((x - (cols - 1) / 2) * dx).toFixed(1)}" cy="${((y - (rows - 1) / 2) * dy).toFixed(1)}" r="${r}"/>`; return o + '</g>'; };
  const ring = '<path fill="#F5C400" fill-rule="evenodd" d="M-112 0a112 112 0 1 0 224 0a112 112 0 1 0 -224 0ZM-46 0a46 46 0 1 0 92 0a46 46 0 1 0 -92 0Z"/>';   // 20.11: back to the earlier size
  const rain = (() => { const L = 77, a = -40.8 * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a); let o = '<g stroke="#000" stroke-width="17">';
    for (let i = 0; i < 5; i++) { const x = (i - 2) * 25.3 - ux * L / 2, y = (i - 2) * 28 - uy * L / 2; o += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + ux * L).toFixed(1)}" y2="${(y + uy * L).toFixed(1)}"/>`; } return o + '</g>'; })();
  return {
    sunny: [ring, stripes('#3E7FBF', 4, 294, 18.5, 39)],
    cloudy: [stripes('#3E7FBF', 4, 294, 18.5, 39), '<circle r="52" fill="#9E9E9E"/>'],
    rainy: [rain, '<circle r="41" fill="#3E7FBF"/>'],
    windy: [dots(5, 5), dots(3, 3)],
    heat: [`<polygon fill="#CD5341" points="${starPts(0, 0, 91.5, 75, 24, 10)}"/>`, dots(5, 4)],
  };
})();
/* v1.36 — as in Noya's Figma "Transition demo · 06 → 02" / "02 → 06" (file ioJ7f463hE7GHaIjgVmK7Q, 265:15225 + 265:15252).
   Every shape has a resting place (centre x/y, turn r) and an "away" place it leaves to / comes in from, on its own side.
   06 = Turquoise Bay (m04) and 02 = Golden Hour Together (m09) copy the Figma shapes and places exactly. */
const FIG_PARTS = {
  // the sun ring (outer r 113.5, hole r 36.07) · the rain: five black bars (16.95) with the blue circle — unturned, as in "02 → 06"
  ring: '<path fill="#F5C400" fill-rule="evenodd" d="M-113.5 0a113.5 113.5 0 1 0 227 0a113.5 113.5 0 1 0 -227 0ZM-36.07 0a36.07 36.07 0 1 0 72.14 0a36.07 36.07 0 1 0 -72.14 0Z"/>',
  rain: '<g stroke="#000" stroke-width="16.95"><line x1="-25.34" y1="59.51" x2="10.88" y2="-8.03"/><line x1="-60.23" y1="40.76" x2="-24.01" y2="-26.78"/><line x1="-92.59" y1="24.77" x2="-56.37" y2="-42.77"/><line x1="7.81" y1="76.79" x2="44.03" y2="9.25"/><line x1="41.43" y1="94.16" x2="77.65" y2="26.62"/></g><ellipse cx="-13.2" cy="-40.8" rx="40.27" ry="40.97" transform="rotate(47.55 -13.2 -40.8)" fill="#3E7FBF"/>',
  // the red star (22 points, 182.86 across) with its soft shadow · the 5×5 dots (133×148)
  star: '<polygon filter="url(#figStarSh)" fill="#D6402B" points="0.00,-91.43 10.41,-72.40 25.76,-87.73 30.39,-66.53 49.43,-76.92 47.90,-55.28 69.10,-59.87 61.53,-39.54 83.17,-37.98 70.18,-20.61 90.50,-13.01 73.14,0.00 90.50,13.01 70.18,20.61 83.17,37.98 61.53,39.55 69.10,59.87 47.90,55.28 49.43,76.92 30.39,66.53 25.76,87.73 10.41,72.40 0.00,91.43 -10.41,72.40 -25.76,87.73 -30.39,66.53 -49.43,76.92 -47.90,55.28 -69.10,59.87 -61.53,39.54 -83.17,37.98 -70.18,20.61 -90.50,13.01 -73.14,-0.00 -90.50,-13.01 -70.18,-20.61 -83.17,-37.98 -61.53,-39.54 -69.10,-59.87 -47.90,-55.28 -49.43,-76.92 -30.39,-66.53 -25.76,-87.73 -10.41,-72.40"/>',
  dots: (() => { const X = [7, 36.5, 66.5, 96.5, 125.5], Y = [7.5, 41, 73.5, 107, 140.5]; let o = '<g fill="#000">'; Y.forEach(y => X.forEach((x, i) => { o += `<ellipse cx="${(x - 66.5).toFixed(1)}" cy="${(y - 74).toFixed(1)}" rx="${i ? 7.5 : 7}" ry="${y === 41 || y === 107 ? 7 : 7.5}"/>`; })); return o + '</g>'; })(),
};
const FIG = {
  m04: { parts: [FIG_PARTS.ring, FIG_PARTS.rain],
    pl:   [{ x: -11.66, y: 304.93, r: 0, s: 1 }, { x: 369.11, y: 446.16, r: 21.01, s: 1 }],
    away: [{ x: -331.66, y: 304.93, r: 0, s: 1 }, { x: 687.61, y: 454.16, r: 0, s: 1 }] },
  m09: { parts: [FIG_PARTS.star, FIG_PARTS.dots],
    pl:   [{ x: 12.92, y: 600.92, r: -10, s: 1 }, { x: 334.5, y: 297, r: 0, s: 1 }],
    away: [{ x: -287.08, y: 660.92, r: 110, s: 1 }, { x: 654.5, y: 297, r: 0, s: 1 }] },
};
/* every other memory: the same pattern with its own weather's shapes — the first (bigger) shape half off the screen at one edge,
   the second on the photo's edge on the other side — taken from the two Figma layouts (and their mirror images), chosen per photo */
const FIG_SPOTS = [[[-11.66, 304.93], [369.11, 446.16]], [[12.92, 600.92], [334.5, 297]]];
const GEN_AWAY_X = 320, GEN_AWAY_R = 20;
const _reach = {};
function partReach(svg, r) {   // how far a shape reaches below its centre at turn r (measured once per shape and turn)
  const k = svg.length + ':' + svg.slice(0, 40) + ':' + Math.round(r); if (k in _reach) return _reach[k];
  const g = document.createElementNS(NS, 'g'); g.innerHTML = svg; g.setAttribute('transform', `rotate(${r})`); g.style.visibility = 'hidden'; dshape.appendChild(g);
  const b = g.getBBox(), a = r * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const ys = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => x * s + y * c);
  g.remove(); return (_reach[k] = Math.max(...ys));
}   // as in Figma, they leave ~320px outwards on their own side (and turn a little)

/* 21.11 — Noya's redesign of three memory screens (main Figma file, frames 435:5683 / 435:5729 / 435:5760), copied exactly:
   m05 (Hot): red star + dots · m02 (Cloudy): blue stripes + the yellow sun arc · m13 (Rainy): black rain + six blue drops.
   Each shape: resting centre (x, y) and turn r; it leaves / arrives 320px out on its own side, as in the Figma transition demo. */
const NOYA = {
  m05: [['<path transform="translate(-132.95 -133.27)" fill="#CD5441" d="M107.523 35.4121L122.746 51.0654L133.607 32.2656L144.193 51.2481L159.56 35.981L164.959 57.0859L183.818 46.3006L183.532 68.1748L204.531 62.6096L198.664 83.627L220.41 83.673L209.304 102.463L230.27 108.21L214.756 123.422L233.53 134.42L214.679 144.959L229.956 160.466L208.966 165.784L219.798 184.776L198.014 184.383L203.658 205.497L182.7 199.504L182.76 221.342L163.995 210.098L158.374 231.124L143.15 215.471L132.29 234.271L121.704 215.288L106.336 230.555L100.938 209.451L82.0783 220.236L82.3641 198.362L61.3659 203.927L67.2323 182.909L45.4861 182.863L56.5923 164.073L35.6264 158.326L51.1401 143.114L32.3664 132.116L51.2178 121.578L35.9402 106.071L56.9303 100.752L46.0986 81.7602L67.8824 82.1535L62.2386 61.0392L83.1962 67.0326L83.1364 45.1944L101.902 56.4389L107.523 35.4121Z"/>', 382.95, 517.27, 0],
        [null, 58.5, 291.98, 5.65]],
  m02: [[null, 422.42, 485.49, -28.98],
        ['<path transform="translate(0.35 -113.52)" fill="#F5C400" d="M-30.9844 3.73438C29.6474 -12.1536 91.6793 24.1183 107.567 84.75C123.455 145.382 87.1836 207.414 26.5518 223.302C-34.08 239.19 -96.1119 202.918 -112 142.286C-68.1634 66.4865 -68.1635 65.9746 -30.9844 3.73438ZM-1.65625 76.8662C-21.5749 76.8662 -37.7227 93.014 -37.7227 112.933C-37.7226 132.851 -21.5748 148.998 -1.65625 148.998C18.2621 148.998 34.4091 132.851 34.4092 112.933C34.4092 93.0141 18.2622 76.8664 -1.65625 76.8662Z"/>', -0.35, 309.52, 0]],
  m13: [[null, 346.36, 516.45, 70.25],
        ['<g fill="#3E7FBF"><ellipse cx="-8.17" cy="-73.92" rx="29" ry="28" transform="rotate(21.22 -8.17 -73.92)"/><ellipse cx="55.68" cy="-49.12" rx="28.5" ry="28" transform="rotate(21.22 55.68 -49.12)"/><ellipse cx="32.15" cy="11.47" rx="28.5" ry="29" transform="rotate(21.22 32.15 11.47)"/><ellipse cx="-31.70" cy="-13.33" rx="29" ry="29" transform="rotate(21.22 -31.70 -13.33)"/><ellipse cx="-55.05" cy="46.79" rx="29" ry="28.5" transform="rotate(21.22 -55.05 46.79)"/><ellipse cx="8.85" cy="73.27" rx="28.5" ry="28.5" transform="rotate(21.22 8.85 73.27)"/></g>', 39.4, 282.52, 0]],
};
const NOYA_STD = { m05: [null, 'heat:1'], m02: ['cloudy:0', null], m13: ['rainy:0', null] };
Object.entries(NOYA).forEach(([id, ps]) => {
  const parts = ps.map((p, i) => p[0] || DPARTS[NOYA_STD[id][i].split(':')[0]][+NOYA_STD[id][i].split(':')[1]]);
  const pl = ps.map(p => ({ x: p[1], y: p[2], r: p[3], s: 1 }));
  FIG[id] = { exact: true, parts, pl, away: pl.map(q => { const sd = q.x < 196.5 ? -1 : 1; return { ...q, x: q.x + sd * GEN_AWAY_X, r: q.r + sd * GEN_AWAY_R }; }) };
});
const TEXT_Y = 625;   // top of the date line (photo bottom 596 + 29)
function placesOf(m) {
  // 21.11: the photo is 382 high again (ends y 596, text at 625) — shapes stay clear of the text
  if (FIG[m.id] && FIG[m.id].exact) return FIG[m.id].pl.map((p, i) => ({ ...p, away: FIG[m.id].away[i] }));
  if (FIG[m.id]) return FIG[m.id].pl.map((p, i) => { const y = Math.min(p.y, TEXT_Y - 3 - partReach(FIG[m.id].parts[i], p.r)), dy = y - p.y; return { ...p, y, away: { ...FIG[m.id].away[i], y: FIG[m.id].away[i].y + dy } }; });
  const j = k => seeded(m.id, 60 + k) - .5, pick = Math.floor(seeded(m.id, 59) * 4) % 4;
  const spot = FIG_SPOTS[pick % 2], flip = pick > 1, svgs = DPARTS[m.weather] || DPARTS.cloudy;
  return spot.map((p, i) => {
    const r = j(i * 4 + 2) * (i ? 70 : 50);
    // keep the text clear: a shape low on the screen ends where the Figma star ends (y 692), never over the text at y 695
    const y = Math.min(p[1] + j(i * 4 + 1) * 40, TEXT_Y - 3 - partReach(svgs[i], r));
    const x = flip ? 393 - p[0] : p[0], pl = { x, y, r, s: 1 }, sd = x < 196.5 ? -1 : 1;
    return { ...pl, away: { ...pl, x: pl.x + sd * GEN_AWAY_X, r: pl.r + sd * GEN_AWAY_R } };
  });
}
const placeT = p => `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.r.toFixed(2)}) scale(${p.s.toFixed(3)})`;
const lerpPlace = (a, b, e) => ({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), r: lerp(a.r, a.r + ((((b.r - a.r) % 360) + 540) % 360 - 180), e), s: lerp(a.s, b.s, e) });
function mkParts(m, op) {
  const svgs = FIG[m.id] ? FIG[m.id].parts : (DPARTS[m.weather] || DPARTS.cloudy);
  return svgs.map((sv, i) => { const g = document.createElementNS(NS, 'g'); g.classList.add('dpart'); g.dataset.i = i; g.innerHTML = sv; g.style.opacity = op; dshape.appendChild(g); return g; });
}
function drawShape(m, fromSide) {
  const G = { m, els: mkParts(m, 1), pl: placesOf(m), next: null };
  G.els.forEach((g, i) => g.setAttribute('transform', placeT(G.pl[i])));
  const off = 150 * (fromSide || (G.pl[0].x > 196 ? 1 : -1)), outE = bezierEase(.16, 1, .3, 1);
  G.entry = true;
  G.els.forEach((g, i) => { g.style.opacity = 0; g.setAttribute('transform', placeT({ ...G.pl[i], x: G.pl[i].x + off }));
    tween(D(900), outE, e => { if (!G.entry || G.els[i] !== g) return; g.style.opacity = Math.min(1, e * 1.6); g.setAttribute('transform', placeT({ ...G.pl[i], x: G.pl[i].x + off * (1 - e) })); }, D((fromSide ? 120 : 300) + i * 90))
      .then(() => { if (G.entry && G.els[i] === g) { g.style.opacity = 1; g.setAttribute('transform', placeT(G.pl[i])); } }); });
  setTimeout(() => { G.entry = false; }, D(1300));
  if (dState) dState.G = G;
  return G;
}
// the shared morph: p = 0 → this memory's shapes, p = 1 → the next memory's shapes
function morphPrep(G, nm) {
  G.entry = false;
  if (G.next && G.next.m === nm) return G.next;
  morphDrop(G); const els = mkParts(nm, 0); G.next = { m: nm, els, pl: placesOf(nm) }; return G.next;
}
function morphDrop(G) { if (G.next) { G.next.els.forEach(g => g.remove()); G.next = null; } }
/* v1.36, as in Noya's Figma "Transition demo": each shape goes from its resting place to its own "away" place (position, turn, size)
   while the next photo's shapes come from their away places to rest — all with the swipe. */
function morphSet(G, p) {
  const N = G.next; if (!N) return;
  G.els.forEach((g, i) => { const pl = G.pl[i]; g.style.opacity = 1; g.setAttribute('transform', placeT(lerpPlace(pl, pl.away, p))); });
  N.els.forEach((g, i) => { const pl = N.pl[i]; g.style.opacity = 1; g.setAttribute('transform', placeT(lerpPlace(pl.away, pl, p))); });
}
function morphCommit(G) { const N = G.next; G.els.forEach(g => g.remove()); G.m = N.m; G.els = N.els; G.pl = N.pl; G.next = null; G.els.forEach((g, i) => { g.style.opacity = 1; g.setAttribute('transform', placeT(G.pl[i])); }); }
// 20.11: dragging the shapes by hand was removed (Noya: it didn't look good)
const noOrphan = t => (t || '').replace(/\s+(\S+)\s*$/, ' $1');   // 20.11: never leave the last word alone on a line
function buildNeighbors() {
  const { list, idx } = dState;
  [-1, 1].forEach(s => { const m = memById(list[idx + s]); if (!m) return; const el = photoEl(m); const b = { ...TARGET, x: TARGET.x + s * NB_X, rot: s * NB_ROT_IN }; setBox(el, b); el.dataset.side = s; dState.n[s] = { el, b }; });
}
async function openDetail(id, from, only) {
  if (dState) return;
  // 21.11: the three photos Noya designed always swipe in her Figma order (Hot → Cloudy → Rainy), wherever you open them from
  const list = only ? only.slice() : SHOW3.includes(id) ? SHOW3.slice() : scr === 'mem' ? visible.slice() : [id], idx = Math.max(0, list.indexOf(id)), m = memById(id);
  const src = from || canvasRectOf(id) || { x: 196 - 40, y: 426 - 48, w: 80, h: 96, rot: 0 };
  dState = { id, list, idx, n: {}, from: src, origin: scr };
  hiddenId = scr === 'mem' ? id : null;
  strip.innerHTML = ''; dshape.innerHTML = '';
  det.classList.remove('hide'); markJump();
  const bg = $('detBg'); bg.style.opacity = 0; fade(bg, 1, D(450));
  const el = photoEl(m); dState.cur = el; setBox(el, src);
  fillInfo(m); const info = $('dinfo'); info.style.transition = 'none'; info.style.opacity = 0; info.style.transform = 'translateY(10px)';
  $('back').style.opacity = 0;
  dState.shape = drawShape(m);
  const to = { ...TARGET, rot: tiltOf(idx) };
  await tween(MS('detailOpen'), EASE.io, e => setBox(el, { x: lerp(src.x, to.x, e), y: lerp(src.y, to.y, e), w: lerp(src.w, to.w, e), h: lerp(src.h, to.h, e), rot: lerp(src.rot, to.rot, e) }));
  void info.offsetWidth; info.style.transition = ''; info.style.opacity = 1; info.style.transform = 'none'; fade($('back'), 1, D(300));
  if (dState) buildNeighbors();
}
async function closeDetail(instant) {
  if (!dState) return; const st = dState;
  if (instant) { det.classList.add('hide'); dState = null; hiddenId = null; return; }
  if (st.busy) return; st.busy = true;
  const m = memById(st.list[st.idx]);
  if (st.origin === 'mem' && m.id !== st.id) { hiddenId = m.id; }
  const to = (st.origin === 'mem' && canvasRectOf(m.id)) || st.from;
  Object.values(st.n).forEach(n => n.el.remove()); st.n = {};
  $('dinfo').style.opacity = 0; fade($('back'), 0, D(150));
  [...dshape.children].forEach(g => anim(g, [{ opacity: 1 }, { opacity: 0 }], { duration: D(300) }));
  const el = st.cur, b = { ...TARGET, rot: tiltOf(st.idx) };
  fade($('detBg'), 0, D(500));
  await tween(D(650), EASE.io, e => setBox(el, { x: lerp(b.x, to.x, e), y: lerp(b.y, to.y, e), w: lerp(b.w, to.w, e), h: lerp(b.h, to.h, e), rot: lerp(b.rot, to.rot, e) }));
  if (st.origin !== 'mem') await anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: D(200) });
  det.classList.add('hide'); dState = null; hiddenId = null; markJump();
}
$('back').onclick = () => closeDetail();
// swipe between memories
let sw = null;
det.addEventListener('pointerdown', e => { if (!dState || dState.busy || e.target.closest('#back')) return; sw = { x0: toPhone(e).x, dx: 0 }; det.setPointerCapture(e.pointerId); });
det.addEventListener('pointermove', e => {
  if (!sw) return; const st = dState; let dx = toPhone(e).x - sw.x0;
  if ((dx > 0 && !st.n[-1]) || (dx < 0 && !st.n[1])) dx *= 0.3; sw.dx = dx;
  setBox(st.cur, { ...TARGET, x: TARGET.x + dx, rot: tiltOf(st.idx) + dx / NB_X * -5 });
  Object.entries(st.n).forEach(([s, n]) => setBox(n.el, { ...n.b, x: n.b.x + dx, rot: lerp(n.b.rot, tiltOf(st.idx + +s), Math.min(1, Math.abs(dx) / NB_X)) }));
  // 20.11: the shapes follow the finger — they are already on their way to the next photo's shapes
  const s1 = dx < 0 ? 1 : -1, nm = st.n[s1] && memById(st.list[st.idx + s1]);
  if (st.G && nm) { morphPrep(st.G, nm); morphSet(st.G, Math.min(1, Math.abs(dx) / NB_X)); }
  else if (st.G && st.G.next) { morphSet(st.G, 0); morphDrop(st.G); st.G.els.forEach(g => g.style.opacity = 1); }
  $('dinfo').style.opacity = Math.max(0, 1 - Math.abs(dx) / 120);
});
const swEnd = async () => {
  if (!sw) return; const st = dState, dx = sw.dx; sw = null;
  const dir = dx < -70 && st.n[1] ? 1 : dx > 70 && st.n[-1] ? -1 : 0;
  const dur = MS('detailSwipe'), G = st.G, p0 = Math.min(1, Math.abs(dx) / NB_X);
  if (!dir) {
    const cur = st.cur; st.busy = true;
    await tween(D(320), EASE.out, e => { const x = dx * (1 - e); setBox(cur, { ...TARGET, x: TARGET.x + x, rot: tiltOf(st.idx) + x / NB_X * -5 }); Object.values(st.n).forEach(n => setBox(n.el, { ...n.b, x: n.b.x + x })); if (G && G.next) morphSet(G, p0 * (1 - e)); });
    if (G) { morphDrop(G); G.els.forEach((g, i) => { g.style.opacity = 1; g.setAttribute('transform', placeT(G.pl[i])); }); }
    $('dinfo').style.opacity = 1; st.busy = false; return;
  }
  st.busy = true;
  const next = st.n[dir], cur = st.cur, prevOther = st.n[-dir];
  const nb = next.b, nTo = tiltOf(st.idx + dir);
  const nm = memById(st.list[st.idx + dir]);
  if (G) morphPrep(G, nm);
  await tween(dur, EASE.io, e => {
    const x = lerp(dx, -dir * NB_X, e);
    setBox(cur, { ...TARGET, x: TARGET.x + x, rot: lerp(tiltOf(st.idx) + dx / NB_X * -5, -dir * NB_ROT_OUT, e) });
    setBox(next.el, { ...nb, x: nb.x + x, rot: lerp(nb.rot, nTo, Math.min(1, Math.abs(x) / NB_X)) });
    if (prevOther) setBox(prevOther.el, { ...prevOther.b, x: prevOther.b.x + x });
    if (G) morphSet(G, lerp(p0, 1, e));
  });
  if (G) morphCommit(G);
  if (prevOther) prevOther.el.remove(); cur.remove();
  st.idx += dir; st.cur = next.el; st.n = {};
  const m = memById(st.list[st.idx]); if (st.origin === 'mem') hiddenId = m.id;
  setBox(st.cur, { ...TARGET, rot: tiltOf(st.idx) });
  fillInfo(m); const info = $('dinfo'); info.style.transition = 'none'; info.style.opacity = 0; info.style.transform = 'translateY(8px)'; void info.offsetWidth; info.style.transition = ''; info.style.opacity = 1; info.style.transform = 'none';
  if (!G) drawShape(m, dir); buildNeighbors(); st.busy = false;
};
det.addEventListener('pointerup', swEnd); det.addEventListener('pointercancel', swEnd);
addEventListener('keydown', e => { if (e.key === 'Escape' && dState) closeDetail(); });

/* ---------- Memory Reveal (Figma 13 · Memory / Revealed): the same sun and stripes move aside — the sun turns as it goes —
   and the photo shows under them. The sun's hole is filled with the screen colour, so the photo never shows through it. ---------- */
const SUN_K = 0.84224, SUN_PIV = [128.326, 131.337], SUN_C = [31 + SUN_K * 189.4505, 38.79 + SUN_K * 390.337 - 40];
const STRIPE_W = 334 * SUN_K, STRIPE_H = 21 * SUN_K, LINES_Y = [396, 440, 486, 530];
// end poses, from the Figma frame (sun: centre 360.2,251.6 turned 155.4° · stripes: 281 long, turned 29.2°)
const REV_SUN = { x: 360.2, y: 251.6, a: 155.4 };
// 17.11 (v1.4): 40px higher than in Figma 13, so they stay clear of the text under the smaller photo
const REV_STRIPES = [[-90, 348], [-111, 386], [-134, 427], [-155, 465]].map(([x, y]) => ({ x: x + 140.5 * 0.8729, y: y - 40 + 140.5 * 0.4879, a: 29.2 }));
const AI_TEXT = { sunny: "It's a nice day to be outside. Go for a walk!" };
let revOn = false, aiRun = 0, revBusy = false;
function todayPose() {   // where the sun and stripes are right now in the running SUNNY visual
  const Sm = M.sunny, t = visT, T = Sm.loop;
  const sun = { x: SUN_C[0], y: SUN_C[1], a: Sm.sunRange * Math.sin(2 * Math.PI * Sm.sunSways * t / T) };
  const st = LINES_Y.map((L, i) => ({ x: 31 + SUN_K * (29 + Sm.stripeMove * Math.sin(2 * Math.PI * Sm.stripeCycles * (t - i * Sm.stripeStagger) / T) + 167), y: 38.79 + SUN_K * L - 40, a: 0 }));
  return { sun, st };
}
const sunTf = p => `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.a.toFixed(2)}) scale(${SUN_K}) translate(${-SUN_PIV[0]} ${-SUN_PIV[1]})`;
const stTf = p => `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.a.toFixed(2)}) translate(${(-STRIPE_W / 2).toFixed(2)} ${(-STRIPE_H / 2).toFixed(2)})`;
function buildRevArt() {
  let s = '';
  for (let i = 0; i < 3; i++) s += `<rect class="rvSt" width="${STRIPE_W}" height="${STRIPE_H}" fill="#3E7FBF"/>`;
  s += `<g id="rvSun"><path d="${M.sunny.sunPath}" fill="#F5C400" fill-rule="evenodd"/></g>`;
  s += `<rect class="rvSt" width="${STRIPE_W}" height="${STRIPE_H}" fill="#3E7FBF"/>`;
  $('revArt').innerHTML = s;
}
function setArt(sun, st) { $('rvSun').setAttribute('transform', sunTf(sun)); $('revArt').querySelectorAll('.rvSt').forEach((r, i) => r.setAttribute('transform', stTf(st[i]))); }
const lp = (a, b, e) => ({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), a: lerp(a.a, b.a, e) });
function moveArt(from, to, dur) {
  const e1 = bezierEase(.65, 0, .35, 1);
  return tween(dur + D(120), EASE.lin, (_, u) => {
    const tot = dur + D(120), t = u * tot;
    const sun = lp(from.sun, to.sun, e1(Math.min(1, t / dur)));
    const es = e1(Math.max(0, Math.min(1, (t - D(40)) / dur)));   // all four stripes travel as one, no motion between them
    const st = from.st.map((f, i) => lp(f, to.st[i], es));
    setArt(sun, st);
  });
}
async function reveal() {
  if (revOn || revBusy || scr !== 'today' || DAYS[day].vis !== 'sunny') return; revOn = true; revBusy = true; markJump();
  stopCatch(); showCatch(false); toggleGraph(false);
  const d = DAYS[day], m = memById('m03');
  const R = $('sRev'); R.classList.remove('hide'); R.style.opacity = 1;
  R.querySelector('.revHdr .temp').textContent = d.temp + '°c'; R.querySelector('.revHdr .cap').textContent = d.cond;
  $('revPhoto').innerHTML = `<img src="${P('nadav-kaia')}" alt="">`;   // 20.11: Figma "Memory Photo nadav and kaia"
  $('revTitle').textContent = noOrphan(m.title);
  $('revEb').textContent = 'a memory from ' + new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  $('revMood').innerHTML = m.mood ? moodSVG(m.mood, 18) : '';
  [$('revPhoto'), $('revInfo'), $('revBack'), $('revHdr'), $('ai')].forEach(el => { el.getAnimations().forEach(a => a.cancel()); el.style.opacity = 0; });
  // take over the running picture exactly where it is
  buildRevArt(); const from = todayPose(); setArt(from.sun, from.st); visSvg.style.opacity = 0; visSvg.style.transition = 'none';
  ['.reveal', '.daysWrap'].forEach(q => fade(document.querySelector(q), 0, D(250)));
  // header: TEL AVIV moves next to SUNNY (Revealed header), then the Revealed header takes over
  const hdr = $('todayUI').querySelector('.hdr'), city = $('tCity'), cond = $('tCond');
  const dx = (cond.offsetLeft + cond.offsetWidth + 24) - city.offsetLeft;
  anim(city, [{ transform: 'none' }, { transform: `translateX(${dx}px)` }], { duration: D(1050), easing: 'cubic-bezier(.65,0,.35,1)' });
  const dur = D(1500);
  moveArt(from, { sun: REV_SUN, st: REV_STRIPES }, dur).then(() => { revBusy = false; });
  // a beat after the shapes start to move, the photo comes out from among them — small, then growing into its place
  const pc = { x: 46 + 301 / 2, y: 203 + 180 }, born = `translate(${(SUN_C[0] - pc.x).toFixed(1)}px,${(SUN_C[1] - pc.y).toFixed(1)}px) scale(.1)`;
  anim($('revPhoto'), [{ opacity: 0, transform: born }, { opacity: 1, transform: born, offset: .08 }, { opacity: 1, transform: 'none' }], { duration: D(1350), delay: D(400), easing: 'cubic-bezier(.3,0,.15,1)' });
  await wait(D(1050));
  $('revHdr').style.opacity = 1; hdr.style.opacity = 0; city.getAnimations().forEach(a => a.cancel());
  anim($('revBack'), [{ opacity: 0 }, { opacity: 1 }], { duration: D(500) });
  anim($('revInfo'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: D(750), delay: D(200), easing: 'cubic-bezier(.22,1,.36,1)' });
  runAI(AI_TEXT[d.vis] || AI_TEXT.sunny, D(600));
}
/* the AI agent: four small grey dots think — the diagonal pairs draw close and trade places, twice each (18.11: back to the dots, moving twice as much) —
   then the white box opens from the left, sized to the sentence, with the sentence in it */
async function runAI(text, delay) {
  const run = ++aiRun, box = $('ai'), dots = $('aiDots'), p = $('aiText'), di = [...dots.children];
  [box, p, dots, ...di].forEach(el => el.getAnimations().forEach(a => a.cancel()));
  box.style.cssText = 'opacity:0'; dots.style.opacity = 1; p.textContent = text; p.style.cssText = 'opacity:0';
  const P0 = [[0, 0], [7, 0], [0, 7], [7, 7]];
  di.forEach((d, i) => { d.style.transform = `translate(${P0[i][0]}px,${P0[i][1]}px)`; });
  await wait(delay); if (run !== aiRun) return;
  await anim(box, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }], { duration: D(380), easing: 'cubic-bezier(.34,1.5,.64,1)' });
  // 20.11: on every beat BOTH diagonals swap at once (top-left ↔ bottom-right and top-right ↔ bottom-left); each pair bows out to its
  // own side, so mid-way the four dots form a small turned square instead of meeting in the middle
  const at = [0, 1, 2, 3];   // at[slot] = which dot sits in that corner (slots: 0 TL, 1 TR, 2 BL, 3 BR)
  for (let k = 0; k < 4; k++) {
    if (run !== aiRun) return;
    for (const [sa, sb] of [[0, 3], [1, 2]]) {
      const A = P0[sa], B = P0[sb], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, nx = -(B[1] - A[1]) * .35, ny = (B[0] - A[0]) * .35;
      const go = (el, F, T, s) => el.animate([{ transform: `translate(${F[0]}px,${F[1]}px) scale(1)` }, { transform: `translate(${mx + s * nx}px,${my + s * ny}px) scale(1.2)`, offset: .5 }, { transform: `translate(${T[0]}px,${T[1]}px) scale(1)` }], { duration: D(560), easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      go(di[at[sa]], A, B, 1); go(di[at[sb]], B, A, -1);
      [at[sa], at[sb]] = [at[sb], at[sa]];
    }
    await wait(D(600));
  }
  if (run !== aiRun) return;
  let tw = p.scrollWidth; if (!tw) tw = 260;
  // 19.11: the dots leave, and the white box holds the text alone (box on the grid, text inset 18px)
  anim(dots, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.6)' }], { duration: D(220), easing: 'ease-in' });
  const max = 393 - 2 * GRID; let w = 16 + tw + 16;   // 19.11: a slimmer box (38 high, 16px inset)
  if (w > max) { w = max; p.style.whiteSpace = 'normal'; p.style.width = (max - 32) + 'px'; }
  anim(box, [{ width: '46px', backgroundColor: 'rgba(255,255,255,0)' }, { width: w + 'px', backgroundColor: 'rgba(255,255,255,1)' }], { duration: D(480), delay: D(120), easing: 'cubic-bezier(.22,1,.36,1)' });
  anim(p, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: D(480), delay: D(200), easing: 'cubic-bezier(.22,1,.36,1)' });
}
async function unreveal() {
  if (!revOn || revBusy) return; revBusy = true; aiRun++;
  const hdr = $('todayUI').querySelector('.hdr'), city = $('tCity'), cond = $('tCond');
  [$('revInfo'), $('revBack'), $('ai')].forEach(el => anim(el, [{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: D(250) }));
  const pc = { x: 46 + 301 / 2, y: 203 + 180 }, born = `translate(${(SUN_C[0] - pc.x).toFixed(1)}px,${(SUN_C[1] - pc.y).toFixed(1)}px) scale(.1)`;
  anim($('revPhoto'), [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: born, offset: .92 }, { opacity: 0, transform: born }], { duration: D(800), easing: 'cubic-bezier(.7,0,.85,1)' });
  hdr.style.opacity = 1; $('revHdr').style.opacity = 0;
  const dx = (cond.offsetLeft + cond.offsetWidth + 24) - city.offsetLeft;
  anim(city, [{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: D(800), easing: 'cubic-bezier(.65,0,.35,1)' });
  const to = todayPose(); const t0 = visT;
  await moveArt({ sun: REV_SUN, st: REV_STRIPES }, to, D(1400));
  visT = t0; visSvg.style.opacity = 1; curVis && curVis.draw(visT);
  $('sRev').classList.add('hide'); $('revArt').innerHTML = ''; city.getAnimations().forEach(a => a.cancel());
  ['.reveal', '.daysWrap'].forEach(q => fade(document.querySelector(q), 1, D(300)));
  revOn = false; revBusy = false; showCatch(day === 0); markJump();
  if (day === 0) launchCatch(300);
}
$('reveal').addEventListener('click', reveal);
$('revBack').onclick = unreveal;
function resetReveal() {
  if (!revOn) return; aiRun++; revOn = false; revBusy = false;
  $('sRev').classList.add('hide'); $('revArt').innerHTML = '';
  visSvg.style.opacity = 1; $('todayUI').querySelector('.hdr').style.opacity = 1; $('tCity').getAnimations().forEach(a => a.cancel());
  ['.reveal', '.daysWrap'].forEach(q => { const el = document.querySelector(q); el.style.transition = 'none'; el.style.opacity = 1; });
}

/* ======================= control panel ======================= */
const SHOW3 = ['m05', 'm02', 'm13'];
const JUMPS = [
  ['splash', 'Splash', 'פתיחה', () => { goToday({ day: 0, graph: false, launch: false }); playSplash().then(ok => { if (ok) launchCatch(400); }); }],
  ['d0', 'Today', 'Forecast', () => goToday({ day: 0, graph: false })],
  ...DAYS.slice(1).map((d, i) => ['d' + (i + 1), d.k, d.cond.split(' ')[0], () => goToday({ day: i + 1, graph: false })]),
  ['graph', 'גרף שעתי', 'Today', () => goToday({ day: 0, graph: true, launch: false })],
  ['catch', 'Catch', 'יציאה', () => { goToday({ day: 0, graph: false, launch: false }); launchCatch(150); }],
  ['rev', 'Revealed', 'Tap to reveal', () => { goToday({ day: 0, graph: false, launch: false }); setTimeout(reveal, 80); }],
  ['cam', 'מצלמה', 'Camera', () => { goToday({ day: 0, graph: false, launch: false }); setTimeout(() => openCamera(), 60); }],
  ['new', 'New Memory', 'מצב רוח + הערה', () => { goToday({ launch: false }); goNew(PLAIN_SHOT()); }],
  ['mem', 'Memories', 'Canvas', () => goMem()],
  ['wf', 'סינון', 'SUNNY', () => { goMem(); setTimeout(() => mbarPick('sunny'), D(400)); }],
  ['det', 'זיכרון', 'Detail', () => { goMem(); setTimeout(() => openDetail('m02'), D(900)); }],
  ['show', 'מצגת', 'Hot → Cloudy → Rainy', () => { goMem(); setTimeout(() => openDetail('m05', null, SHOW3), D(900)); }],   // 21.11: the three screens Noya designed, for class
];
const jumpEl = $('jump');
JUMPS.forEach(([key, a, b, fn]) => { const btn = document.createElement('button'); btn.innerHTML = `${a}<i>${b}</i>`; btn.onclick = () => { stopSplash(); fn(); closePanelMobile(); }; btn.dataset.k = key; jumpEl.appendChild(btn); });
function markJump() {
  let k = '';
  if (dState) k = 'det'; else if (revOn) k = 'rev'; else if (scr === 'mem') k = memFilter !== 'all' ? 'wf' : 'mem'; else if (scr === 'new') k = 'new'; else if (scr === 'cam') k = 'cam'; else if (scr === 'today') k = graphOpen && day === 0 ? 'graph' : 'd' + day;
  jumpEl.querySelectorAll('button').forEach(b => b.classList.toggle('now', b.dataset.k === k));
}
// options to choose from
const segSync = (id, key) => $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === S[key]));
// 21.11: the SUNNY editor
$('edOn').onclick = () => {
  ED.on = !ED.on; $('edOn').setAttribute('aria-pressed', ED.on); $('edOn').textContent = ED.on ? 'סיום עריכה' : 'פתיחת מצב עריכה';
  phone.classList.toggle('editing', ED.on);
  if (ED.on) { if (scr !== 'mem') goMem(); setTimeout(() => { if (memFilter !== 'sunny') mbarPick('sunny'); }, D(scr === 'mem' ? 0 : 500)); }
  else edSelect(null);
};
$('edReset').onclick = () => { delete CUSTOM.sunny; lsSet('reform-v1-layouts', CUSTOM); edSelect(null); if (scr === 'mem' && memFilter === 'sunny') recompose(true); say('SUNNY חזר לסידור השמור שלך'); };
$('edW').oninput = () => { if (!ED.sel) return; const w = +$('edW').value; $('edWv').textContent = w; const I = items[ED.sel]; const cx = I.to.x + I.to.w / 2, cy = I.to.y + I.to.h / 2; edSet(ED.sel, { w, x: cx - w / 2, y: cy - w * ASPECT / 2 }); };
$('edR').oninput = () => { if (!ED.sel) return; const r = +$('edR').value; $('edRv').textContent = r.toFixed(1) + '°'; edSet(ED.sel, { rot: r }); };
const edZ = d => { if (!ED.sel) return; const zs = visible.map(id => +items[id]?.el.style.zIndex || 10); const z = d > 0 ? Math.max(...zs) + 1 : Math.min(...zs) - 1; items[ED.sel].el.style.zIndex = z; edSave(ED.sel); };
$('edCopy').onclick = async () => { const t = JSON.stringify(CUSTOM.sunny || {}); try { await navigator.clipboard.writeText(t); say('הסידור הועתק — אפשר להדביק לי אותו בצ׳אט'); } catch (_) { prompt('העתיקי את הסידור:', t); } };
$('edFront').onclick = () => edZ(1); $('edBack').onclick = () => edZ(-1);
$('miMode').querySelectorAll('button').forEach(b => b.onclick = () => { S.mi = b.dataset.v; saveS(); segSync('miMode', 'mi'); navIconPaint($('navM').classList.contains('on')); });
$('mbMode').querySelectorAll('button').forEach(b => b.onclick = () => { S.mb = b.dataset.v; saveS(); segSync('mbMode', 'mb'); mbOpen = false; if (scr !== 'mem') goMem(); mbarMark(); mbarApply(true, false); });
$('graphMode').querySelectorAll('button').forEach(b => b.onclick = () => { S.graph = b.dataset.v; saveS(); segSync('graphMode', 'graph'); if (scr === 'today' && graphOpen) drawGraph(true); else { goToday({ graph: true, launch: false }); } });
$('fvMode')?.querySelectorAll('button').forEach(b => b.onclick = () => { S.fv = b.dataset.v; saveS(); segSync('fvMode', 'fv'); if (scr !== 'mem') goMem(); wfApplyVariant(); setTimeout(wfOpen, D(350)); });
// speed
const spd = $('spd');
const syncSpd = () => { spd.value = S.speed; $('spdV').textContent = '×' + (+S.speed).toFixed(2); };
spd.oninput = () => { S.speed = +spd.value; syncSpd(); saveS(); };
$('slow').onclick = e => { SLOW = SLOW === 1 ? 3 : 1; e.currentTarget.setAttribute('aria-pressed', SLOW > 1); e.currentTarget.style.background = SLOW > 1 ? '#000' : ''; e.currentTarget.style.color = SLOW > 1 ? '#fff' : ''; };
$('pause').onclick = e => { PAUSED = !PAUSED; e.currentTarget.textContent = PAUSED ? 'המשך' : 'עצירה'; };
// visuals
const visCtl = $('visCtl');
function buildVisCtl() {
  visCtl.innerHTML = '';
  VIS_KEYS.forEach(([k, label]) => {
    const row = document.createElement('div'); row.className = 'vis';
    row.innerHTML = `<input type="checkbox" ${S.vis[k].on ? 'checked' : ''} aria-label="${label}"><input type="range" min="0.25" max="2" step="0.05" value="${S.vis[k].k}" aria-label="${label} speed" title="${label}"><span class="v">${label.split(' ')[0]} ×${(+S.vis[k].k).toFixed(2)}</span>`;
    const [cb, rg] = row.querySelectorAll('input'), v = row.querySelector('.v');
    cb.onchange = () => { S.vis[k].on = cb.checked; saveS(); };
    rg.oninput = () => { S.vis[k].k = +rg.value; v.textContent = `${label.split(' ')[0]} ×${(+rg.value).toFixed(2)}`; saveS(); };
    row.addEventListener('pointerenter', () => { if (scr === 'today' && DAYS[day].vis !== k) { const i = DAYS.findIndex(d => d.vis === k); if (i >= 0) selectDay(i); } });
    visCtl.appendChild(row);
  });
}
// ms
const msCtl = $('msCtl');
function buildMsCtl() {
  msCtl.innerHTML = '';
  Object.entries(MS_DEF).forEach(([k, [def, label]]) => {
    const d = document.createElement('div'); d.className = 'ctl';
    d.innerHTML = `<div class="lab">${label}<span>${S.ms[k]}${S.ms[k] === def ? ' ✓' : ''}</span></div><input type="range" min="${Math.round(def * .3)}" max="${Math.round(def * 2.5)}" step="10" value="${S.ms[k]}">`;
    const r = d.querySelector('input'), v = d.querySelector('span');
    r.oninput = () => { S.ms[k] = +r.value; v.textContent = S.ms[k] + (S.ms[k] === def ? ' ✓' : ''); saveS(); };
    msCtl.appendChild(d);
  });
}
// camera mode
const camSeg = $('camMode');
const syncCam = () => camSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === S.cam));
camSeg.querySelectorAll('button').forEach(b => b.onclick = () => { S.cam = b.dataset.v; syncCam(); saveS(); if (scr === 'cam') { stopCamera(); startCamera(); } });
function say(t) { $('status').textContent = t; clearTimeout(say.t); say.t = setTimeout(() => { $('status').textContent = ''; }, 5000); }
$('reset').onclick = () => { S = clone(DEF_STATE); saveS(); syncSpd(); buildVisCtl(); buildMsCtl(); syncCam(); segSync('graphMode', 'graph'); segSync('mbMode', 'mb'); segSync('miMode', 'mi'); navIconPaint($('navM').classList.contains('on')); mbOpen = false; mbarApply(false); say('חזרנו לכל הערכים המאושרים.'); };
$('wipe').onclick = () => { USER_MEM = []; lsSet('reform-v1-mem', []); if (scr === 'mem') goMem(); say('הזיכרונות שצילמת נמחקו מהדפדפן הזה.'); };
$('copy').onclick = async () => {
  const changed = Object.fromEntries(Object.entries(S.ms).filter(([k, v]) => v !== MS_DEF[k][0]));
  const out = { app: 'REFORM version 1', speed: S.speed, weatherVisuals: S.vis, uiMotionMs: S.ms, changedFromApproved: changed, camera: S.cam };
  const txt = JSON.stringify(out, null, 2);
  try { await navigator.clipboard.writeText(txt); say('ההגדרות הועתקו. אפשר להדביק אותן לי בצ׳אט.'); } catch (e) { say('לא הצלחתי להעתיק: ' + txt.replace(/\s+/g, ' ')); }
};
const panel = $('panel');
$('fab').onclick = () => panel.classList.toggle('open');
function closePanelMobile() { if (IS_PHONE) panel.classList.remove('open'); else if (innerWidth < 900) scrollTo({ top: 0, behavior: 'smooth' }); }
syncSpd(); buildVisCtl(); buildMsCtl(); syncCam(); segSync('graphMode', 'graph'); if (!S.mb) S.mb = 'open'; segSync('mbMode', 'mb'); if (!S.mi || S.mi === 'grid') S.mi = 'pile'; segSync('miMode', 'mi'); navIconPaint(false);


/* ======================= SPLASH (21.11, approved "M2 · clean") =======================
   The app icon (sun + stripes) sits small in the centre for a moment, then opens to the sides: the stripes move left and become the
   E, the sun moves right and becomes the O, and the letters slide out from behind them. Logo = Noya's Figma (01 · Onboarding / Splash),
   E stripes exactly the font's stroke (2.27) and cap height (20); here ×1.45, centred. */
const SP = (() => {
  const Rg = 'M-0.000520706 20V0H5.0217C6.28096 0 7.36244 0.251851 8.26615 0.755554C9.16985 1.25926 9.86615 1.92593 10.355 2.75555C10.8587 3.57037 11.1106 4.46667 11.1106 5.44444C11.1106 6.17037 10.9699 6.85926 10.6884 7.51111C10.4069 8.14815 10.0069 8.71111 9.48837 9.2C8.96985 9.67407 8.34763 10.0519 7.6217 10.3333L14.3328 20H11.3773L5.0217 10.8H2.53281V20H-0.000520706ZM2.53281 8.66667H5.0217C5.88096 8.66667 6.57726 8.51111 7.11059 8.2C7.65874 7.87407 8.05874 7.46667 8.31059 6.97778C8.57726 6.47407 8.71059 5.96296 8.71059 5.44444C8.71059 4.82222 8.55503 4.27407 8.24392 3.8C7.94763 3.31111 7.518 2.93333 6.95504 2.66667C6.40689 2.4 5.76244 2.26667 5.0217 2.26667H2.53281V8.66667Z';
  const Fg = 'M-0.000781298 20V0H9.86589V2.26667H2.53255V6.53333H9.19922V8.8H2.53255V20H-0.000781298Z';
  const Mg = 'M-0.000781298 20.666V-0.000652313H0.0436633L9.28811 12.7993L18.3548 -0.000652313H18.3992V20.666H15.8659V11.4216C15.8659 10.8142 15.8733 10.1549 15.8881 9.44379C15.9029 8.71787 15.9548 7.89565 16.0437 6.97713C15.5844 7.79194 15.1326 8.51046 14.6881 9.13268C14.2585 9.74009 13.8659 10.3031 13.5103 10.8216L9.19922 16.9327L4.75477 10.8216C4.3844 10.3031 3.9844 9.74009 3.55477 9.13268C3.13996 8.51046 2.69552 7.79194 2.22144 6.97713C2.31033 7.89565 2.36218 8.71787 2.377 9.44379C2.39181 10.1549 2.39922 10.8142 2.39922 11.4216V20.666H-0.000781298Z';
  const T = 2.2667, EX = 17.28, EW = 9.87, TOP = 0.666, BASE = 20.666, EY = [TOP, (TOP + BASE) / 2 - T / 2, BASE - T];
  const GL = [[Rg, 0, TOP], [Fg, 31.2774, TOP], [Rg, 68.2495, TOP], [Mg, 85.5266, 0]];
  const IC = { s: .75, x: 196.5 - 37.5, y: 426 - 37.5 }, LG = { s: 1.45, x: 121.1, y: 410.63 };
  return { T, EX, EW, EY, GL, IC, LG,
    iconSun: { cx: IC.x + 56 * IC.s, cy: IC.y + 44 * IC.s, rx: 25 * IC.s, ry: 25 * IC.s },
    logoSun: { cx: LG.x + 53.93 * LG.s, cy: LG.y + 11.166 * LG.s, rx: 10 * LG.s, ry: 10.5 * LG.s },
    iconSt: i => ({ x: IC.x + 18 * IC.s, y: IC.y + (55 + i * 9.5) * IC.s, w: 46 * IC.s, h: 5.5 * IC.s }),
    logoSt: i => ({ x: LG.x + EX * LG.s, y: LG.y + EY[i] * LG.s, w: EW * LG.s, h: T * LG.s }) };
})();
let splashRun = 0;
function stopSplash() { splashRun++; $('splash').classList.add('hide'); }
function playSplash() {
  const run = ++splashRun, el = $('splash'), fx = $('spfx'), lg = $('splogo');
  el.getAnimations({ subtree: true }).forEach(a => a.cancel());
  el.classList.remove('hide'); el.style.opacity = 1; fx.innerHTML = '';
  const zones = { L: [-20, SP.EX - .2], C: [SP.EX + SP.EW + .2, 43.73], R: [64.13, 130] }, ZN = ['L', 'C', 'R', 'R'], FROM = [19.5, -15, -20.5, -42];
  lg.innerHTML = `<defs>${Object.entries(zones).map(([z, [a, b]]) => `<clipPath id="spz${z}"><rect x="${a}" y="-5" width="${b - a}" height="32"/></clipPath>`).join('')}</defs>`
    + SP.EY.map(y => `<rect class="spE" x="${SP.EX}" y="${y.toFixed(3)}" width="${SP.EW}" height="${SP.T}" fill="#3E7FBF" opacity="0"/>`).join('')
    + `<ellipse class="spO" cx="53.93" cy="11.166" rx="10" ry="10.5" fill="#F5C400" opacity="0"/>`
    + SP.GL.map(([d, x, y], i) => `<g clip-path="url(#spz${ZN[i]})"><g class="spL"><path d="${d}" transform="translate(${x} ${y})"/></g></g>`).join('');
  const mk = (t, a) => { const n = document.createElementNS(NS, t); Object.entries(a).forEach(([k, v]) => n.setAttribute(k, v)); fx.appendChild(n); return n; };
  const sun = mk('ellipse', { fill: '#F5C400' }), sts = [0, 1, 2].map(() => mk('rect', { fill: '#3E7FBF' }));
  const io = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const SUN = [D(650), D(1750)], ST = i => [D(650 + i * 40), D(1750 + i * 40)], END = D(1890), LET = D(1300), LDUR = D(900);
  const seg = (now, [a, b]) => io(Math.max(0, Math.min(1, (now - a) / (b - a))));
  [...lg.querySelectorAll('.spL')].forEach((g, i) => anim(g, [{ transform: `translateX(${FROM[i]}px)` }, { transform: 'none' }], { duration: LDUR, delay: LET, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' }));
  const t0 = performance.now();
  return new Promise(done => {
    const step = abs => {
      if (run !== splashRun) return done(false);
      const now = abs - t0, ap = Math.min(1, now / D(450)), landed = now >= END;
      [sun, ...sts].forEach(n => n.setAttribute('opacity', landed ? 0 : ap));
      lg.querySelectorAll('.spE, .spO').forEach(n => n.setAttribute('opacity', landed ? 1 : 0));
      const es = seg(now, SUN), a = SP.iconSun, b = SP.logoSun;
      sun.setAttribute('cx', lerp(a.cx, b.cx, es)); sun.setAttribute('cy', lerp(a.cy, b.cy, es)); sun.setAttribute('rx', lerp(a.rx, b.rx, es)); sun.setAttribute('ry', lerp(a.ry, b.ry, es));
      sts.forEach((r, i) => { const A0 = SP.iconSt(i), B = SP.logoSt(i), e = seg(now, ST(i));
        const w = lerp(A0.w, B.w, e), hh = lerp(A0.h, B.h, e), x = lerp(A0.x + A0.w / 2, B.x + B.w / 2, e), y = lerp(A0.y + A0.h / 2, B.y + B.h / 2, e);
        r.setAttribute('x', x - w / 2); r.setAttribute('y', y - hh / 2); r.setAttribute('width', w); r.setAttribute('height', hh); });
      if (now < LET + LDUR + D(700)) return requestAnimationFrame(step);
      // hold a moment on the finished logo, then the splash fades away onto Today
      fade(el, 0, D(500)); setTimeout(() => { if (run === splashRun) el.classList.add('hide'); done(run === splashRun); }, D(520));
    };
    requestAnimationFrame(step);
  });
}

/* ======================= start ======================= */
applyDay(0);
const ready = () => { measureGrid(); wfApplyVariant(); archMeasure(); goToday({ day: 0, launch: false }); requestAnimationFrame(t => { lastNow = t; frame(t); });
  playSplash().then(ok => { if (ok && scr === 'today' && day === 0) launchCatch(400); }); };   // 21.11: the app opens with the splash
(document.fonts ? document.fonts.ready : Promise.resolve()).then(ready);

/* phone size toggle (panel, shown on phones) */
(() => { const seg = $('fitMode'); if (!seg) return;
  const sync = () => seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === (S.phoneFit || 'real')));
  seg.querySelectorAll('button').forEach(b => b.onclick = () => { S.phoneFit = b.dataset.v; saveS(); sync(); fit(); scrollTo(0, 0); });
  sync(); })();
