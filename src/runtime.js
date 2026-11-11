// line-icon-pack runtime geometry – builds an icon's SVG body from its parametric data so the
// corner radius can be chosen by the user. Dependency-free; shared by the JS API, the React
// components, the CLI/MCP server and the review page.
//
// Data format (per icon: an array of entries; f = flags: 1 stroked, 2 filled):
//   ['c', cx, cy, r, f]                    circle
//   ['r', x, y, w, h, rx, f, rmax?]        rect (rx = designed corner radius)
//   ['p', f, subpath, subpath, …]          path; subpath = [closed, node, node, …], node:
//        [x, y]                              line to (or the start point)
//        [x, y, r, rmax?]                    corner: line to the virtual corner (x, y), rounded
//                                            with the designed radius r (0 = sharp)
//        [x, y, r, -1, drawn]                a corner between curves (a shield's tip): edges are the
//                                            tangent rays of its neighbours; a chosen radius is at
//                                            most r and may use those edges in full
//        [x, y, r, rmax|null, drawn]         the same corner, drawn by hand: drawn = [x0, y0, c1x,
//                                            c1y, c2x, c2y, x1, y1, …] is the curve as drawn; it is
//                                            used as it is for the designed radii, and the corner is
//                                            rebuilt as a circular fillet only for a chosen radius
//        [c1x, c1y, c2x, c2y, x, y]          cubic curve to
//   ['j', el, sub, end, tel, tsub]         attachment: an open stroke end (end 0 = start, 1 = end)
//                                          that sits on another outline and must follow it
//
// opts.radius: undefined → designed radii; a number (px on the 24 grid) → every corner between
// two straight lines and every rect gets that radius, limited by
//   • the edge length (a corner takes at most half of an edge, like Figma),
//   • rmax – the largest radius that keeps the designed clearance to the other parts of the icon
//     (precomputed at build time), so rounding never makes parts collide or crowd each other,
//   • the angle – an acute corner (star or bolt tip) cuts no more of its edges than a right angle
//     with the same radius, so the shape stays recognisable.
// Design curves (an eye, a bag handle, a bowl) are stored as curves and never change.
// Pill shapes (rx = half the height) stay pills. Strokes attached to an outline are re-landed on
// the rounded outline, so nothing pokes out of a rounded corner.

const fmt = (v) => { const r = Math.round(v * 100) / 100; return String(Object.is(r, -0) ? 0 : r); };
const pt = (p) => `${fmt(p[0])} ${fmt(p[1])}`;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (v) => Math.hypot(v[0], v[1]);
const norm = (v) => { const l = len(v); return l ? [v[0] / l, v[1] / l] : [0, 0]; };
const position = (node) => (node.length === 6 ? [node[4], node[5]] : [node[0], node[1]]);

// Rules for a chosen radius (Rounded, the slider), so that rounding stays balanced:
const ZIG_EDGE = 4.5;     // an edge up to this long with a corner at both ends (stairs, battlements,
                          // zigzags, podium steps) gives each of them a quarter of it, not a half
const SMALL_SHAPE = 0.25; // a shape (closed, or an open bar) is rounded by at most this share of its smaller side
const TIP_TURN = (2 * Math.PI) / 3; // corners turning more than 120° (< 60° inside): tips, kept as drawn
// keepLarger keeps only radii drawn clearly rounder than the preset (logo frames, ~5 px); a corner
// drawn at 2.1–2.9 px gets the preset's radius like the rest, so the set stays even (Petr, 2026-11-10)
const KEEP_FROM = 3;

/** Segments ({type:'L'|'C', p0, p1, c1?, c2?}) of one subpath at the given radius.
 *  opts.keepLarger (the Rounded preset): a corner drawn from KEEP_FROM up stays as round as drawn. */
