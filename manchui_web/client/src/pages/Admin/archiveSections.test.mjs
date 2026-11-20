import test from "node:test";
import assert from "node:assert/strict";
import { parseSections, serializeSections, plainText, DEFAULT_ICON } from "./archiveSections.js";

test("섹션 표시가 없으면 평범한 글 하나", () => {
  assert.deepEqual(parseSections("안녕\n하세요"), [{ icon: null, title: "", text: "안녕\n하세요" }]);
});

test("섹션을 나누고 다시 합쳐도 같은 본문", () => {
  const body = "머리말\n\n@@section 📌 집합 안내\n일시: 5/21\n장소: 귀곡\n\n@@section\n두 번째";
  const sections = parseSections(body);
  assert.deepEqual(sections, [
    { icon: null, title: "", text: "머리말" },
    { icon: "📌", title: "집합 안내", text: "일시: 5/21\n장소: 귀곡" },
    { icon: DEFAULT_ICON, title: "", text: "두 번째" },
  ]);
  assert.deepEqual(parseSections(serializeSections(sections)), sections);
});

test("머리말이 비어도 콜아웃만 저장", () => {
  const body = serializeSections([{ icon: null, title: "", text: "" }, { icon: "📢", title: "", text: "공지" }]);
  assert.equal(body, "@@section 📢\n공지");
  assert.equal(plainText(body), "공지");
});
