/**
 * 1회용: 아카이브 항목 본문의 "기간: 8/3 ~ 8/10" 줄을 endDate 필드로 옮기기 (타임라인에서 막대로 보이게)
 *
 *   node scripts/archivePeriodToEndDate.js        → 확인만
 *   node scripts/archivePeriodToEndDate.js --yes  → 저장
 */
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");

const confirmed = process.argv.includes("--yes");
const PERIOD_LINE = /^기간:\s*(\d{1,2})\/(\d{1,2})\s*~\s*(\d{1,2})\/(\d{1,2})\s*$/;
const pad = (n) => String(n).padStart(2, "0");

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI 가 설정되지 않았습니다 (.env 확인).");
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.db.collection("archiveevents");
  const docs = await col.find({}).toArray();

  let moved = 0;
  for (const doc of docs) {
    let dirty = false;
    const notices = (doc.notices ?? []).map((n) => {
      if (!n.date) return n;
      const lines = String(n.body ?? "").split("\n");
      const i = lines.findIndex((l) => PERIOD_LINE.test(l.trim()));
      if (i === -1) return n;
      const [, , , em, ed] = lines[i].trim().match(PERIOD_LINE).map(Number);
      const [y, sm] = n.date.split("-").map(Number);
      const endYear = em < sm ? y + 1 : y; // 12/30 ~ 1/2 처럼 해가 넘어가면
      const endDate = `${endYear}-${pad(em)}-${pad(ed)}`;
      lines.splice(i, 1);
      moved += 1;
      dirty = true;
      return { ...n, endDate: endDate > n.date ? endDate : "", body: lines.join("\n").trim() };
    });
    if (dirty && confirmed) await col.updateOne({ _id: doc._id }, { $set: { notices } });
  }
  console.log(`기간 줄 ${moved}개 ${confirmed ? "→ endDate 로 옮김" : "옮길 대상 (저장하려면 --yes)"}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