export function subpathSegments(sp, radius, opts = {}) {
  const closed = sp[0] === 1, nodes = sp.slice(1), n = nodes.length;
  // a small closed shape (a bar, a handle) gets a proportionally smaller radius: no pills, no dots
  let smallCap = Infinity;
  if (radius != null && n > 3) {
    const ps = nodes.map(position);
    const w = Math.max(...ps.map((p) => p[0])) - Math.min(...ps.map((p) => p[0]));
    const h = Math.max(...ps.map((p) => p[1])) - Math.min(...ps.map((p) => p[1]));
    smallCap = Math.min(w, h) * SMALL_SHAPE;
  }
  // 1. desired tangent length of every corner
  const info = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const nd = nodes[i];
    if (nd.length < 3 || nd.length > 5) continue;
    if (radius == null && nd.length === 5) continue; // drawn corner: emitted as drawn below
    if (!closed && (i === 0 || i === n - 1)) continue;
    const A = position(nodes[(i - 1 + n) % n]), B = position(nodes[(i + 1) % n]), X = [nd[0], nd[1]];
    const u = norm(sub(X, A)), v = norm(sub(B, X));
    const phi = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))); // turning angle
    if (phi < 1e-3 || Math.PI - phi < 1e-3) continue;
    let r = radius == null ? nd[2] : radius;
    if (radius != null) {
      if (opts.keepLarger && nd[2] >= KEEP_FROM && nd[2] > r) r = nd[2];
      // a tip (chevron, arrowhead, check mark, a bolt or star point) keeps its drawn shape: a
      // chosen radius may make it sharper (Sharp), never blunter
      if ((!closed && n === 3) || phi > TIP_TURN) r = Math.min(r, nd[2]);
      r = Math.min(r, Math.max(nd[2], smallCap));
      if (nd[3] === -1) r = Math.min(r, nd[2]); // corner between curves: never rounder than drawn
      else if (nd[3] != null) r = Math.min(r, nd[3]); // rmax ≥ designed radius by construction
    }
    const tan = Math.tan(phi / 2);
    // an acute corner (a star or bolt tip) is rounded less, so the radius does not eat the shape:
    // it cuts no more of its edges than a right angle with the same radius would (sharper → less)
    if (radius != null && tan > 1) r /= tan;
    info[i] = { X, u, v, phi, tan, t: r * tan, td: nd[2] * tan, keep: nd[2] >= KEEP_FROM, la: len(sub(X, A)), lb: len(sub(B, X)), curved: nd[3] === -1 };
  }
  // 2. an edge too short for both of its corners is shared in proportion to what each needs;
  //    a user-chosen radius may take at most half of an edge (keeps check marks, chevrons legible)
  const want = (i) => info[(i + n) % n]?.t ?? 0;
  const corner = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const c = info[i];
    if (!c) continue;
    const tp = want(i - 1), tn = want(i + 1);
    let t = c.t;
    if (radius != null) {
      const zig = (j, edge) => edge <= ZIG_EDGE && !!info[(j + n) % n];
      if (c.curved) t = Math.min(t, c.la, c.lb); // tangent rays: usable in full
      else t = Math.min(t, c.la / (zig(i - 1, c.la) ? 4 : 2), c.lb / (zig(i + 1, c.lb) ? 4 : 2));
      // the Rounded preset keeps a clearly rounder drawn corner (a logo frame) as it is
      if (opts.keepLarger && c.keep) t = Math.max(t, Math.min(c.td, c.la / 2, c.lb / 2));
    }
    if (t + tp > c.la) t = Math.min(t, (c.la * c.t) / (c.t + tp));
    if (t + tn > c.lb) t = Math.min(t, (c.lb * c.t) / (c.t + tn));
    const r = t / c.tan;
    if (r < 0.01) continue;
    const { X, u, v } = c;
    const h = (4 / 3) * Math.tan(c.phi / 4) * r;
    const T1 = [X[0] - u[0] * t, X[1] - u[1] * t], T2 = [X[0] + v[0] * t, X[1] + v[1] * t];
    corner[i] = { T1, T2, c1: [T1[0] + u[0] * h, T1[1] + u[1] * h], c2: [T2[0] - v[0] * h, T2[1] - v[1] * h] };
  }
  // 3. segments
  const segs = [];
  let cur = corner[0] ? corner[0].T2 : position(nodes[0]);
  const lineTo = (p) => { if (len(sub(p, cur)) > 1e-9) segs.push({ type: 'L', p0: cur, p1: p }); cur = p; };
  const fillet = (c) => { lineTo(c.T1); segs.push({ type: 'C', p0: cur, c1: c.c1, c2: c.c2, p1: c.T2 }); cur = c.T2; };
  const drawnCorner = (d) => {
    lineTo([d[0], d[1]]);
    for (let k = 2; k + 5 < d.length; k += 6) { const p1 = [d[k + 4], d[k + 5]]; segs.push({ type: 'C', p0: cur, c1: [d[k], d[k + 1]], c2: [d[k + 2], d[k + 3]], p1 }); cur = p1; }
  };
  for (let i = 1; i < n; i++) {
    const nd = nodes[i];
    if (nd.length === 6) { const p1 = [nd[4], nd[5]]; segs.push({ type: 'C', p0: cur, c1: [nd[0], nd[1]], c2: [nd[2], nd[3]], p1 }); cur = p1; }
    else if (radius == null && nd.length === 5) drawnCorner(nd[4]);
    else if (corner[i]) fillet(corner[i]);
    else lineTo([nd[0], nd[1]]);
  }
  if (closed) { if (corner[0]) fillet(corner[0]); else lineTo(segs.length ? segs[0].p0 : cur); }
  return { segs, closed, start: segs.length ? segs[0].p0 : cur };
}

