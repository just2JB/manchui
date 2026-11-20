/**
 * 1회용: 삭제된 '가두모집 장르 투표' 이벤트의 DB 데이터 정리.
 * 지우는 컬렉션: eventvotes(투표), eventcomments(댓글), eventdraws(당첨자 추첨 기록)
 *
 * 사용법 (server 폴더에서, .env 의 MONGO_URI 사용)
 *   node scripts/dropEventData.js          → 확인만: 컬렉션별 문서 수 출력, 아무것도 지우지 않음
 *   node scripts/dropEventData.js --yes    → 실제 삭제 (컬렉션 drop)
 *
 * 되돌릴 수 없으니 필요하면 먼저 백업하세요 (예: mongodump --collection eventvotes ...).
 */
require("dotenv").config();
const mongoose = require("mongoose");

const COLLECTIONS = ["eventvotes", "eventcomments", "eventdraws"];
const confirmed = process.argv.includes("--yes");

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI 가 설정되지 않았습니다 (.env 확인).");
  }
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));

  for (const name of COLLECTIONS) {
    if (!existing.has(name)) {
      console.log(`- ${name}: 없음 (건너뜀)`);
      continue;
    }
    const count = await db.collection(name).countDocuments();
    if (!confirmed) {
      console.log(`- ${name}: 문서 ${count}개 (삭제하려면 --yes)`);
      continue;
    }
    await db.collection(name).drop();
    console.log(`- ${name}: 문서 ${count}개 삭제됨`);
  }

  if (!confirmed) console.log("\n확인만 했습니다. 실제로 지우려면: node scripts/dropEventData.js --yes");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
