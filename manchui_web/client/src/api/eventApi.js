import apiClient from "./apiClient";

const VISITOR_KEY = "manchui-event-visitor-v1";
export const EVENT_VOTE_KEY = "manchui-event-vote-v1";

export function getEventVisitorId() {
  let visitorId = window.localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY, visitorId);
  }
  return visitorId;
}

const visitorConfig = () => ({ headers: { "x-event-visitor-id": getEventVisitorId() } });

export async function getEventStatus() {
  const { data } = await apiClient.get("/api/event/status", visitorConfig());
  return data;
}

export async function submitEventVote(genreId, voterIdentifier) {
  const { data } = await apiClient.post("/api/event/votes", { genreId, voterIdentifier }, visitorConfig());
  return data;
}

export async function getEventComments() {
  const { data } = await apiClient.get("/api/event/comments", visitorConfig());
  return data.comments ?? [];
}

export async function submitEventComment(genreId, content) {
  const { data } = await apiClient.post("/api/event/comments", { genreId, content }, visitorConfig());
  return data.comment;
}