function rectGeometry(el, radius, opts = {}) {
  const [, x, y, w, h, rx0, , rmax] = el;
  const half = Math.min(w, h) / 2;
  let rx = rx0;
  if (radius != null && rx0 < half - 0.01) {
    rx = opts.keepLarger && rx0 >= KEEP_FROM ? Math.max(radius, rx0) : radius;
    rx = Math.min(rx, Math.max(rx0, Math.min(w, h) * SMALL_SHAPE), half, rmax ?? Infinity);
  }
  return rx;
}
export function rectSegments(el, rx) {
  const [, x, y, w, h] = el;
  const sp = [1, [x + w / 2, y], [x + w, y, rx], [x + w, y + h, rx], [x, y + h, rx], [x, y, rx]];
  return subpathSegments(sp, undefined);
}

function serialize({ segs, closed, start }) {
  if (!segs.length) return `M${pt(start)}`;
  let d = `M${pt(segs[0].p0)}`;
  segs.forEach((s, i) => {
    if (closed && i === segs.length - 1 && s.type === 'L') return; // Z draws the closing line
    d += s.type === 'C' ? `C${pt(s.c1)} ${pt(s.c2)} ${pt(s.p1)}` : `L${pt(s.p1)}`;
  });
  return closed ? d + 'Z' : d;
}

// ---------- re-landing attached stroke ends ----------
const cubicAt = (s, t) => { const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, e = t * t * t; return [a * s.p0[0] + b * s.c1[0] + c * s.c2[0] + e * s.p1[0], a * s.p0[1] + b * s.c1[1] + c * s.c2[1] + e * s.p1[1]]; };
function polyline(segs) {
  const out = [];
  for (const s of segs) {
    if (!out.length) out.push(s.p0);
    if (s.type === 'L') out.push(s.p1);
    else for (let k = 1; k <= 24; k++) out.push(cubicAt(s, k / 24));
  }
  return out;
}
/** Intersections of the infinite line through P with direction d and a polyline → points. */
function hits(P, d, poly) {
  const out = [];
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1], b = poly[i], e = sub(b, a);
    const den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-12) continue;
    const w = sub(a, P);
    const t = (w[0] * e[1] - w[1] * e[0]) / den, s = (w[0] * d[1] - w[1] * d[0]) / den;
    if (s >= -1e-9 && s <= 1 + 1e-9) out.push([P[0] + d[0] * t, P[1] + d[1] * t]);
  }
  return out;
}
function reland(geo, j) {
  const [, el, si, end, tel, tsi] = j;
  const g = geo[el]?.subs?.[si], target = geo[tel]?.subs?.[tsi];
  if (!g || !target || !g.segs.length) return;
  const seg = end ? g.segs[g.segs.length - 1] : g.segs[0];
  const P = end ? seg.p1 : seg.p0;
  const dir = seg.type === 'L' ? sub(seg.p1, seg.p0) : end ? sub(seg.p1, seg.c2) : sub(seg.c1, seg.p0);
  if (len(dir) < 1e-9) return;
  const poly = polyline(target.segs);
  // still on the outline (that part of it did not change) → nothing to do
  for (let i = 1; i < poly.length; i++) {
    const A = poly[i - 1], e = sub(poly[i], A), l = e[0] * e[0] + e[1] * e[1];
    const t = l ? Math.max(0, Math.min(1, ((P[0] - A[0]) * e[0] + (P[1] - A[1]) * e[1]) / l)) : 0;
    if (Math.hypot(A[0] + e[0] * t - P[0], A[1] + e[1] * t - P[1]) < 0.03) return;
  }
  let best = null, bd = 3;
  for (const q of hits(P, norm(dir), poly)) { const dd = len(sub(q, P)); if (dd < bd) { bd = dd; best = q; } }
  if (!best || bd < 1e-4) return;
  const dv = sub(best, P);
  if (end) { seg.p1 = best; if (seg.c2) seg.c2 = [seg.c2[0] + dv[0], seg.c2[1] + dv[1]]; }
  else { seg.p0 = best; if (seg.c1) seg.c1 = [seg.c1[0] + dv[0], seg.c1[1] + dv[1]]; if (g.segs.length) g.start = best; }
}

