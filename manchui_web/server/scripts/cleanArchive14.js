/**
 * 1회용: 이미 넣은 14 · 14.5기 아카이브 정리
 *  - 출처 흔적 빼기: '노션' 태그, 메모의 출처 문장, 작성자 '노션 일정', 본문의 '노션 상태: …' 줄
 *  - 항목 종류 통일: 공지만 남기고 일정 · 할 일 · 회의 → 일정(태그 없음)
 *
 *   node scripts/cleanArchive14.js        → 확인만 (바뀔 개수 출력)
 *   node scripts/cleanArchive14.js --yes  → 실제로 저장
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

const confirmed = process.argv.includes("--yes");
const SOURCE_LINE = /\n*노션 14th MANCHUI · 일정 캘린더에서 옮겨온 참고용 타임라인\s*$/;
const STATUS_LINE = /^노션 상태:.*$/;

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI 가 설정되지 않았습니다 (.env 확인).");
  await mongoose.connect(process.env.MONGO_URI);
  // 스키마 enum 검사 없이 원본 컬렉션으로
  const col = mongoose.connection.db.collection("archiveevents");
  const docs = await col.find({}).toArray();

  let changedEvents = 0;
  let changedItems = 0;
  for (const doc of docs) {
    let dirty = false;
    const tags = (doc.tags ?? []).filter((t) => t !== "노션");
    if (tags.length !== (doc.tags ?? []).length) dirty = true;
    const summary = String(doc.summary ?? "").replace(SOURCE_LINE, "");
    if (summary !== (doc.summary ?? "")) dirty = true;

    const notices = (doc.notices ?? []).map((n) => {
      const next = { ...n };
      if (next.authorName === "노션 일정") next.authorName = "";
      next.body = String(n.body ?? "")
        .split("\n")
        .filter((line) => !STATUS_LINE.test(line))
        .join("\n")
        .trim();
      next.kind = !n.kind || n.kind === "공지" ? "공지" : "일정";
      if (next.authorName !== n.authorName || next.body !== (n.body ?? "") || next.kind !== n.kind) {
        changedItems += 1;
        dirty = true;
      }
      return next;
    });

    if (!dirty) continue;
    changedEvents += 1;
    if (confirmed) {
      await col.updateOne({ _id: doc._id }, { $set: { tags, summary, notices } });
    }
  }

  console.log(`행사 ${docs.length}개 중 ${changedEvents}개 · 항목 ${changedItems}개 ${confirmed ? "정리함" : "정리 대상 (저장하려면 --yes)"}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
