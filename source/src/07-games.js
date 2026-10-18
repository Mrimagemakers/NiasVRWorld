// ═════════════════════════════════════════════════════════════════════════════
//  MATH & LEARNING GAMES — one per chapter landmark, 3 levels each
// ═════════════════════════════════════════════════════════════════════════════
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Build 3–4 answer choices around a correct number
function choicesNum(ans, spread = 3, n = 3, min = 0) {
  const s = new Set([ans]); let guard = 0;
  while (s.size < n && guard++ < 50) { const v = ans + ri(-spread, spread); if (v >= min && v !== ans) s.add(v); }
  while (s.size < n) s.add(ans + s.size);
  const opts = shuffle([...s]); return { options: opts.map(String), answer: opts.indexOf(ans) };
}
function choicesStr(ans, wrong) { const opts = shuffle([ans, ...wrong]); return { options: opts, answer: opts.indexOf(ans) }; }

// ─── Canvas drawing helpers for question pictures ────────────────────────────
const D = {
  font: (x, px, w = 'normal') => { x.font = `${w} ${px}px "Fredoka One", "Nunito", Arial`; },
  bg(x, w, h, c1 = '#FFF8E8', c2 = '#FFE9C2') { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, w, h); },
  text(x, s, X, Y, px = 40, col = '#3B1F5C', align = 'center') { D.font(x, px); x.fillStyle = col; x.textAlign = align; x.textBaseline = 'middle'; x.fillText(s, X, Y); },
  apple(x, X, Y, r, col = '#E63946', crossed = false) {
    x.fillStyle = col; x.beginPath(); x.arc(X - r * 0.35, Y, r * 0.75, 0, TAU); x.arc(X + r * 0.35, Y, r * 0.75, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.ellipse(X - r * 0.4, Y - r * 0.3, r * 0.2, r * 0.12, -0.6, 0, TAU); x.fill();
    x.strokeStyle = '#6B4226'; x.lineWidth = r * 0.15; x.beginPath(); x.moveTo(X, Y - r * 0.6); x.lineTo(X + r * 0.1, Y - r * 1.05); x.stroke();
    x.fillStyle = '#4CAF50'; x.beginPath(); x.ellipse(X + r * 0.35, Y - r * 0.95, r * 0.3, r * 0.14, -0.4, 0, TAU); x.fill();
    if (crossed) { x.strokeStyle = '#1D3557'; x.lineWidth = r * 0.22; x.lineCap = 'round'; x.beginPath(); x.moveTo(X - r, Y - r); x.lineTo(X + r, Y + r); x.moveTo(X + r, Y - r); x.lineTo(X - r, Y + r); x.stroke(); }
  },
  group(x, n, X, Y, W, Hh, col, crossedFrom = 999) {
    const cols = Math.min(5, n), rows = Math.ceil(n / 5), r = Math.min(W / cols, Hh / rows) * 0.36;
    for (let i = 0; i < n; i++) { const c = i % 5, rw = Math.floor(i / 5); D.apple(x, X + (c + 0.5) * W / cols, Y + (rw + 0.5) * Hh / Math.max(rows, 1), r, col, i >= crossedFrom); }
  },
  pie(x, X, Y, R, den, num, col = '#F4A261') {
    for (let i = 0; i < den; i++) {
      const a0 = -Math.PI / 2 + i / den * TAU, a1 = a0 + TAU / den;
      x.beginPath(); x.moveTo(X, Y); x.arc(X, Y, R, a0, a1); x.closePath();
      x.fillStyle = i < num ? col : '#FFF6E0'; x.fill(); x.strokeStyle = '#8B5A2B'; x.lineWidth = 4; x.stroke();
      if (i < num) for (let k = 0; k < 2; k++) { const a = a0 + (a1 - a0) * (0.3 + k * 0.4), rr2 = R * (0.45 + k * 0.2); x.fillStyle = '#C0392B'; x.beginPath(); x.arc(X + Math.cos(a) * rr2, Y + Math.sin(a) * rr2, R * 0.07, 0, TAU); x.fill(); }
    }
    x.strokeStyle = '#D99A4A'; x.lineWidth = 10; x.beginPath(); x.arc(X, Y, R, 0, TAU); x.stroke();
  },
  clock(x, X, Y, R, h, m) {
    x.fillStyle = '#FFFDF2'; x.beginPath(); x.arc(X, Y, R, 0, TAU); x.fill(); x.strokeStyle = '#FF6FAE'; x.lineWidth = 10; x.stroke();
    for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU - Math.PI / 2; D.text(x, String(i), X + Math.cos(a) * R * 0.78, Y + Math.sin(a) * R * 0.78, R * 0.2, '#5B2A86'); }
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; x.strokeStyle = '#B07A20'; x.lineWidth = i % 5 ? 2 : 4; x.beginPath(); x.moveTo(X + Math.cos(a) * R * 0.95, Y + Math.sin(a) * R * 0.95); x.lineTo(X + Math.cos(a) * R * 0.9, Y + Math.sin(a) * R * 0.9); x.stroke(); }
    const ha = ((h % 12) + m / 60) / 12 * TAU - Math.PI / 2, ma = m / 60 * TAU - Math.PI / 2;
    x.lineCap = 'round'; x.strokeStyle = '#3B1F5C'; x.lineWidth = 10; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(ha) * R * 0.5, Y + Math.sin(ha) * R * 0.5); x.stroke();
    x.lineWidth = 6; x.strokeStyle = '#7B2CBF'; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(ma) * R * 0.75, Y + Math.sin(ma) * R * 0.75); x.stroke();
    x.fillStyle = '#F2C14E'; x.beginPath(); x.arc(X, Y, 8, 0, TAU); x.fill();
  },
  coin(x, X, Y, cents) {
    const spec = { 1: [17, '#C97A40', '#8E4E22'], 5: [21, '#C9CCD1', '#8A8F98'], 10: [16, '#D6D9DE', '#8A8F98'], 25: [25, '#D0D3D8', '#7E848C'] }[cents];
    const r = spec[0] * 1.6; x.fillStyle = spec[1]; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); x.strokeStyle = spec[2]; x.lineWidth = 4; x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 2; x.beginPath(); x.arc(X, Y, r * 0.8, 0, TAU); x.stroke();
    D.text(x, cents + '¢', X, Y + 2, r * 0.7, '#3A2A1A');
  },
  shape(x, kind, X, Y, R, col) {
    x.fillStyle = col; x.strokeStyle = '#3B1F5C'; x.lineWidth = 5; x.beginPath();
    const poly = (n, rot = -Math.PI / 2) => { for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; i ? x.lineTo(X + Math.cos(a) * R, Y + Math.sin(a) * R) : x.moveTo(X + Math.cos(a) * R, Y + Math.sin(a) * R); } x.closePath(); };
    if (kind === 'circle') x.arc(X, Y, R, 0, TAU);
    else if (kind === 'triangle') poly(3); else if (kind === 'square') poly(4, Math.PI / 4); else if (kind === 'pentagon') poly(5); else if (kind === 'hexagon') poly(6); else if (kind === 'octagon') poly(8, Math.PI / 8);
    else if (kind === 'rectangle') x.rect(X - R * 1.3, Y - R * 0.75, R * 2.6, R * 1.5);
    else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, r = i % 2 ? R * 0.45 : R; i ? x.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r) : x.moveTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); } x.closePath(); }
    else if (kind === 'heart') { x.moveTo(X, Y + R * 0.8); x.bezierCurveTo(X - R * 1.4, Y - R * 0.2, X - R * 0.6, Y - R * 1.2, X, Y - R * 0.4); x.bezierCurveTo(X + R * 0.6, Y - R * 1.2, X + R * 1.4, Y - R * 0.2, X, Y + R * 0.8); }
    x.fill(); x.stroke();
  },
  firefly(x, X, Y, r) { const g = x.createRadialGradient(X, Y, 0, X, Y, r * 3); g.addColorStop(0, 'rgba(255,250,170,1)'); g.addColorStop(0.3, 'rgba(255,220,80,0.8)'); g.addColorStop(1, 'rgba(255,200,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r * 3, 0, TAU); x.fill(); x.fillStyle = '#3A2A1A'; x.beginPath(); x.ellipse(X, Y - r * 0.9, r * 0.5, r * 0.7, 0, 0, TAU); x.fill(); },
  tensOnes(x, tens, ones, X, Y) {
    for (let t = 0; t < tens; t++) { for (let k = 0; k < 10; k++) { x.fillStyle = '#3A86FF'; x.fillRect(X + t * 34, Y + k * 18, 26, 16); x.strokeStyle = '#1D3557'; x.lineWidth = 2; x.strokeRect(X + t * 34, Y + k * 18, 26, 16); } }
    for (let o = 0; o < ones; o++) { const cx = X + tens * 34 + 30 + (o % 3) * 30, cy = Y + 120 + Math.floor(o / 3) * 30; x.fillStyle = '#FFB703'; x.fillRect(cx, cy, 24, 24); x.strokeStyle = '#9A6A00'; x.strokeRect(cx, cy, 24, 24); }
  },
  bar(x, X, Y, len, unit, col, label) {
    x.fillStyle = '#FFD54A'; x.fillRect(X - 6, Y + 52, unit * 10 + 12, 48); x.fillStyle = '#5A3A10';
    for (let i = 0; i <= 10; i++) { x.fillRect(X + i * unit - 1.5, Y + 52, 3, 22); D.text(x, String(i), X + i * unit, Y + 86, 20, '#5A3A10'); }
    x.fillStyle = col; const r = 16; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + len * unit - r, Y); x.quadraticCurveTo(X + len * unit, Y, X + len * unit, Y + r); x.lineTo(X + len * unit, Y + 40 - r); x.quadraticCurveTo(X + len * unit, Y + 40, X + len * unit - r, Y + 40); x.lineTo(X, Y + 40); x.closePath(); x.fill();
    if (label) D.text(x, label, X + len * unit / 2, Y + 20, 22, '#fff');
  },
};

