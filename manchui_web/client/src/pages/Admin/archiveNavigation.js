import { CATEGORIES } from "./archiveCatalogData.js";

export const readArchiveLocation = (params) => {
  const category = CATEGORIES.includes(params.get("category")) ? params.get("category") : "all";
  const group = category === "all" ? "" : params.get("group") || "";
  return {
    category, group,
    generation: group ? params.get("generation") || "all" : "all",
    record: group ? params.get("record") || null : null,
  };
};

export const archiveSearchParams = (current, { category = "all", group = "", generation = "all", record = null }) => {
  const next = new URLSearchParams(current);
  for (const key of ["category", "group", "generation", "record"]) next.delete(key);
  if (category !== "all") {
    next.set("category", category);
    if (group) {
      next.set("group", group);
      if (generation !== "all") next.set("generation", generation);
      if (record) next.set("record", record);
    }
  }
  return next;
};
