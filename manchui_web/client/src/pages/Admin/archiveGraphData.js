import { categoryOf, groupOf } from "./archiveCatalogData.js";
import { branchOf } from "./archiveBranches.js";

/**
 * 아카이브 그래프 (옵시디언 그래프 뷰처럼).
 * 노드: 행사 묶음 · 기록 · 갈래(공연진 · 곡장 …) · 항목 · #태그 · 없는 [[위키링크]] 대상(유령)
 * 링크: 묶음→기록→갈래→항목(갈래 안에서는 날짜순으로 이어짐), 기록→태그, 본문 [[위키링크]]
 */

export const GRAPH_COLORS = {
  공연: "#ff6b6b",
  활동: "#f5b94a",
  운영: "#5aa9ff",
  기타: "#b48cff",
  자료: "#4cc9a0",
};

export const DEFAULT_GRAPH_SETTINGS = {
  query: "",
  showNotices: true,
  showBranches: true,
  chainBranches: true,
  showTags: true,
  showGroups: true,
  showGhosts: true,
  showOrphans: true,
  colorGroups: true,
  arrows: false,
  textFade: 1.1,
  nodeSize: 1,
  linkWidth: 1,
  centerForce: 0.06,
  repelForce: 140,
  linkForce: 0.6,
  linkDistance: 60,
  depth: 1,
};