// ─── The games ───────────────────────────────────────────────────────────────
const LVL = ['Sprout', 'Bloom', 'Blossom'];
const GAMES = {
  addition: { title: 'Fix the Addition Bridge', host: 'Addie', icon: '➕', ch: 3, intro: 'Help me add the numbers so we can fix the bridge!',
    gen(l) { const max = [5, 10, 20][l]; const a = ri(1, max), b = ri(1, max); const ans = a + b;
      return { prompt: `${a} + ${b} = ?`, ...choicesNum(ans, 3), explain: `${a} and ${b} together make ${ans}.`,
        draw: (x, w, h) => { D.bg(x, w, h); if (ans <= 20) { D.group(x, a, 20, 20, w / 2 - 40, h - 40, '#E63946'); D.text(x, '+', w / 2, h / 2, 60, '#7B2CBF'); D.group(x, b, w / 2 + 20, 20, w / 2 - 40, h - 40, '#2A9D8F'); } else D.text(x, `${a} + ${b}`, w / 2, h / 2, 90); } }; } },
  fractions: { title: 'Fraction Pizza Party', host: 'Freddy', icon: '🍕', ch: 3, intro: 'Every whole is made of parts! What fraction of the pizza is topped?',
    gen(l) { const den = pick([[2, 4], [2, 3, 4, 6], [3, 4, 6, 8]][l]); const num = l === 0 ? 1 : ri(1, den - 1); const ans = `${num}/${den}`;
      const wrong = new Set(); while (wrong.size < 2) { const d = pick([2, 3, 4, 6, 8]), n = ri(1, d - 1); if (`${n}/${d}` !== ans) wrong.add(`${n}/${d}`); }
      return { prompt: 'What fraction of the pizza has toppings?', ...choicesStr(ans, [...wrong]), explain: `${num} of the ${den} equal slices have toppings: ${ans}.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#FFF5F5', '#FFE0E0'); D.pie(x, w / 2, h / 2, h * 0.42, den, num); } }; } },
  counting: { title: 'Wake Up Carlo!', host: 'Carlo', icon: '🐛', ch: 4, mode: 'order', intro: 'Tap the numbers in order to wake me up!',
    gen(l) { const seq = l === 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : l === 1 ? Array.from({ length: 10 }, (_, i) => i + 11) : Array.from({ length: 10 }, (_, i) => (i + 1) * 2);
      return { prompt: l === 2 ? 'Count by 2s: tap 2, 4, 6 ... up to 20!' : `Tap ${seq[0]} to ${seq[9]} in order!`, seq, options: shuffle(seq.map(String)), explain: 'You counted all the way!',
        draw: (x, w, h, st) => { D.bg(x, w, h, '#F0FFE8', '#D8F5C6'); const C = ['#FF3B30', '#FF7A1A', '#FFC21A', '#C6DC2A', '#5EC43A', '#22B8A8', '#2F7BEF', '#4B4FD0', '#9B4FE0', '#F5B83A'];
          for (let i = 0; i < 10; i++) { const on = (st?.step ?? 0) > i; x.globalAlpha = on ? 1 : 0.28; x.fillStyle = C[i]; x.beginPath(); x.arc(70 + i * (w - 140) / 9, h / 2 + Math.sin(i) * 12, 30, 0, TAU); x.fill(); x.globalAlpha = 1; D.text(x, on ? String(seq[i]) : '', 70 + i * (w - 140) / 9, h / 2 + Math.sin(i) * 12, 26, '#fff'); }
          x.fillStyle = '#8BD43A'; x.beginPath(); x.arc(w - 40, h / 2 - 50, 34, 0, TAU); x.fill(); D.text(x, (st?.step ?? 0) >= 10 ? '😄' : '😴', w - 40, h / 2 - 50, 36); } }; } },
  subtraction: { title: 'Subby\'s Take-Away Trail', host: 'Subby', icon: '🐌', ch: 5, intro: 'Subtracting means taking away. Count what is left!',
    gen(l) { const max = [6, 10, 20][l]; const a = ri(2, max), b = ri(1, a - 1), ans = a - b;
      return { prompt: `${a} − ${b} = ?`, ...choicesNum(ans, 3), explain: `${a} take away ${b} leaves ${ans}.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#F6F0FF', '#E4D8FF'); if (a <= 20) D.group(x, a, 30, 20, w - 60, h - 40, '#9B6BE8', a - b); else D.text(x, `${a} − ${b}`, w / 2, h / 2, 90); } }; } },
  shapes: { title: 'Shape Greenhouse Quiz', host: null, icon: '🔷', ch: 6, intro: 'Look closely at each shape: count its sides and corners!',
    gen(l) { const all = ['circle', 'triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon', 'star', 'heart']; const sides = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, octagon: 8 };
      const cols = ['#FF4D4D', '#3A86FF', '#FFD23F', '#2EC4B6', '#8B5CF6', '#FF8A1F'];
      if (l === 0 || Math.random() < 0.4) { const k = pick(l === 0 ? ['circle', 'triangle', 'square', 'rectangle', 'star', 'heart'] : all); const w2 = shuffle(all.filter(s => s !== k)).slice(0, 2);
        return { prompt: 'What is the name of this shape?', ...choicesStr(k, w2), explain: `That shape is a ${k}.`, draw: (x, w, h) => { D.bg(x, w, h, '#EFFFFB', '#D3F5EC'); D.shape(x, k, w / 2, h / 2, h * 0.36, pick(cols)); } }; }
      const k = pick(Object.keys(sides)), n = sides[k];
      return { prompt: `How many ${l === 2 && Math.random() < 0.5 ? 'corners' : 'sides'} does this ${k} have?`, ...choicesNum(n, 2, 3, 3), explain: `A ${k} has ${n} sides and ${n} corners.`, draw: (x, w, h) => { D.bg(x, w, h, '#EFFFFB', '#D3F5EC'); D.shape(x, k, w / 2, h / 2, h * 0.36, pick(cols)); } }; } },
  arrays: { title: 'Milly\'s Glowing Arrays', host: 'Milly', icon: '✖️', ch: 8, intro: 'Multiplication is counting in beautiful groups!',
    gen(l) { const r = ri(2, [3, 5, 6][l]), c = ri(2, [4, 5, 9][l]), ans = r * c;
      return { prompt: l === 0 ? `${r} rows of ${c}. How many dots in all?` : `${r} × ${c} = ?`, ...choicesNum(ans, Math.max(3, r)), explain: `${r} groups of ${c} make ${ans}.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#2A0F4A', '#4A1A7A'); const s = Math.min((w - 60) / c, (h - 40) / r);
          for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { const X = w / 2 + (j - (c - 1) / 2) * s, Y = h / 2 + (i - (r - 1) / 2) * s; const g = x.createRadialGradient(X, Y, 0, X, Y, s * 0.42); g.addColorStop(0, '#FFF6C0'); g.addColorStop(0.6, '#FFC94D'); g.addColorStop(1, 'rgba(255,190,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, s * 0.42, 0, TAU); x.fill(); } } }; } },
  patterns: { title: 'Pattern Pond Puzzle', host: null, icon: '🪷', ch: 10, intro: 'Patterns repeat! What comes next?',
    gen(l) {
      if (l < 2 || Math.random() < 0.4) { const sets = [['🔴', '🔵'], ['🌸', '🍃', '🌸'], ['🐸', '🐸', '🪷'], ['⭐', '🌙', '☀️'], ['🔺', '🟦', '🟡']]; const unit = pick(sets).slice(0, l === 0 ? 2 : 3); const seq = []; for (let i = 0; i < 7; i++) seq.push(unit[i % unit.length]);
        const ans = unit[7 % unit.length]; const wrong = [...new Set(['🔴', '🔵', '🌸', '🍃', '⭐', '🌙', '🐸', '🪷'].filter(e => e !== ans))].slice(0, 2);
        return { prompt: 'What comes next in the pattern?', ...choicesStr(ans, shuffle(wrong).slice(0, 2)), explain: `The pattern repeats: ${unit.join(' ')}.`,
          draw: (x, w, h) => { D.bg(x, w, h, '#E8FBFF', '#C8EFF7'); x.font = '48px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; seq.forEach((e, i) => x.fillText(e, 50 + i * (w - 100) / 7.5, h / 2)); D.text(x, '?', w - 50, h / 2, 56, '#7B2CBF'); } }; }
      const st = ri(1, 10), step = pick([2, 3, 5, 10]), seq = [0, 1, 2, 3].map(i => st + i * step), ans = st + 4 * step;
      return { prompt: `${seq.join(', ')}, ... what comes next?`, ...choicesNum(ans, step + 1), explain: `Each number grows by ${step}.`, draw: (x, w, h) => { D.bg(x, w, h, '#E8FBFF', '#C8EFF7'); seq.forEach((n, i) => { x.fillStyle = '#4FA63A'; x.beginPath(); x.ellipse(70 + i * 110, h / 2, 48, 30, 0, 0, TAU); x.fill(); D.text(x, String(n), 70 + i * 110, h / 2, 34, '#fff'); }); D.text(x, '?', w - 60, h / 2, 56, '#7B2CBF'); } }; } },
  measure: { title: 'Measure It!', host: null, icon: '📏', ch: 11, intro: 'Line up the ruler from zero and read the length.',
    gen(l) { if (l < 2) { const len = ri(2, 10); return { prompt: 'How many units long is the caterpillar bar?', ...choicesNum(len, 2, 3, 1), explain: `It starts at 0 and ends at ${len}, so it is ${len} units long.`, draw: (x, w, h) => { D.bg(x, w, h); D.bar(x, 40, h / 2 - 60, len, (w - 80) / 10, '#5EC43A', ''); } }; }
      const a = ri(5, 10), b = ri(1, a - 1); return { prompt: 'How much longer is the green bar than the purple bar?', ...choicesNum(a - b, 2, 3, 1), explain: `${a} − ${b} = ${a - b} units longer.`,
        draw: (x, w, h) => { D.bg(x, w, h); const u = (w - 80) / 10; x.fillStyle = '#5EC43A'; x.fillRect(40, 30, a * u, 36); x.fillStyle = '#9B4FE0'; x.fillRect(40, 80, b * u, 36); D.bar(x, 40, 130, 0, u, '#000', ''); } }; } },
  time: { title: 'Tell the Time', host: null, icon: '🕐', ch: 12, intro: 'The short hand shows the hour. The long hand shows the minutes.',
    gen(l) { const h = ri(1, 12), m = l === 0 ? 0 : l === 1 ? pick([0, 30]) : pick([0, 15, 30, 45, 5, 10, 20, 25, 35, 40, 50, 55]);
      const fmt = (H, M) => `${H}:${String(M).padStart(2, '0')}`, ans = fmt(h, m); const wrong = new Set(); while (wrong.size < 2) { const W = fmt(ri(1, 12), l === 0 ? 0 : pick([0, 15, 30, 45])); if (W !== ans) wrong.add(W); }
      return { prompt: 'What time does the clock show?', ...choicesStr(ans, [...wrong]), explain: `The hour hand points to ${h} and the minute hand to ${m} minutes: ${ans}.`, draw: (x, w, h2) => { D.bg(x, w, h2, '#FFF0F7', '#FFD8EA'); D.clock(x, w / 2, h2 / 2, h2 * 0.44, h, m); } }; } },
  money: { title: 'Market Coin Count', host: null, icon: '🪙', ch: 13, intro: 'Count the coins to pay at the market!',
    gen(l) { const types = [[1, 5], [1, 5, 10], [1, 5, 10, 25]][l]; const n = ri(2, [4, 5, 6][l]); const coins = Array.from({ length: n }, () => pick(types)).sort((a, b) => b - a); const ans = coins.reduce((s, c) => s + c, 0);
      return { prompt: 'How many cents are there in all?', ...choicesNum(ans, 5, 3, 1), explain: `${coins.join(' + ')} = ${ans}¢.`, options2: null,
        draw: (x, w, h) => { D.bg(x, w, h, '#F4FFF0', '#DDF5D2'); coins.forEach((c, i) => D.coin(x, 60 + i * (w - 120) / Math.max(1, n - 1), h / 2 + (i % 2 ? 30 : -30), c)); } }; } },
  skip: { title: 'Skippy\'s Leaf Leap', host: 'Skippy', icon: '🐿️', ch: 14, intro: 'Leap ahead with numbers! Find the missing number.',
    gen(l) { const step = pick([[2, 10], [2, 5, 10], [3, 4, 5, 10]][l]); const st = step * ri(1, 3), seq = [0, 1, 2, 3, 4].map(i => st + i * step), hole = ri(1, 3), ans = seq[hole];
      return { prompt: `Count by ${step}s. Which number is missing?`, ...choicesNum(ans, step, 3, 1), explain: `Counting by ${step}s: ${seq.join(', ')}.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#EFFBEA', '#D3F2C6'); seq.forEach((n, i) => { const X = 60 + i * (w - 120) / 4, Y = h / 2 + (i % 2 ? -30 : 30); x.fillStyle = '#5EB645'; x.beginPath(); x.ellipse(X, Y, 50, 30, -0.3, 0, TAU); x.fill(); D.text(x, i === hole ? '?' : String(n), X, Y, 32, '#fff'); }); } }; } },
  placevalue: { title: 'Post Office Mail', host: null, icon: '📮', ch: 9, intro: 'Each blue rod is 10. Each yellow cube is 1. Which house gets the letter?',
    gen(l) { const t = ri(1, [2, 5, 9][l]), o = ri(0, 9), ans = t * 10 + o;
      const wr = [...new Set([o * 10 + t, ans + 1, ans - 1, ans + 10, ans - 10])].filter(v => v !== ans && v > 0).slice(0, 2).map(String);
      return { prompt: `Deliver the letter to house number ${t} tens and ${o} ones. Which number?`, ...choicesStr(String(ans), wr), explain: `${t} tens is ${t * 10}, plus ${o} ones makes ${ans}.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#EEF4FF', '#D6E4FF'); D.tensOnes(x, t, o, 30, 20); } }; } },
  missing: { title: 'Tower Builder', host: null, icon: '🧱', ch: null, intro: 'Which block finishes the tower? Find the missing number!',
    gen(l) { const total = ri(5, [10, 15, 20][l]), a = ri(1, total - 1), ans = total - a;
      return { prompt: `${a} + ? = ${total}`, ...choicesNum(ans, 3, 3, 1), explain: `${a} + ${ans} = ${total}.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#FFF7E6', '#FFE8BF'); const cols = ['#FF4D4D', '#FF8A1F', '#FFD23F', '#8BD346', '#2EC4B6', '#3A86FF', '#8B5CF6']; for (let i = 0; i < Math.min(a, 12); i++) { x.fillStyle = cols[i % 7]; x.fillRect(w / 2 - 80, h - 30 - (i + 1) * 18, 70, 16); } x.strokeStyle = '#7B2CBF'; x.setLineDash([8, 6]); x.lineWidth = 3; x.strokeRect(w / 2 + 20, h - 30 - Math.min(total, 12) * 18, 70, Math.min(total, 12) * 18); x.setLineDash([]); D.text(x, String(total), w / 2 + 55, 30, 30); } }; } },
  bonds: { title: 'Firefly Friends', host: 'Pip', icon: '✨', ch: null, intro: 'Count the fireflies! How many more make the whole group?',
    gen(l) { const whole = [10, 10, 20][l], a = ri(1, whole - 1), ans = whole - a;
      return { prompt: l === 0 ? `There are ${a} fireflies. How many more make ${whole}?` : `${a} + ? = ${whole}`, ...choicesNum(ans, 3, 3, 0), explain: `${a} and ${ans} are number bonds that make ${whole}.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#0B1A2E', '#1A2E4A'); for (let i = 0; i < whole; i++) { const X = 50 + (i % 10) * (w - 100) / 9, Y = h / 2 - 40 + Math.floor(i / 10) * 80; if (i < a) D.firefly(x, X, Y, 8); else { x.strokeStyle = 'rgba(255,240,180,0.5)'; x.setLineDash([4, 4]); x.beginPath(); x.arc(X, Y, 14, 0, TAU); x.stroke(); x.setLineDash([]); } } } }; } },
  evenodd: { title: 'Even or Odd?', host: null, icon: '🌻', ch: 7, intro: 'Even numbers can be shared into pairs. Odd numbers have one left over!',
    gen(l) { const n = ri(1, [10, 20, 99][l]), ans = n % 2 ? 'Odd' : 'Even';
      return { prompt: `Is ${n} even or odd?`, options: ['Even', 'Odd'], answer: ans === 'Even' ? 0 : 1, explain: n % 2 ? `${n} has one left over when you make pairs, so it is odd.` : `${n} makes pairs with none left over, so it is even.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#FFFBE6', '#FFF0B3'); if (n <= 20) for (let i = 0; i < n; i++) { const X = 60 + Math.floor(i / 2) * (w - 120) / 9, Y = h / 2 + (i % 2 ? 36 : -36); x.font = '40px serif'; x.textAlign = 'center'; x.fillText('🌻', X, Y + 14); } else D.text(x, String(n), w / 2, h / 2, 110, '#C27C0E'); } }; } },
  dreams: { title: 'Math Dreams', host: 'Nia', icon: '☁️', ch: 17, intro: 'In my dreams, math stories float by on clouds! Solve them with me.',
    gen(l) { const stories = [
      () => { const a = ri(2, 6), b = ri(1, 5); return [`Nia picks ${a} sunflowers, then ${b} more. How many sunflowers now?`, a + b]; },
      () => { const a = ri(5, 10), b = ri(1, 4); return [`Freddy has ${a} pizza slices and shares ${b}. How many are left?`, a - b]; },
      () => { const a = ri(2, 4), b = ri(2, 5); return [`Milly sees ${a} trees with ${b} glowing fruits each. How many fruits?`, a * b]; },
      () => { const a = ri(2, 5); return [`Skippy hops 2 leaves at a time. After ${a} hops, how many leaves?`, a * 2]; },
      () => { const a = ri(3, 9), b = ri(2, 9); return [`Addie stacks ${a} red blocks and ${b} blue blocks. How many blocks?`, a + b]; },
      () => { const a = ri(10, 20), b = ri(2, 9); return [`Carlo counted ${a} stars, then ${b} hid behind a cloud. How many still shine?`, a - b]; } ];
      const [p, ans] = pick(l === 0 ? stories.slice(0, 2).concat(stories[4]) : stories)(); return { prompt: p, ...choicesNum(ans, 3), explain: `The answer is ${ans}.`,
        draw: (x, w, h) => { D.bg(x, w, h, '#EEE4FF', '#FFE4F4'); for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.ellipse(60 + i * 110, 60 + (i % 2) * 140, 70, 30, 0, 0, TAU); x.fill(); } D.text(x, '☁️ ✨ 🌙', w / 2, h / 2, 64); } }; } },
  review: { title: 'Heart of the Garden Challenge', host: 'Gwenda', icon: '❤️', ch: 15, intro: 'A little of everything you learned! Make the Heart glow bright.',
    gen(l) { const k = pick(['addition', 'subtraction', 'fractions', 'arrays', 'time', 'money', 'skip', 'shapes', 'patterns']); const q = GAMES[k].gen(l); q.tag = GAMES[k].icon; return q; } },
};
// Which character hosts which game
const CHAR_GAME = { addie: 'addition', freddy: 'fractions', carlo: 'counting', subby: 'subtraction', milly: 'arrays', skippy: 'skip', gwenda: 'review', pip: 'bonds', nia: 'dreams' };

// ─── Progress (saved in this browser; synced to your account when available) ─
const PROG = (() => { try { return JSON.parse(localStorage.getItem('nng-progress-v1')) || {}; } catch (e) { return {}; } })();
PROG.games = PROG.games || {}; PROG.eights = PROG.eights || [];
const progressListeners = [];
function saveProgress() { try { localStorage.setItem('nng-progress-v1', JSON.stringify(PROG)); } catch (e) {} progressListeners.forEach(f => f(PROG)); updateHudCounts(); }
const totalStars = () => Object.values(PROG.games).reduce((s, g) => s + (g.stars || 0), 0);
function updateHudCounts() { const s = document.getElementById('hud-stars'); if (s) s.textContent = `⭐ ${totalStars()}`; const e = document.getElementById('hud-eights'); if (e) e.textContent = `8️⃣ ${PROG.eights.length}/${EIGHTS.length}`; }

// ─── Sound (tiny synth, no files) ────────────────────────────────────────────
const SFX = (() => {
  let ac = null; const ctx = () => (ac ||= new (window.AudioContext || window.webkitAudioContext)());
  const tone = (f, t0, d, type = 'sine', v = 0.15) => { const c = ctx(), o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, c.currentTime + t0); g.gain.linearRampToValueAtTime(v, c.currentTime + t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t0 + d); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + d + 0.05); };
  return {
    unlock() { try { ctx().resume(); } catch (e) {} },
    right() { try { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.35, 'triangle')); } catch (e) {} },
    wrong() { try { tone(330, 0, 0.25, 'sine', 0.12); tone(262, 0.12, 0.3, 'sine', 0.12); } catch (e) {} },
    tap() { try { tone(880, 0, 0.12, 'triangle', 0.08); } catch (e) {} },
    win() { try { [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.45, 'triangle', 0.13)); } catch (e) {} },
    sparkle() { try { [1568, 2093, 2637].forEach((f, i) => tone(f, i * 0.05, 0.3, 'sine', 0.06)); } catch (e) {} },
  };
})();
function speak(text) { try { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/\?/g, '?').replace(/(\d+)\/(\d+)/g, '$1 over $2')); u.rate = 0.92; u.pitch = 1.15; speechSynthesis.speak(u); } catch (e) {} }

// ─── 3D celebration effects ──────────────────────────────────────────────────
const BURSTS = [];
function burst(pos, color = 0xFFD86B, n = 40) {
  const p = new Float32Array(n * 3), v = []; for (let i = 0; i < n; i++) { p.set([pos.x, pos.y, pos.z], i * 3); v.push(new THREE.Vector3(rr(-1, 1), rr(1, 3), rr(-1, 1))); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: sparkTex, color, size: 0.35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; (AR.active ? AR.scene : scene).add(pts); BURSTS.push({ pts, v, life: 1.6 });
}
function updateBursts(dt) {
  for (let i = BURSTS.length - 1; i >= 0; i--) { const b = BURSTS[i], p = b.pts.geometry.attributes.position; b.life -= dt;
    for (let k = 0; k < b.v.length; k++) { b.v[k].y -= 3 * dt; p.setXYZ(k, p.getX(k) + b.v[k].x * dt, p.getY(k) + b.v[k].y * dt, p.getZ(k) + b.v[k].z * dt); }
    p.needsUpdate = true; b.pts.material.opacity = Math.max(0, b.life / 1.6); if (b.life <= 0) { b.pts.parent.remove(b.pts); BURSTS.splice(i, 1); } }
}

// ─── Game engine + panels (screen and VR) ────────────────────────────────────
const GAME = { open: false, key: null, level: 0, q: null, i: 0, total: 5, stars: 0, tries: 0, step: 0, locked: false, where: null, result: null };
const gEl = (id) => document.getElementById(id);
const gameCanvas = document.createElement('canvas'); gameCanvas.width = 560; gameCanvas.height = 300;
function openGame(key, where) {
  const G = GAMES[key]; if (!G) return;
  SFX.unlock(); window.closeDialog && closeDialog();
  const saved = PROG.games[key] || {}; Object.assign(GAME, { open: true, key, level: Math.min(2, saved.level || 0), i: 0, stars: 0, where: where ? where.clone() : null, result: null });
  gEl('game-panel').style.display = 'flex'; gEl('g-title').textContent = `${G.icon} ${G.title}`;
  gEl('g-host').textContent = (G.host ? G.host + ': ' : '') + G.intro;
  const cv = gEl('g-canvas'); if (cv && !cv.firstChild) cv.appendChild(gameCanvas);
  nextQuestion(); if (renderer.xr.isPresenting) VRPANEL.show();
}
function nextQuestion() {
  const G = GAMES[GAME.key]; GAME.q = G.gen(GAME.level); GAME.tries = 0; GAME.step = 0; GAME.locked = false;
  gEl('g-level').textContent = `${LVL[GAME.level]} · ${GAME.i + 1}/${GAME.total}`;
  gEl('g-prompt').textContent = (GAME.q.tag ? GAME.q.tag + ' ' : '') + GAME.q.prompt; gEl('g-feedback').textContent = ''; gEl('g-feedback').className = '';
  gEl('g-dots').textContent = Array.from({ length: GAME.total }, (_, k) => k < GAME.i ? '●' : k === GAME.i ? '◉' : '○').join(' ');
  renderGameCanvas();
  const box = gEl('g-options'); box.innerHTML = ''; box.className = G.mode === 'order' ? 'order' : '';
  GAME.q.options.forEach((label, idx) => { const b = document.createElement('button'); b.textContent = label; b.onclick = () => answer(idx, b); box.appendChild(b); });
  gEl('g-result').style.display = 'none'; gEl('g-play').style.display = 'block';
  if (gEl('g-autoread').checked) speak(GAME.q.prompt);
  VRPANEL.dirty = true;
}
function renderGameCanvas() { const x = gameCanvas.getContext('2d'); x.clearRect(0, 0, 560, 300); GAME.q.draw && GAME.q.draw(x, 560, 300, GAME); }
function answer(idx, btn) {
  if (GAME.locked) return; const G = GAMES[GAME.key], q = GAME.q;
  if (G.mode === 'order') {
    const val = Number(q.options[idx]);
    if (val === q.seq[GAME.step]) { GAME.step++; SFX.tap(); if (btn) { btn.disabled = true; btn.classList.add('ok'); } renderGameCanvas(); VRPANEL.dirty = true;
      if (GAME.step >= q.seq.length) { if (GAME.key === 'counting' && CARLO) carloTransform(); return correct(true); } }
    else { GAME.tries++; SFX.wrong(); if (btn) { btn.classList.add('shake'); setTimeout(() => btn.classList.remove('shake'), 400); } feedback(`Not yet — look for ${q.seq[GAME.step]}!`, 'no'); }
    return;
  }
  if (idx === q.answer) { if (btn) btn.classList.add('ok'); correct(GAME.tries === 0); }
  else { GAME.tries++; SFX.wrong(); if (btn) { btn.classList.add('no'); btn.disabled = true; } feedback(GAME.tries >= 2 ? 'Hint: ' + q.explain : 'Almost! Try again.', 'no'); VRPANEL.dirty = true; }
}
function feedback(t, cls) { const f = gEl('g-feedback'); f.textContent = t; f.className = cls; VRPANEL.fb = t; VRPANEL.dirty = true; }
function correct(firstTry) {
  GAME.locked = true; if (firstTry) GAME.stars++; SFX.right();
  feedback((firstTry ? '⭐ ' : '✅ ') + pick(['Amazing!', 'You got it!', 'Super math!', 'Brilliant!', 'Way to go!']) + ' ' + GAME.q.explain, 'yes');
  const at = GAME.where || controls.target; burst(new THREE.Vector3(at.x, at.y + 1.5, at.z), pick([0xFFD86B, 0xFF8FD0, 0x9FE0FF]));
  const host = CHARS.find(c => c.userData.name.startsWith(GAMES[GAME.key].host || '~')); if (host) host.userData.excite = 2;
  setTimeout(() => { GAME.i++; if (GAME.i >= GAME.total) finishGame(); else nextQuestion(); }, 1500);
}
function finishGame() {
  const k = GAME.key, saved = PROG.games[k] || { stars: 0, level: 0, plays: 0 };
  saved.plays++; saved.stars = Math.max(saved.stars || 0, 0) + GAME.stars; saved.best = Math.max(saved.best || 0, GAME.stars);
  const up = GAME.stars >= 4 && saved.level < 2; if (up) saved.level++;
  saved.badge = true; PROG.games[k] = saved; saveProgress(); SFX.win();
  GAME.result = { stars: GAME.stars, up };
  gEl('g-play').style.display = 'none'; gEl('g-result').style.display = 'block';
  gEl('g-res-stars').textContent = '⭐'.repeat(GAME.stars) + '☆'.repeat(GAME.total - GAME.stars);
  gEl('g-res-text').textContent = `${GAME.stars} star${GAME.stars === 1 ? '' : 's'}! ${up ? `You leveled up to ${LVL[saved.level]}! 🌱` : GAME.stars >= 4 ? 'Top level mastered! 🌟' : 'Play again to level up!'}`;
  const at = GAME.where || controls.target; for (let i = 0; i < 4; i++) setTimeout(() => burst(new THREE.Vector3(at.x + rr(-1, 1), at.y + 1.5, at.z + rr(-1, 1)), pick([0xFFD86B, 0xFF8FD0, 0x9FE0FF, 0xB8FF9F]), 60), i * 250);
  if (k === 'review' && HEART.mesh) { HEART.boost = 6; }
  VRPANEL.dirty = true; window.onGameFinished && window.onGameFinished(k, GAME.stars);
}
window.closeGame = () => { GAME.open = false; gEl('game-panel').style.display = 'none'; try { speechSynthesis.cancel(); } catch (e) {} VRPANEL.hide(); };
window.replayGame = () => openGame(GAME.key, GAME.where);
window.readGame = () => GAME.q && speak(GAME.q.prompt);

// Carlo transforms into the Number Ten Butterfly when you wake him!
function carloTransform() {
  if (CARLO.userData.wings) { CARLO.userData.transformT = 12; return; }
  const [c, e] = magicWing('upper', loopTen(), '#3C0F78', '#A35CF0');
  const piv = grp(CARLO); piv.position.set(0, 1.0, -0.5); const W = [];
  for (const s of [-1, 1]) { const p = grp(piv); const w = wingPlane(1.6, 1.6, c, e, { glow: 2, sheen: 0, irid: 0.2 }); w.rotation.y = s > 0 ? 0 : Math.PI; p.add(w); W.push([p, s]); }
  CARLO.userData.wings = { piv, W }; CARLO.userData.transformT = 12;
  ANIM.push((t, dt) => { const ud = CARLO.userData; ud.transformT = Math.max(0, ud.transformT - dt); const on = ud.transformT > 0; piv.visible = on; piv.scale.setScalar(on ? Math.min(1, (12 - ud.transformT) * 2, ud.transformT) : 0.001); W.forEach(([p, s]) => p.rotation.y = s * (0.3 + Math.sin(t * 6) * 0.5)); });
}
function loopTen() { return (x, w, h, em) => { x.save(); x.shadowColor = '#FFD86B'; x.shadowBlur = em ? 40 : 15; x.fillStyle = em ? '#FFF0B0' : '#FFD86B'; x.font = `${w * 0.42}px "Fredoka One", Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('10', w * 0.52, h * 0.52); x.restore(); }; }

// ─── VR game panel (canvas texture you point at with a controller) ──────────
const VRPANEL = (() => {
  const W = 1024, Hh = 900, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const x = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false })); mesh.visible = false; mesh.renderOrder = 20; scene.add(mesh);
  const P = { mesh, dirty: false, fb: '', buttons: [] };
  P.show = () => { const d = new THREE.Vector3(), cp = new THREE.Vector3(); camera.updateMatrixWorld(true); camera.getWorldDirection(d); d.y = 0; if (d.lengthSq() < 1e-4) d.set(0, 0, -1); d.normalize(); camera.getWorldPosition(cp); mesh.position.copy(cp).addScaledVector(d, 1.3); mesh.position.y = cp.y - 0.15; mesh.lookAt(cp.x, mesh.position.y, cp.z); mesh.visible = true; P.dirty = true; };
  P.hide = () => { mesh.visible = false; };
  P.draw = () => {
    if (!P.dirty || !mesh.visible) return; P.dirty = false; const G = GAMES[GAME.key];
    x.clearRect(0, 0, W, Hh); x.fillStyle = 'rgba(30,10,60,0.94)'; x.beginPath(); x.roundRect(4, 4, W - 8, Hh - 8, 40); x.fill(); x.strokeStyle = '#FFD24A'; x.lineWidth = 8; x.stroke();
    D.text(x, `${G.icon} ${G.title}`, W / 2, 50, 44, '#FFE27A');
    if (GAME.result) { D.text(x, '⭐'.repeat(GAME.result.stars) || '🌱', W / 2, 300, 90, '#FFE27A'); D.text(x, GAME.result.up ? 'Level up!' : 'Great playing!', W / 2, 420, 52, '#fff'); P.buttons = [{ label: 'Play again', act: () => window.replayGame(), r: [180, 560, 300, 110] }, { label: 'Close', act: () => window.closeGame(), r: [544, 560, 300, 110] }]; }
    else { x.drawImage(gameCanvas, 92, 90, 840, 450); x.fillStyle = '#fff'; D.font(x, 34); x.textAlign = 'center'; wrapText(x, GAME.q.prompt, W / 2, 590, W - 80, 40);
      const n = GAME.q.options.length, cols = n > 4 ? 5 : n, bw = (W - 80) / cols - 16, bh = n > 4 ? 70 : 100;
      P.buttons = GAME.q.options.map((label, i) => ({ label, act: () => answer(i, null), r: [40 + (i % cols) * (bw + 16), 650 + Math.floor(i / cols) * (bh + 12), bw, bh], done: GAMES[GAME.key].mode === 'order' && GAME.q.seq.indexOf(Number(label)) < GAME.step }));
      P.buttons.push({ label: '✕', act: () => window.closeGame(), r: [W - 100, 20, 70, 60] });
      if (P.fb) D.text(x, P.fb.slice(0, 60), W / 2, Hh - 24, 26, '#9FFFB0'); }
    for (const b of P.buttons) { const [bx, by, bw, bh] = b.r; x.fillStyle = b.done ? '#2E7D32' : '#7B2CBF'; x.beginPath(); x.roundRect(bx, by, bw, bh, 20); x.fill(); x.strokeStyle = '#FFD24A'; x.lineWidth = 4; x.stroke(); D.text(x, b.label, bx + bw / 2, by + bh / 2, Math.min(40, bh * 0.45), '#fff'); }
    tex.needsUpdate = true;
  };
  P.hit = (uv) => { const px = uv.x * W, py = (1 - uv.y) * Hh; for (const b of P.buttons) { const [bx, by, bw, bh] = b.r; if (px > bx && px < bx + bw && py > by && py < by + bh) { b.act(); P.dirty = true; return true; } } return false; };
  return P;
})();
function wrapText(x, s, X, Y, maxW, lh) { const words = s.split(' '); let line = '', y = Y; for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW) { x.fillText(line, X, y); line = w; y += lh; } else line = t; } x.fillText(line, X, y); }

// ─── Garden Journal (progress book) ──────────────────────────────────────────
window.openJournal = () => {
  SFX.unlock(); const list = gEl('j-list'); list.innerHTML = '';
  const keys = Object.keys(GAMES).sort((a, b) => (GAMES[a].ch ?? 99) - (GAMES[b].ch ?? 99));
  for (const k of keys) { const G = GAMES[k], s = PROG.games[k]; const li = document.createElement('div'); li.className = 'j-item' + (s?.badge ? ' got' : '');
    const ic = document.createElement('div'); ic.className = 'j-ic'; ic.textContent = G.icon; const tx = document.createElement('div'); tx.className = 'j-tx';
    const t1 = document.createElement('b'); t1.textContent = G.title; const t2 = document.createElement('span'); t2.textContent = `${G.ch ? 'Chapter ' + G.ch + ' · ' : ''}${s ? `${LVL[s.level || 0]} · ⭐ ${s.stars}` : 'Not played yet'}`;
    tx.append(t1, t2); li.append(ic, tx); list.appendChild(li); }
  gEl('j-summary').textContent = `⭐ ${totalStars()} stars · 🏅 ${Object.values(PROG.games).filter(g => g.badge).length}/${keys.length} badges · 8️⃣ ${PROG.eights.length}/${EIGHTS.length} golden 8s found`;
  gEl('journal').style.display = 'flex';
};
window.closeJournal = () => { gEl('journal').style.display = 'none'; };