const paint = (f) => (f & 2 ? ' fill="currentColor"' : '') + (f & 1 ? '' : ' stroke="none"');

/** SVG body (the elements inside <svg>) of an icon. */
/**
 * Sharp style: a stroke end attached to another outline is pulled back by half the stroke width,
 * so its square cap ends on that outline's centre line and stays inside its stroke. Without it the
 * cap reached half a width past the line, and where a stroke meets it at an angle (a bag handle)
 * its corner stuck out on the other side. Round caps hide inside the stroke, so only Sharp needs it.
 */
function tuck(geo, j, d) {
  const [, el, si, end] = j;
  const g = geo[el]?.subs?.[si];
  if (!g || !g.segs.length) return;
  const seg = end ? g.segs[g.segs.length - 1] : g.segs[0];
  const P = end ? seg.p1 : seg.p0;
  const Q = seg.type === 'L' ? (end ? seg.p0 : seg.p1) : end ? seg.c2 : seg.c1;
  const l = len(sub(P, Q));
  if (seg.type === 'L' ? l < 2 * d : l < 1e-6) return; // too short to shorten without changing it
  const u = norm(sub(Q, P)), m = [u[0] * d, u[1] * d];
  const move = (p) => [p[0] + m[0], p[1] + m[1]];
  if (end) { seg.p1 = move(seg.p1); if (seg.c2) seg.c2 = move(seg.c2); }
  else { seg.p0 = move(seg.p0); if (seg.c1) seg.c1 = move(seg.c1); if (g.segs.length) g.start = seg.p0; }
}

// ---------- keyline fit ----------
// A drawn shape can hide its corners: a star with well-rounded points has its virtual tips outside
// the icon. Rounded, Sharp or the slider bring them back, and the shape would run out of the 24 box.
// So the built body is measured – the painted area of a 1.5 px stroke: round caps and joins, or
// square caps and mitred corners for the sharp style – and when it reaches past FIT_EDGE (the
// 1.25 px keyline less a little overshoot for sharp points) the whole body is scaled down around the
// centre until it fits; the stroke keeps its width. The designed Original fits and is never scaled.
const FIT_EDGE = 0.9;
const FIT_HALF = 0.75; // half the default stroke: the fit is the same for every stroke width
const ends = (s) => [s.type === 'C' ? norm(sub(s.c1, s.p0)).some(Boolean) ? norm(sub(s.c1, s.p0)) : norm(sub(s.p1, s.p0)) : norm(sub(s.p1, s.p0)),
  s.type === 'C' ? norm(sub(s.p1, s.c2)).some(Boolean) ? norm(sub(s.p1, s.c2)) : norm(sub(s.p1, s.p0)) : norm(sub(s.p1, s.p0))];
/** Scale (≤ 1) that keeps the painted body inside the keyline, for a geometry built by buildBody. */
function fitOf(geo, sharp) {
  const h = FIT_HALF, cands = []; // [point, offset]
  const disk = (p) => { cands.push([p, [-h, 0]], [p, [h, 0]], [p, [0, -h]], [p, [0, h]]); };
  for (const g of geo) {
    if (!g) continue;
    for (const sp of g.subs) {
      const segs = sp.segs;
      if (!segs.length) continue;
      for (const s of segs) {
        disk(s.p0); disk(s.p1);
        if (s.type === 'C') for (let k = 1; k < 16; k++) disk(cubicAt(s, k / 16));
      }
      if (!sharp) continue;
      // mitred joins (limit 2, as svgAttrs): the tip of each corner
      const joins = segs.map((s, i) => [s, segs[i + 1] ?? (sp.closed ? segs[0] : null)]).filter(([, b]) => b);
      for (const [a, b] of joins) {
        const t1 = ends(a)[1], t2 = ends(b)[0];
        const cos = Math.max(-1, Math.min(1, t1[0] * t2[0] + t1[1] * t2[1]));
        if (cos > 0.9998) continue; // straight on
        const ratio = 1 / Math.sin((Math.PI - Math.acos(cos)) / 2);
        if (ratio > 2) continue; // bevelled: inside the round extent
        const dir = norm(sub(t1, t2));
        cands.push([a.p1, [dir[0] * h * ratio, dir[1] * h * ratio]]);
      }
      // square caps on open ends
      if (!sp.closed) for (const [p, t] of [[segs[0].p0, ends(segs[0])[0].map((v) => -v)], [segs.at(-1).p1, ends(segs.at(-1))[1]]]) {
        const n = [-t[1], t[0]];
        for (const sg of [1, -1]) cands.push([p, [(t[0] + sg * n[0]) * h, (t[1] + sg * n[1]) * h]]);
      }
    }
  }
  let s = 1;
  for (const [p, o] of cands) for (const ax of [0, 1]) {
    const c = p[ax] - 12, q = c + o[ax]; // painted coordinate around the centre
    if (Math.abs(q) <= 12 - FIT_EDGE) continue;
    if (c * o[ax] < 0 || Math.abs(c) < 1e-6) continue; // the offset points inwards
    s = Math.min(s, (12 - FIT_EDGE - Math.abs(o[ax])) / Math.abs(c));
  }
  return Math.max(0.5, s);
}

