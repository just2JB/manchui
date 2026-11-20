/**
 * 같은 행사에서 같은 날짜의 항목이 여러 개면 하나로 합치고, 각 항목은 그 안의 섹션(콜아웃)으로 둔다.
 *  - 섹션 제목 = 원래 항목 제목, 내용 = 원래 본문 그대로 (이미 섹션이 있으면 그대로 펼쳐 넣는다)
 *  - 합친 항목 제목: 원래 제목들을 " · "로 잇고, 너무 길면 "첫 제목 외 N건"
 *  - 공지만 합치고, 일정 항목(타임라인 이정표)은 그대로 둔다.
 *  - 남는 항목은 첫 항목(타임라인에서 먼저 나오던 것)이고, 나머지는 지운다.
 * 공지 원문 스크립트(archiveNoticesVerbatim*.js)를 다시 돌린 뒤에도 한 번 더 돌리면 된다 (여러 번 돌려도 같음).
 *
 *   node scripts/archiveMergeSameDay.js          → 확인만
 *   node scripts/archiveMergeSameDay.js --yes    → 저장
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const ArchiveEvent = require("../models/ArchiveEvent");
const { parseSections, serializeSections } = require("../utils/archiveSections");

const SECTION_ICON = "📌";
const MAX_TITLE = 60;
const confirmed = process.argv.includes("--yes");
// 공지만 합친다. 일정(타임라인의 이정표) 항목은 따로 둔다. (클라이언트 isNoticeKind 와 같은 기준)
const isNotice = (n) => (Array.isArray(n.tags) && n.tags.length ? n.tags.includes("공지") : !n.kind || n.kind === "공지");

const mergedTitle = (titles) => {
  const unique = [...new Set(titles)];
  const joined = unique.join(" · ");
  return joined.length <= MAX_TITLE ? joined : `${unique[0]} 외 ${unique.length - 1}건`;
};

/** 항목 하나 → 섹션 목록 (머리말은 제목을 붙인 콜아웃으로, 기존 콜아웃은 그대로) */
const sectionsOf = (notice) => {
  const [lead, ...callouts] = parseSections(notice.body || "");
  const out = [];
  if (lead.text || !callouts.length) out.push({ icon: SECTION_ICON, title: notice.title || "", text: lead.text });
  // 머리말 없이 섹션만 있던 항목은 첫 섹션에 원래 제목을 달아 둔다 (제목이 사라지지 않게)
  else if (!callouts[0].title) callouts[0] = { ...callouts[0], title: notice.title || "" };
  return out.concat(callouts);
};

(async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI 가 설정되지 않았습니다 (.env 확인).");
  await mongoose.connect(process.env.MONGO_URI);
  let mergedDays = 0;
  let removed = 0;
  try {
    for (const doc of await ArchiveEvent.find({})) {
      const byDate = new Map();
      for (const n of doc.notices) {
        if (!n.date || !isNotice(n)) continue;
        if (!byDate.has(n.date)) byDate.set(n.date, []);
        byDate.get(n.date).push(n);
      }
      const drop = new Set();
      for (const [date, group] of byDate) {
        if (group.length < 2) continue;
        const [keep, ...rest] = group;
        const titles = group.map((n) => n.title || "");
        const sections = [{ icon: null, title: "", text: "" }, ...group.flatMap(sectionsOf)];
        const authors = [...new Set(group.map((n) => n.authorName).filter(Boolean))];
        const ends = group.map((n) => n.endDate).filter(Boolean).sort();
        keep.title = mergedTitle(titles);
        keep.body = serializeSections(sections);
        keep.authorName = authors.join(", ");
        if (ends.length) keep.endDate = ends.at(-1);
        if (group.some((n) => n.kind === "공지")) keep.kind = "공지";
        rest.forEach((n) => drop.add(String(n._id)));
        mergedDays += 1;
        removed += rest.length;
        console.log(`[${doc.generation ?? "-"}기] ${doc.title} · ${date}  ${group.length}건 → 「${keep.title}」`);
      }
      if (!drop.size) continue;
      doc.notices = doc.notices.filter((n) => !drop.has(String(n._id)));
      if (confirmed) await doc.save();
    }
  } finally {
    await mongoose.disconnect();
  }
  console.log(`\n합친 날 ${mergedDays} · 섹션으로 들어간 항목 ${removed}`);
  if (!confirmed) console.log("확인만 했습니다. 저장하려면 --yes 를 붙이세요.");
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
