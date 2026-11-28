import test from "node:test";
import assert from "node:assert/strict";
import { buildArchiveGraph, buildWikiIndex, localGraph, splitWikiLinks } from "./archiveGraphData.js";

const events = [
  { _id: "a", title: "14기 MT", category: "활동", eventGroup: "MT", generation: 14, startDate: "2026-03-20", tags: ["숙박"],
    links: [], notices: [{ _id: "a1", title: "MT 공지", date: "2026-03-01", links: ["15기 MT", "회비 정산"] }] },
  { _id: "b", title: "15기 MT", category: "활동", eventGroup: "MT", generation: 15, startDate: "2027-03-20", tags: ["숙박"],
    links: ["#숙박"], notices: [] },
];

const ids = (graph) => graph.nodes.map((n) => n.id).sort();
const has = (graph, a, b) => graph.links.some((l) => (l.source === a && l.target === b) || (l.source === b && l.target === a));

test("기록·항목·태그·묶음·위키링크·유령 노드를 만든다", () => {
  const g = buildArchiveGraph(events);
  assert.deepEqual(ids(g), ["g:MT", "n:a1", "r:a", "r:b", "t:숙박", "x:회비 정산"]);
  assert.ok(has(g, "r:a", "n:a1"));
  assert.ok(has(g, "n:a1", "r:b"));
  assert.ok(has(g, "r:a", "g:MT") && has(g, "r:b", "g:MT"));
  // 같은 연결(기록→태그, [[#숙박]])은 한 번만
  assert.equal(g.links.filter((l) => has({ links: [l] }, "r:b", "t:숙박")).length, 1);
  assert.equal(g.nodes.find((n) => n.id === "g:MT").degree, 2);
});

test("항목을 숨기면 항목의 위키링크는 기록에서 나간다", () => {
  const g = buildArchiveGraph(events, { showNotices: false, showGhosts: false });
  assert.ok(!ids(g).includes("n:a1"));
  assert.ok(!ids(g).includes("x:회비 정산"));
  assert.ok(has(g, "r:a", "r:b"));
});

test("고아 노드 숨기기와 검색", () => {
  const g = buildArchiveGraph(events, { showTags: false, showGroups: false, showNotices: false, showGhosts: false, showOrphans: false, query: "14기" });
  assert.deepEqual(ids(g), []);
  const all = buildArchiveGraph(events, { query: "mt" });
  assert.deepEqual(ids(all), ["g:MT", "n:a1", "r:a", "r:b"]);
});

test("로컬 그래프는 깊이만큼만 퍼진다", () => {
  const g = buildArchiveGraph(events);
  assert.deepEqual(ids(localGraph(g, "n:a1", 1)), ["n:a1", "r:a", "r:b", "x:회비 정산"]);
  assert.ok(ids(localGraph(g, "n:a1", 2)).includes("t:숙박"));
});

test("항목은 갈래로 갈라지고 갈래 안에서 날짜순으로 이어진다", () => {
  const kkumteo = [{ _id: "k", title: "14기 꿈터", category: "공연", eventGroup: "꿈꾸는배움터", generation: 14, startDate: "2026-02-20",
    tags: [], links: [], notices: [
      { _id: "k3", title: "꿈터 공연진 제한인원 안내", date: "2026-01-20" },
      { _id: "k1", title: "꿈터 준비 일정 계획 (곡장 톡방)", date: "2026-01-03" },
      { _id: "k2", title: "오디션 신청 안내", branch: "공연진", date: "2026-01-11" },
      { _id: "k4", title: "공연 연습비 공지", date: "2026-01-23" },
    ] }];
  const g = buildArchiveGraph(kkumteo);
  assert.ok(has(g, "g:꿈꾸는배움터", "r:k"));
  assert.ok(has(g, "r:k", "b:k:공연진") && has(g, "r:k", "b:k:곡장"));
  assert.ok(has(g, "b:k:공연진", "n:k2") && has(g, "n:k2", "n:k3"));
  assert.ok(!has(g, "b:k:공연진", "n:k3"));
  assert.ok(has(g, "b:k:곡장", "n:k1"));
  assert.ok(has(g, "r:k", "n:k4"));
  // 별 모양으로 바꾸면 갈래에 모두 바로 붙는다
  const star = buildArchiveGraph(kkumteo, { chainBranches: false });
  assert.ok(has(star, "b:k:공연진", "n:k3"));
  // 로컬 그래프는 갈래 줄기를 끝까지 보여 준다
  assert.ok(localGraph(g, "r:k", 1).nodes.some((n) => n.id === "n:k3"));
});

test("위키링크 해석과 본문 나누기", () => {
  const resolve = buildWikiIndex(events);
  assert.deepEqual(resolve("15기  mt"), { type: "record", recordId: "b" });
  assert.deepEqual(resolve("MT 공지"), { type: "notice", recordId: "a", noticeId: "a1" });
  assert.equal(resolve("없는 것"), null);
  assert.deepEqual(splitWikiLinks("앞 [[15기 MT#준비|작년]] 뒤"), [
    { text: "앞 " }, { link: "15기 MT", text: "작년" }, { text: " 뒤" },
  ]);
  assert.deepEqual(splitWikiLinks("[[#숙박]]"), [{ link: "#숙박", text: "#숙박" }]);
  assert.deepEqual(resolve("#숙박"), { type: "tag", name: "숙박" });
});
