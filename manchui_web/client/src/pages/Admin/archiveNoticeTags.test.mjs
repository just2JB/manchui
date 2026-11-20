import test from "node:test";
import assert from "node:assert/strict";
import { noticeTagsOf } from "./archiveNoticeTags.js";

const event = { category: "공연", startDate: "2026-08-10", endDate: "2026-08-11" };

test("이전 항목은 행사일 표시를 유지하되 공지 태그는 표시하지 않는다", () => {
  assert.deepEqual(noticeTagsOf({ date: "2026-08-10", kind: "공지" }, event), ["행사", "공연"]);
  assert.deepEqual(noticeTagsOf({ date: "2026-08-09", kind: "일정" }, event), []);
});
test("모두 해제하면 행사 날짜라도 자동으로 다시 붙지 않는다", () => {
  assert.deepEqual(noticeTagsOf({ date: "2026-08-10", kind: "공지", tags: [] }, event), []);
});
test("공연 날짜와 관계없이 직접 지정한 태그를 사용한다", () => {
  assert.deepEqual(noticeTagsOf({ date: "2026-08-09", tags: ["공연", "공지"] }, event), ["공연"]);
  assert.deepEqual(noticeTagsOf({ date: "2026-08-10", tags: ["행사"] }, event), ["행사"]);
});
