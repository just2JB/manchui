import { apiClient } from "./apiClient";

export async function fetchSessionUser() {
  try {
    const { data } = await apiClient.post(
      "/api/auth/verify-token",
      {},
      { withCredentials: true },
    );
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function loginClubRoom({ email, password }) {
  const { data } = await apiClient.post(
    "/api/auth/login",
    { email, password },
    { withCredentials: true },
  );
  return data;
}

export async function signupClubRoom(payload) {
  await apiClient.post("/api/auth/signup", payload);
}
