import React, { useEffect, useImperativeHandle, useRef } from "react";
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";
import { IoAddOutline, IoRemoveOutline, IoScanOutline } from "react-icons/io5";
import { DEFAULT_GRAPH_SETTINGS, GRAPH_COLORS } from "./archiveGraphData.js";

/**
 * 옵시디언 그래프 뷰처럼 그리는 캔버스.
 * - 포스 레이아웃(d3-force), 드래그로 노드 끌기, 휠·핀치 줌, 빈 곳 드래그로 이동
 * - 마우스를 올리면 그 노드와 이웃만 밝게, 나머지는 흐리게
 * - 줌 아웃하면 글자가 흐려지고(텍스트 페이드 임계값), 이웃 글자는 항상 보임
 * - 노드 크기는 연결 수에 따라 커짐
 * 레이아웃은 layoutKey 별로 기억해서 다시 열어도 같은 모양으로 시작한다.
 */

const layoutCache = new Map();
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const MIN_K = 0.05;
const MAX_K = 8;

const radiusOf = (n, size) => {
  const base = n.type === "group" ? 5 : n.type === "record" ? 4.2 : n.type === "branch" ? 3.8 : n.type === "notice" ? 3 : 3.2;
  return base * size * (1 + Math.sqrt(n.degree || 0) * 0.32);
};

const readColors = (el) => {
  const css = getComputedStyle(el);
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  return {
    text: v("--text-primary", "#ffffff"),
    node: v("--text-secondary", "#b4b4b4"),
    dim: v("--text-more", "#9a9a9a"),
    line: v("--text-more", "#9a9a9a"),
    accent: v("--archive-pick", "#ff3b3b"),
    bg: v("--box-1", "#121212"),
  };
};

