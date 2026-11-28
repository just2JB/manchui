import { CATEGORIES } from "./archiveCatalogData.js";

export const readArchiveLocation = (params) => {
  const category = CATEGORIES.includes(params.get("category")) ? params.get("category") : "all";
  const group = category === "all" ? "" : params.get("group") || "";
  return {
    category, group,
    generation: group ? params.get("generation") || "all" : "all",
    record: group ? params.get("record") || null : null,
    view: params.get("view") === "graph" ? "graph" : "list",
  };
};

/** 위치를 바꾸면 그래프 보기는 닫힌다 (view: "graph" 를 넘길 때만 유지). */
export const archiveSearchParams = (current, { category = "all", group = "", generation = "all", record = null, view = "list" }) => {
  const next = new URLSearchParams(current);
  for (const key of ["category", "group", "generation", "record", "view"]) next.delete(key);
  if (category !== "all") {
    next.set("category", category);
    if (group) {
      next.set("group", group);
      if (generation !== "all") next.set("generation", generation);
      if (record) next.set("record", record);
    }
  }
  if (view === "graph") next.set("view", "graph");
  return next;
};