const norm = (s) => String(s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const recordStart = (e) => e.startDate || e.eventDate || "";

/** [[대상]] 이름 → 기록 · 항목 · 묶음 · 태그 순으로 찾는다. */
export const buildWikiIndex = (events) => {
  const records = new Map();
  const notices = new Map();
  const groups = new Map();
  const tags = new Map();
  for (const e of events) {
    const id = String(e._id);
    if (!records.has(norm(e.title))) records.set(norm(e.title), { type: "record", recordId: id });
    const group = groupOf(e);
    if (!groups.has(norm(group))) groups.set(norm(group), { type: "group", name: group });
    for (const t of e.tags ?? []) if (!tags.has(norm(t))) tags.set(norm(t), { type: "tag", name: t });
    for (const n of e.notices ?? []) {
      if (!notices.has(norm(n.title))) notices.set(norm(n.title), { type: "notice", recordId: id, noticeId: String(n._id) });
    }
  }
  return (target) => {
    const raw = String(target ?? "").trim();
    const key = norm(raw.replace(/^#/, ""));
    if (!key) return null;
    if (raw.startsWith("#")) return tags.get(key) ?? null;
    return records.get(key) ?? notices.get(key) ?? groups.get(key) ?? tags.get(key) ?? null;
  };
};

const nodeIdOf = (hit) => {
  if (!hit) return null;
  if (hit.type === "record") return `r:${hit.recordId}`;
  if (hit.type === "notice") return `n:${hit.noticeId}`;
  if (hit.type === "group") return `g:${hit.name}`;
  return `t:${norm(hit.name)}`;
};

/**
 * 전체 그래프. settings 의 필터를 적용한 { nodes, links } 를 돌려준다.
 * 노드 date 는 타임랩스 애니메이션 순서에 쓴다.
 */
export const buildArchiveGraph = (events, settings = DEFAULT_GRAPH_SETTINGS) => {
  const s = { ...DEFAULT_GRAPH_SETTINGS, ...settings };
  const resolve = buildWikiIndex(events);
  const nodes = new Map();
  const links = new Map();
  const add = (node) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
    return nodes.get(node.id);
  };
  const link = (source, target, kind) => {
    if (!source || !target || source === target) return;
    const key = `${source}>${target}`;
    if (links.has(key) || links.has(`${target}>${source}`)) return;
    links.set(key, { source, target, kind });
  };

  for (const e of events) {
    const id = `r:${e._id}`;
    const category = categoryOf(e);
    add({ id, type: "record", label: e.title || "이름 없는 기록", category, recordId: String(e._id),
      generation: e.generation ?? null, date: recordStart(e) });
  }
  for (const e of events) {
    const rid = `r:${e._id}`;
    const category = categoryOf(e);
    const date = recordStart(e);
    if (s.showGroups) {
      const group = groupOf(e);
      add({ id: `g:${group}`, type: "group", label: group, category, groupName: group, date });
      link(rid, `g:${group}`, "group");
    }
    if (s.showTags) {
      for (const t of e.tags ?? []) {
        const tid = `t:${norm(t)}`;
        add({ id: tid, type: "tag", label: `#${t}`, tagName: t, date });
        link(rid, tid, "tag");
      }
    }
    const wiki = (from, targets) => {
      for (const target of targets ?? []) {
        const hit = resolve(target);
        let to = nodeIdOf(hit);
        if (hit?.type === "notice" && !s.showNotices) to = `r:${hit.recordId}`;
        if (hit?.type === "group" && !s.showGroups) continue;
        if (hit?.type === "tag" && !s.showTags) continue;
        if (!hit) {
          if (!s.showGhosts) continue;
          to = `x:${norm(target)}`;
          add({ id: to, type: "ghost", label: String(target).trim(), date });
        }
        link(from, to, "wiki");
      }
    };
    wiki(rid, e.links);
    if (!s.showNotices) {
      for (const n of e.notices ?? []) wiki(rid, n.links);
      continue;
    }
    // 갈래별로 모아 날짜순: 기록 → 갈래 → 첫 항목 → 다음 항목 …
    const branches = new Map();
    for (const [i, n] of (e.notices ?? []).entries()) {
      const branch = s.showBranches ? branchOf(n) : "";
      if (!branches.has(branch)) branches.set(branch, []);
      branches.get(branch).push({ n, i, date: n.date || "" });
    }
    for (const [branch, items] of branches) {
      items.sort((a, b) => (!a.date !== !b.date ? (a.date ? -1 : 1) : a.date.localeCompare(b.date) || a.i - b.i));
      let hub = rid;
      if (branch) {
        hub = `b:${e._id}:${branch}`;
        add({ id: hub, type: "branch", label: branch, category, recordId: String(e._id), branchName: branch,
          date: items[0].date || date });
        link(rid, hub, "branch");
      }
      let prev = hub;
      for (const { n } of items) {
        const nid = `n:${n._id}`;
        add({ id: nid, type: "notice", label: n.title || "제목 없는 항목", category, recordId: String(e._id),
          noticeId: String(n._id), branchName: branch, date: n.date || date });
        if (branch && s.chainBranches) { link(prev, nid, "flow"); prev = nid; } else link(hub, nid, "contains");
        wiki(nid, n.links);
      }
    }
  }

  let nodeList = [...nodes.values()];
  let linkList = [...links.values()];
  const q = norm(s.query);
  if (q) {
    const keep = new Set(nodeList.filter((n) => norm(n.label).includes(q)).map((n) => n.id));
    nodeList = nodeList.filter((n) => keep.has(n.id));
    linkList = linkList.filter((l) => keep.has(l.source) && keep.has(l.target));
  }
  const degree = new Map();
  for (const l of linkList) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }
  if (!s.showOrphans) nodeList = nodeList.filter((n) => degree.get(n.id));
  // 태그·묶음의 날짜는 이어진 기록 중 가장 이른 날짜
  for (const l of linkList) {
    const a = nodes.get(l.source);
    const b = nodes.get(l.target);
    for (const [hub, other] of [[a, b], [b, a]]) {
      if ((hub.type === "tag" || hub.type === "group" || hub.type === "ghost") && other.date && (!hub.date || other.date < hub.date)) {
        hub.date = other.date;
      }
    }
  }
  return {
    nodes: nodeList.map((n) => ({ ...n, degree: degree.get(n.id) ?? 0 })),
    links: linkList,
  };
};

/** 로컬 그래프: center 에서 depth 단계 안에 이어진 노드만. */
export const localGraph = (graph, centerId, depth = 1) => {
  if (!graph.nodes.some((n) => n.id === centerId)) return { nodes: [], links: [] };
  const adj = new Map();
  for (const l of graph.links) {
    if (!adj.has(l.source)) adj.set(l.source, []);
    if (!adj.has(l.target)) adj.set(l.target, []);
    adj.get(l.source).push(l.target);
    adj.get(l.target).push(l.source);
  }
  const flow = new Map();
  for (const l of graph.links) {
    if (l.kind !== "flow") continue;
    if (!flow.has(l.source)) flow.set(l.source, []);
    flow.get(l.source).push(l.target);
  }
  const seen = new Set([centerId]);
  // 갈래 줄기(날짜순 항목)는 깊이를 쓰지 않고 끝까지 따라간다
  const followFlow = (ids) => {
    const out = [...ids];
    for (let k = 0; k < out.length; k += 1) for (const to of flow.get(out[k]) ?? []) if (!seen.has(to)) { seen.add(to); out.push(to); }
    return out;
  };
  let frontier = followFlow([centerId]);
  for (let d = 0; d < depth && frontier.length; d += 1) {
    const next = [];
    for (const id of frontier) for (const to of adj.get(id) ?? []) if (!seen.has(to)) { seen.add(to); next.push(to); }
    frontier = followFlow(next);
  }
  const links = graph.links.filter((l) => seen.has(l.source) && seen.has(l.target));
  const degree = new Map();
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }
  return { nodes: graph.nodes.filter((n) => seen.has(n.id)).map((n) => ({ ...n, degree: degree.get(n.id) ?? 0 })), links };
};

/** 본문 글을 일반 글과 [[위키링크]] 조각으로 나눈다. */
export const splitWikiLinks = (text) => {
  const parts = [];
  const s = String(text ?? "");
  let last = 0;
  for (const m of s.matchAll(/\[\[([^[\]\n]+?)\]\]/g)) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index) });
    const [targetPart, alias] = m[1].split("|");
    const raw = targetPart.trim();
    const target = raw.startsWith("#") ? raw : raw.split("#")[0].trim();
    parts.push({ link: target, text: (alias ?? targetPart).trim() || target });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push({ text: s.slice(last) });
  return parts;
};