const ArchiveGraph = React.forwardRef(function ArchiveGraph(
  { graph, settings, onOpen, focusId, layoutKey = "global", className = "", label = "아카이브 그래프", timelapse = 0, showControls = true },
  ref,
) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const st = useRef(null);
  if (!st.current) {
    st.current = {
      nodes: [], links: [], byId: new Map(), sim: null,
      t: { x: 0, y: 0, k: 1 }, goal: null, w: 300, h: 300, dpr: 1,
      hover: null, focus: null, neighbors: new Set(), fade: 0,
      dirty: true, fitted: false, colors: null, settings: DEFAULT_GRAPH_SETTINGS, focusId: null,
      pointers: new Map(), gesture: null, reveal: null,
    };
  }
  const s = st.current;
  s.settings = { ...DEFAULT_GRAPH_SETTINGS, ...settings };
  s.focusId = focusId ?? null;

  const fit = (animate = true) => {
    const list = s.nodes.filter((n) => Number.isFinite(n.x));
    if (!list.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of list) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
    const k = clamp(Math.min(s.w / (x1 - x0 + 120), s.h / (y1 - y0 + 120)), MIN_K, 2.2);
    const goal = { k, x: -((x0 + x1) / 2) * k, y: -((y0 + y1) / 2) * k };
    if (animate) s.goal = goal;
    else s.t = goal;
    s.dirty = true;
  };
  const zoomBy = (factor, px = s.w / 2, py = s.h / 2) => {
    const base = s.goal ?? s.t;
    const k = clamp(base.k * factor, MIN_K, MAX_K);
    const wx = (px - s.w / 2 - base.x) / base.k;
    const wy = (py - s.h / 2 - base.y) / base.k;
    s.goal = { k, x: px - s.w / 2 - wx * k, y: py - s.h / 2 - wy * k };
    s.dirty = true;
  };
  useImperativeHandle(ref, () => ({ fit: () => fit(true) }));

  /* ---------- 시뮬레이션 (한 번 만들고 계속 씀) ---------- */
  useEffect(() => {
    const sim = forceSimulation([])
      .force("link", forceLink([]).id((d) => d.id))
      .force("charge", forceManyBody().theta(0.9).distanceMax(900))
      .force("x", forceX(0))
      .force("y", forceY(0))
      .force("collide", forceCollide((d) => radiusOf(d, s.settings.nodeSize) + 2))
      .alphaDecay(0.025)
      .velocityDecay(0.35)
      .on("tick", () => {
        s.dirty = true;
        if (!s.fitted && sim.alpha() < 0.25 && s.nodes.length) {
          s.fitted = true;
          fit(true);
        }
      });
    s.sim = sim;
    return () => {
      sim.stop();
      const cache = new Map(s.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
      layoutCache.set(layoutKey, { pos: cache, t: { ...s.t } });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 힘 설정 */
  const { centerForce, repelForce, linkForce, linkDistance, nodeSize } = s.settings;
  useEffect(() => {
    const sim = s.sim;
    sim.force("charge").strength(-repelForce);
    sim.force("x").strength(centerForce);
    sim.force("y").strength(centerForce);
    // 묶음→기록은 길게, 갈래 줄기는 짧게 → 나무처럼 갈라져 뻗어 나감
    const LENGTH = { group: 1.4, branch: 0.9, contains: 0.6, flow: 0.55 };
    sim.force("link").strength((l) => (l.kind === "flow" ? Math.min(1, linkForce * 1.3) : linkForce))
      .distance((l) => linkDistance * (LENGTH[l.kind] ?? 1));
    sim.force("collide").radius((d) => radiusOf(d, nodeSize) + 2);
    sim.alpha(Math.max(sim.alpha(), 0.3)).restart();
    s.dirty = true;
  }, [centerForce, repelForce, linkForce, linkDistance, nodeSize, s]);

  /* 그래프 데이터 (위치는 이전 노드 · 캐시에서 이어받음) */
  useEffect(() => {
    const cached = layoutCache.get(layoutKey);
    const prev = s.byId;
    const placed = new Map();
    const nodes = graph.nodes.map((n) => {
      const old = prev.get(n.id) ?? cached?.pos.get(n.id);
      const node = { ...n };
      if (old && Number.isFinite(old.x)) { node.x = old.x; node.y = old.y; node.vx = old.vx ?? 0; node.vy = old.vy ?? 0; placed.set(n.id, node); }
      return node;
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    // 새 노드는 이미 자리 잡은 이웃 근처에서 시작
    for (const l of graph.links) {
      for (const [a, b] of [[l.source, l.target], [l.target, l.source]]) {
        const node = byId.get(a);
        const near = placed.get(b);
        if (node && near && !Number.isFinite(node.x)) {
          node.x = near.x + (Math.random() - 0.5) * 30;
          node.y = near.y + (Math.random() - 0.5) * 30;
          placed.set(a, node);
        }
      }
    }
    const fresh = nodes.filter((n) => !Number.isFinite(n.x)).length;
    s.nodes = nodes;
    s.byId = byId;
    s.links = graph.links.filter((l) => byId.has(l.source) && byId.has(l.target)).map((l) => ({ ...l }));
    s.hover = s.hover ? byId.get(s.hover.id) ?? null : null;
    if (s.gesture?.type === "drag") s.gesture = null;
    if (!prev.size && cached) { s.t = { ...cached.t }; s.fitted = true; }
    if (!prev.size && !cached) s.fitted = false;

    const sim = s.sim;
    if (timelapse && timelapse !== s.played) {
      // 타임랩스: 날짜순으로 조금씩 나타나며 자리를 잡는다 (버튼 한 번에 한 번만)
      s.played = timelapse;
      const order = [...nodes].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
      for (const n of nodes) { delete n.x; delete n.y; n.vx = 0; n.vy = 0; }
      s.reveal = { order, shown: 0 };
      s.fitted = false;
      sim.nodes([]);
      sim.force("link").links([]);
      const step = Math.max(1, Math.ceil(order.length / 60));
      const timer = setInterval(() => {
        const r = s.reveal;
        if (!r) return clearInterval(timer);
        r.shown = Math.min(order.length, r.shown + step);
        const visible = new Set(order.slice(0, r.shown).map((n) => n.id));
        for (const n of order.slice(r.shown - step, r.shown)) {
          const nb = s.links.find((l) => (l.source.id ?? l.source) === n.id && visible.has(l.target.id ?? l.target))
            ?? s.links.find((l) => (l.target.id ?? l.target) === n.id && visible.has(l.source.id ?? l.source));
          const other = nb ? byId.get((nb.source.id ?? nb.source) === n.id ? (nb.target.id ?? nb.target) : (nb.source.id ?? nb.source)) : null;
          n.x = (other?.x ?? 0) + (Math.random() - 0.5) * 20;
          n.y = (other?.y ?? 0) + (Math.random() - 0.5) * 20;
        }
        sim.nodes(order.slice(0, r.shown));
        sim.force("link").links(s.links.filter((l) => visible.has(l.source.id ?? l.source) && visible.has(l.target.id ?? l.target)));
        sim.alpha(0.6).restart();
        if (r.shown >= order.length) { s.reveal = null; clearInterval(timer); s.fitted = false; }
        s.dirty = true;
      }, 70);
      return () => { clearInterval(timer); s.reveal = null; };
    }
    s.reveal = null;
    sim.nodes(nodes);
    sim.force("link").links(s.links);
    sim.alpha(fresh ? Math.max(0.8, sim.alpha()) : Math.max(0.15, sim.alpha())).restart();
    s.dirty = true;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, timelapse]);

  useEffect(() => { s.dirty = true; }, [settings, focusId, s]);

  /* ---------- 크기 · 테마 ---------- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      s.dpr = Math.min(2, window.devicePixelRatio || 1);
      s.w = Math.max(50, rect.width);
      s.h = Math.max(50, rect.height);
      canvas.width = Math.round(s.w * s.dpr);
      canvas.height = Math.round(s.h * s.dpr);
      s.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    s.colors = readColors(wrap);
    const mo = new MutationObserver(() => { s.colors = readColors(wrap); s.dirty = true; });
    mo.observe(document.body, { attributes: true, attributeFilter: ["data-club-theme", "class", "style"] });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [s]);

  /* ---------- 그리기 ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      // 이동·줌 부드럽게
      if (s.goal) {
        const g = s.goal;
        s.t = { x: s.t.x + (g.x - s.t.x) * 0.2, y: s.t.y + (g.y - s.t.y) * 0.2, k: s.t.k + (g.k - s.t.k) * 0.2 };
        if (Math.abs(g.k - s.t.k) < 0.001 && Math.abs(g.x - s.t.x) < 0.3 && Math.abs(g.y - s.t.y) < 0.3) { s.t = g; s.goal = null; }
        s.dirty = true;
      }
      const focus = s.gesture?.type === "drag" ? s.gesture.node : s.hover;
      if (focus !== s.focus) {
        s.focus = focus;
        s.neighbors = new Set();
        if (focus) {
          for (const l of s.links) {
            const a = l.source.id ?? l.source;
            const b = l.target.id ?? l.target;
            if (a === focus.id) s.neighbors.add(b);
            if (b === focus.id) s.neighbors.add(a);
          }
        }
      }
      const fadeGoal = s.focus ? 1 : 0;
      if (Math.abs(s.fade - fadeGoal) > 0.01) { s.fade += (fadeGoal - s.fade) * 0.18; s.dirty = true; }
      else if (s.fade !== fadeGoal) { s.fade = fadeGoal; s.dirty = true; }
      if (!s.dirty || !s.colors) return;
      s.dirty = false;

      const { w, h, dpr, t, colors: c, fade } = s;
      const set = s.settings;
      const visible = s.reveal ? new Set(s.sim.nodes().map((n) => n.id)) : null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2 + t.x, h / 2 + t.y);
      ctx.scale(t.k, t.k);
      const focusNode = s.focus;
      const isLit = (id) => focusNode && (id === focusNode.id || s.neighbors.has(id));

      // 링크
      const lw = (0.8 * set.linkWidth) / Math.max(0.6, Math.sqrt(t.k));
      for (const l of s.links) {
        const a = typeof l.source === "object" ? l.source : s.byId.get(l.source);
        const b = typeof l.target === "object" ? l.target : s.byId.get(l.target);
        if (!a || !b || !Number.isFinite(a.x) || !Number.isFinite(b.x)) continue;
        if (visible && (!visible.has(a.id) || !visible.has(b.id))) continue;
        const lit = focusNode && (a.id === focusNode.id || b.id === focusNode.id);
        ctx.globalAlpha = lit ? 0.9 : 0.32 * (1 - 0.75 * fade);
        ctx.strokeStyle = lit ? c.accent : c.line;
        ctx.lineWidth = lit ? lw * 1.6 : lw;
        ctx.setLineDash(l.kind === "wiki" && b.type === "ghost" ? [3, 3] : []);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (set.arrows && (l.kind === "wiki" || l.kind === "contains" || l.kind === "flow" || l.kind === "branch")) {
          const rb = radiusOf(b, set.nodeSize);
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          const tipX = b.x - Math.cos(ang) * (rb + 1.5);
          const tipY = b.y - Math.sin(ang) * (rb + 1.5);
          const size = 4.5 * set.linkWidth;
          ctx.setLineDash([]);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX - Math.cos(ang - 0.45) * size, tipY - Math.sin(ang - 0.45) * size);
          ctx.lineTo(tipX - Math.cos(ang + 0.45) * size, tipY - Math.sin(ang + 0.45) * size);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.setLineDash([]);

      // 노드
      const colorOf = (n) => {
        if (n.type === "ghost") return c.dim;
        if (n.type === "tag") return c.dim;
        if (set.colorGroups && n.category && GRAPH_COLORS[n.category]) return GRAPH_COLORS[n.category];
        return c.node;
      };
      for (const n of s.nodes) {
        if (!Number.isFinite(n.x) || (visible && !visible.has(n.id))) continue;
        const r = radiusOf(n, set.nodeSize);
        const lit = isLit(n.id);
        ctx.globalAlpha = (n.type === "ghost" ? 0.5 : 1) * (focusNode && !lit ? 1 - 0.8 * fade : 1);
        ctx.fillStyle = focusNode && n.id === focusNode.id ? c.accent : colorOf(n);
        ctx.beginPath();
        if (n.type === "tag") {
          // 태그는 작은 마름모
          ctx.moveTo(n.x, n.y - r); ctx.lineTo(n.x + r, n.y); ctx.lineTo(n.x, n.y + r); ctx.lineTo(n.x - r, n.y); ctx.closePath();
        } else {
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        }
        if (n.type === "ghost") {
          ctx.lineWidth = 1 / t.k + 0.5;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.stroke();
        } else {
          ctx.fill();
        }
        if (n.type === "branch") {
          // 갈래: 가운데가 빈 굵은 고리
          ctx.globalAlpha = focusNode && !lit ? 1 - 0.8 * fade : 1;
          ctx.fillStyle = c.bg;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        if (n.type === "group") {
          ctx.globalAlpha *= 0.5;
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = colorOf(n);
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (s.focusId === n.id) {
          ctx.globalAlpha = 1;
          ctx.lineWidth = 2 / t.k + 0.6;
          ctx.strokeStyle = c.text;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 글자: 줌이 임계값보다 작으면 흐려짐. 마우스 올린 노드와 이웃은 늘 보임
      const T = set.textFade;
      const zoomAlpha = clamp((t.k - T * 0.6) / (T * 0.4), 0, 1);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const fontPx = 11 / Math.max(1, Math.sqrt(t.k) * 0.9);
      ctx.font = `500 ${fontPx}px Pretendard, system-ui, sans-serif`;
      ctx.lineJoin = "round";
      for (const n of s.nodes) {
        if (!Number.isFinite(n.x) || (visible && !visible.has(n.id))) continue;
        const lit = isLit(n.id) || s.focusId === n.id;
        let a = lit ? 1 : zoomAlpha * (focusNode ? 1 - 0.85 * fade : 1);
        if ((n.type === "group" || n.type === "branch") && !focusNode) a = Math.max(a, clamp((t.k - T * 0.3) / (T * 0.3), 0, 1));
        if (a < 0.03) continue;
        // 화면 밖이면 건너뜀
        const sx = n.x * t.k + t.x + w / 2;
        const sy = n.y * t.k + t.y + h / 2;
        if (sx < -120 || sx > w + 120 || sy < -40 || sy > h + 40) continue;
        const r = radiusOf(n, set.nodeSize);
        const text = n.label.length > 28 ? `${n.label.slice(0, 27)}…` : n.label;
        ctx.globalAlpha = a;
        ctx.lineWidth = 3 / t.k;
        ctx.strokeStyle = c.bg;
        ctx.strokeText(text, n.x, n.y + r + 3);
        ctx.fillStyle = n.type === "ghost" ? c.dim : c.text;
        ctx.fillText(text, n.x, n.y + r + 3);
      }
      ctx.globalAlpha = 1;
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [s]);

  /* ---------- 마우스 · 터치 ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const local = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { px: e.clientX - rect.left, py: e.clientY - rect.top };
    };
    const toWorld = (px, py) => ({ x: (px - s.w / 2 - s.t.x) / s.t.k, y: (py - s.h / 2 - s.t.y) / s.t.k });
    const pick = (px, py) => {
      const { x, y } = toWorld(px, py);
      const visible = s.reveal ? new Set(s.sim.nodes().map((n) => n.id)) : null;
      let best = null;
      let bestD = Infinity;
      for (const n of s.nodes) {
        if (!Number.isFinite(n.x) || (visible && !visible.has(n.id))) continue;
        const r = radiusOf(n, s.settings.nodeSize) + 4 / s.t.k;
        const d = (n.x - x) ** 2 + (n.y - y) ** 2;
        if (d < r * r && d < bestD) { best = n; bestD = d; }
      }
      return best;
    };
    const pinchInfo = () => {
      const [a, b] = [...s.pointers.values()];
      return { dist: Math.hypot(a.px - b.px, a.py - b.py), cx: (a.px + b.px) / 2, cy: (a.py + b.py) / 2 };
    };

    const down = (e) => {
      const p = local(e);
      canvas.setPointerCapture(e.pointerId);
      s.pointers.set(e.pointerId, p);
      s.goal = null;
      if (s.pointers.size === 2) {
        if (s.gesture?.type === "drag") { s.gesture.node.fx = null; s.gesture.node.fy = null; s.sim.alphaTarget(0); }
        const info = pinchInfo();
        s.gesture = { type: "pinch", ...info, t: { ...s.t } };
        return;
      }
      const node = pick(p.px, p.py);
      if (node) {
        s.gesture = { type: "drag", node, sx: p.px, sy: p.py, moved: false };
        node.fx = node.x;
        node.fy = node.y;
      } else {
        s.gesture = { type: "pan", sx: p.px, sy: p.py, t: { ...s.t }, moved: false };
      }
      s.dirty = true;
    };
    const move = (e) => {
      const p = local(e);
      if (s.pointers.has(e.pointerId)) s.pointers.set(e.pointerId, p);
      const g = s.gesture;
      if (!g) {
        const node = pick(p.px, p.py);
        if (node !== s.hover) { s.hover = node; s.dirty = true; canvas.style.cursor = node ? "pointer" : "grab"; }
        return;
      }
      if (g.type === "pinch" && s.pointers.size >= 2) {
        const info = pinchInfo();
        const k = clamp(g.t.k * (info.dist / g.dist), MIN_K, MAX_K);
        const wx = (g.cx - s.w / 2 - g.t.x) / g.t.k;
        const wy = (g.cy - s.h / 2 - g.t.y) / g.t.k;
        s.t = { k, x: info.cx - s.w / 2 - wx * k, y: info.cy - s.h / 2 - wy * k };
        s.dirty = true;
        return;
      }
      if (Math.hypot(p.px - g.sx, p.py - g.sy) > 4 && !g.moved) {
        g.moved = true;
        if (g.type === "drag") s.sim.alphaTarget(0.3).restart();
      }
      if (!g.moved) return;
      if (g.type === "drag") {
        const w = toWorld(p.px, p.py);
        g.node.fx = w.x;
        g.node.fy = w.y;
      } else if (g.type === "pan") {
        canvas.style.cursor = "grabbing";
        s.t = { ...s.t, x: g.t.x + (p.px - g.sx), y: g.t.y + (p.py - g.sy) };
      }
      s.dirty = true;
    };
    const up = (e) => {
      s.pointers.delete(e.pointerId);
      const g = s.gesture;
      if (!g) return;
      if (g.type === "pinch") {
        if (s.pointers.size === 0) s.gesture = null;
        else {
          const [rest] = [...s.pointers.values()];
          s.gesture = { type: "pan", sx: rest.px, sy: rest.py, t: { ...s.t }, moved: true };
        }
        return;
      }
      if (g.type === "drag") {
        g.node.fx = null;
        g.node.fy = null;
        s.sim.alphaTarget(0);
        if (!g.moved && e.type === "pointerup") onOpenRef.current?.(g.node);
      }
      s.gesture = null;
      canvas.style.cursor = s.hover ? "pointer" : "grab";
      s.dirty = true;
    };
    const leave = () => { if (!s.gesture && s.hover) { s.hover = null; s.dirty = true; } };
    const wheel = (e) => {
      e.preventDefault();
      const p = local(e);
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const k = clamp(s.t.k * Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0018)), MIN_K, MAX_K);
      const wx = (p.px - s.w / 2 - s.t.x) / s.t.k;
      const wy = (p.py - s.h / 2 - s.t.y) / s.t.k;
      s.goal = null;
      s.t = { k, x: p.px - s.w / 2 - wx * k, y: p.py - s.h / 2 - wy * k };
      s.dirty = true;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.style.cursor = "grab";
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [s]);

  return (
    <div className={`archiveGraph ${className}`} ref={wrapRef}>
      <canvas ref={canvasRef} className="archiveGraph__canvas" role="img"
        aria-label={`${label}: 노드 ${graph.nodes.length}개, 연결 ${graph.links.length}개`} />
      {showControls ? <div className="archiveGraph__zoom" role="group" aria-label="그래프 확대·축소">
        <button type="button" onClick={() => zoomBy(1.4)} aria-label="확대"><IoAddOutline aria-hidden /></button>
        <button type="button" onClick={() => zoomBy(1 / 1.4)} aria-label="축소"><IoRemoveOutline aria-hidden /></button>
        <button type="button" onClick={() => fit(true)} aria-label="전체 보기"><IoScanOutline aria-hidden /></button>
      </div> : null}
      {!graph.nodes.length ? <p className="archiveGraph__empty">보여 줄 노드가 없어요. 필터를 바꿔 보세요.</p> : null}
    </div>
  );
});

export default ArchiveGraph;
