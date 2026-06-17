import { apiClient } from "./apiClient";

export function normalizeJoinConfigPayload(data) {
  if (!data) {
    return {
      formOpen: true,
      currentGeneration: null,
      siteRestricted: false,
      assistantEnabled: true,
      president: { name: "", contact: "", major: "" },
    };
  }
  return {
    formOpen: data.formOpen !== false,
    currentGeneration: data.currentGeneration ?? null,
    siteRestricted: Boolean(data.siteRestricted),
    assistantEnabled: data.assistantEnabled !== false,
    president: data.president
      ? {
          name: data.president.name ?? "",
          contact: data.president.contact ?? "",
          major: data.president.major ?? "",
        }
      : { name: "", contact: "", major: "" },
  };
}

export async function fetchJoinConfig() {
  const { data } = await apiClient.get("/api/join/config");
  return normalizeJoinConfigPayload(data);
}