export function buildBody(data, { radius, keepLarger, style, strokeWidth = 1.5, fit = true } = {}) {
  if (radius != null) radius = Math.max(0, Number(radius) || 0);
  const opts = { keepLarger: !!keepLarger };
  const geo = data.map((el) => {
    if (el[0] === 'p') return { el, subs: el.slice(2).map((sp) => subpathSegments(sp, radius, opts)) };
    if (el[0] === 'r') { const rx = rectGeometry(el, radius, opts); return { el, rx, subs: [rectSegments(el, rx)] }; }
    if (el[0] === 'c') {
      const [, cx, cy, r] = el, k = 0.5523 * r;
      const segs = [[cx + r, cy, cx + r, cy + k, cx + k, cy + r, cx, cy + r], [cx, cy + r, cx - k, cy + r, cx - r, cy + k, cx - r, cy], [cx - r, cy, cx - r, cy - k, cx - k, cy - r, cx, cy - r], [cx, cy - r, cx + k, cy - r, cx + r, cy - k, cx + r, cy]]
        .map((a) => ({ type: 'C', p0: [a[0], a[1]], c1: [a[2], a[3]], c2: [a[4], a[5]], p1: [a[6], a[7]] }));
      return { el, subs: [{ segs, closed: true }] };
    }
    return null;
  });
  for (const e of data) if (e[0] === 'j') reland(geo, e);
  if (style === 'sharp') for (const e of data) if (e[0] === 'j') tuck(geo, e, strokeWidth / 2);
  const scale = fit ? fitOf(geo, style === 'sharp') : 1;
  const body = geo.map((g) => {
    if (!g) return '';
    const { el } = g;
    if (el[0] === 'c') return `<circle cx="${fmt(el[1])}" cy="${fmt(el[2])}" r="${fmt(el[3])}"${paint(el[4])}/>`;
    if (el[0] === 'r') return `<rect x="${fmt(el[1])}" y="${fmt(el[2])}" width="${fmt(el[3])}" height="${fmt(el[4])}"${g.rx > 0.005 ? ` rx="${fmt(g.rx)}"` : ''}${paint(el[6])}/>`;
    return `<path d="${g.subs.map(serialize).join('')}"${paint(el[1])}/>`;
  }).join('');
  if (scale > 0.999) return body;
  const k = Math.round(scale * 1e4) / 1e4, t = Math.round((12 - 12 * k) * 1e4) / 1e4;
  return `<g transform="matrix(${k} 0 0 ${k} ${t} ${t})" stroke-width="${Math.round((strokeWidth / k) * 1e4) / 1e4}">${body}</g>`;
}

/** The keyline fit of buildBody: scale k around the icon's centre (1 = none). */
export function fitScale(data, opts = {}) {
  const m = buildBody(data, opts).match(/^<g transform="matrix\(([\d.]+) /);
  return m ? Number(m[1]) : 1;
}

/**
 * Root attributes. style: 'round' (round caps + joins, default) | 'sharp' (square caps + miter joins;
 * miter limit 2 bevels tips sharper than 60° – a star point would otherwise spike out of the icon).
 */
export function svgAttrs({ size = 24, strokeWidth = 1.5, style = 'round' } = {}) {
  const sharp = style === 'sharp';
  return `xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="${sharp ? 'square' : 'round'}" stroke-linejoin="${sharp ? 'miter' : 'round'}"${sharp ? ' stroke-miterlimit="2"' : ''}`;
}

export function buildSvg(data, opts = {}) {
  const color = opts.color && opts.color !== 'currentColor' ? ` style="color:${opts.color}"` : '';
  const title = opts.title ? `<title>${String(opts.title).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</title>` : '';
  const cls = opts.className ? ` class="${opts.className}"` : '';
  return `<svg ${svgAttrs(opts)}${cls}${color}${opts.title ? ' role="img"' : ' aria-hidden="true"'}>${title}${buildBody(data, opts)}</svg>`;
}
