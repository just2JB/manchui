import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryRouter } from "react-router-dom";
import { archiveSearchParams, readArchiveLocation } from "./archiveNavigation.js";

test("분류 → 행사 → 기수 이동 후 뒤로·앞으로가기가 이전 선택을 복원한다", async () => {
  const router = createMemoryRouter([{ path: "/admin/archive", element: null }], { initialEntries: ["/admin/archive"] });
  const read = () => readArchiveLocation(new URLSearchParams(router.state.location.search));
  const go = async (location, replace = false) => {
    const next = archiveSearchParams(new URLSearchParams(router.state.location.search), location);
    await router.navigate(`/admin/archive?${next}`, { replace });
  };
  try {
    await go({ category: "공연" });
    await go({ category: "공연", group: "꿈꾸는배움터", generation: "14.5", record: "newer" });
    await go({ category: "공연", group: "꿈꾸는배움터", generation: "14", record: "older" });
    await router.navigate(-1);
    assert.equal(read().record, "newer");
    assert.equal(read().generation, "14.5");
    await router.navigate(-1);
    assert.equal(read().category, "공연");
    assert.equal(read().group, "");
    await router.navigate(-1);
    assert.equal(read().category, "all");
    await router.navigate(1);
    await router.navigate(1);
    assert.equal(read().record, "newer");
    await go({ category: "공연", group: "축제", generation: "14.5", record: "newer" }, true);
    await router.navigate(-1);
    assert.equal(read().group, "");
  } finally {
    router.dispose();
  }
});

test("URL을 다시 읽어도 선택을 복원하며 상위 이동은 하위 선택만 지운다", () => {
  const params = archiveSearchParams(new URLSearchParams("other=keep"), {
    category: "자료", group: "공연 양식 / 인수인계", generation: "none", record: "record-id",
  });
  assert.deepEqual(readArchiveLocation(new URLSearchParams(params.toString())), {
    category: "자료", group: "공연 양식 / 인수인계", generation: "none", record: "record-id",
  });
  const parent = archiveSearchParams(params, { category: "자료" });
  assert.equal(parent.get("record"), null);
  assert.equal(parent.get("generation"), null);
  assert.equal(parent.get("other"), "keep");
  assert.equal(readArchiveLocation(new URLSearchParams("category=invalid&record=x")).record, null);
});
