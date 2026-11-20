import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, PERFORMANCE_GROUPS, categoryOf, groupOf, catalogGroups, generationGroups } from "./archiveCatalogData.js";

test("다섯 분류와 여섯 공연 폴더는 빈 아카이브에서도 유지된다", () => {
  assert.deepEqual(CATEGORIES, ["공연", "활동", "운영", "기타", "자료"]);
  assert.deepEqual(catalogGroups([], "공연").map((group) => group.name), PERFORMANCE_GROUPS);
});

test("이전 분류와 분류가 불분명한 공연을 잃지 않는다", () => {
  assert.equal(categoryOf({ category: "동아리 활동" }), "활동");
  assert.equal(categoryOf({ category: "동아리 운영" }), "운영");
  const records = [{ _id: "old", title: "초청 무대", category: "공연" }];
  const groups = catalogGroups(records, "공연");
  assert.equal(groups.at(-1).name, "분류 전 공연");
  assert.equal(groups.at(-1).records[0]._id, "old");
});

test("학기별 총회는 기존 행사 묶음이 있어도 각각 하나로 모인다", () => {
  const records = [
    { category: "동아리 활동", title: "1학기 개강총회", generation: 14 },
    { category: "활동", title: "2학기 개강총회", eventGroup: "2학기 개강총회", generation: 14.5 },
    { category: "활동", title: "1학기 종강총회", generation: 14 },
    { category: "활동", title: "2학기 종강총회", eventGroup: "2학기 종강총회", generation: 14.5 },
  ];
  const groups = catalogGroups(records, "활동");
  assert.deepEqual(groups.map((group) => [group.name, group.records.length]), [["개강총회", 2], ["종강총회", 2]]);
});

test("버즈온과 정기공연은 외부공연에서 분리하며 다른 외부공연은 유지한다", () => {
  const records = [
    { category: "공연", title: "1학기 버즈온", eventGroup: "외부공연" },
    { category: "공연", title: "2학기 버즈온", eventGroup: "분류 전 공연" },
    { category: "공연", title: "2026 정기 공연", eventGroup: "외부공연" },
    { category: "공연", title: "몬스터", eventGroup: "외부공연" },
  ];
  const groups = catalogGroups(records, "공연");
  assert.equal(groups.find((group) => group.name === "버즈온").records.length, 2);
  assert.equal(groups.find((group) => group.name === "정기공연").records.length, 1);
  assert.equal(groups.find((group) => group.name === "외부공연").records[0].title, "몬스터");
});

test("명확한 공연 이름과 별칭만 자동 분류하고 수동 분류를 우선한다", () => {
  for (const [title, expected] of [["문과대 꿈터", "꿈꾸는배움터"], ["봄 축제", "축제·한양문화제"], ["한양문화제", "축제·한양문화제"], ["외부 공연 몬스터", "외부공연"], ["가두모집 무대", "가두모집 공연"]]) {
    assert.equal(groupOf({ category: "공연", title }), expected);
  }
  assert.equal(groupOf({ category: "공연", title: "봄 축제", eventGroup: "외부공연" }), "외부공연");
  assert.equal(groupOf({ category: "공연", title: "국제교육원 말하기 대회" }), "분류 전 공연");
});

test("동일 행사에서 소수 기수·기수 미지정·같은 기수 여러 기록을 보존한다", () => {
  const records = [
    { _id: "a", category: "공연", title: "봄 축제", generation: 14, startDate: "2026-05-01" },
    { _id: "b", category: "공연", title: "가을 축제", generation: 14.5, startDate: "2026-09-01" },
    { _id: "c", category: "공연", title: "겨울 축제", generation: 14.5, startDate: "2026-12-01" },
    { _id: "d", category: "공연", title: "축제", generation: null },
  ];
  const grouped = generationGroups(catalogGroups(records, "공연").find((group) => group.name === "축제·한양문화제").records);
  assert.deepEqual(grouped.map((group) => group.key), ["14", "14.5", "none"]);
  assert.deepEqual(grouped[1].records.map((record) => record._id), ["c", "b"]);
  assert.equal(grouped.flatMap((group) => group.records).length, records.length);
});

test("활동·자료는 행사 묶음을 공유하되 분류 사이에서 섞이지 않는다", () => {
  const records = [
    { category: "활동", eventGroup: "MT", title: "봄 MT", generation: 14 },
    { category: "활동", eventGroup: "MT", title: "가을 MT", generation: 14.5 },
    { category: "자료", eventGroup: "MT", title: "체크리스트" },
  ];
  assert.equal(catalogGroups(records, "활동")[0].records.length, 2);
  assert.equal(catalogGroups(records, "자료")[0].records.length, 1);
  assert.equal(groupOf({ category: "활동", title: "2026년 14.5기 개강총회" }), "개강총회");
});
