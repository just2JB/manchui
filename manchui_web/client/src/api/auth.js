import { apiClient, refreshAccessToken, serverUrl } from "./apiClient";
import {
  decodeJwtPayload,
  getAccessToken,
  setAccessToken,
} from "./tokenStorage";

export async function fetchSessionUser() {
  if (!getAccessToken()) {
    try {
      const { data } = await apiClient.post("/api/auth/session", {});
      const token = data.accessToken || data.token;
      if (token) setAccessToken(token);
      return data?.user ?? null;
    } catch {
      return null;
    }
  }

  try {
    const { data } = await apiClient.post("/api/auth/verify-token", {});
    return data?.user ?? null;
  } catch {
    try {
      await refreshAccessToken();
      const { data } = await apiClient.post("/api/auth/verify-token", {});
      return data?.user ?? null;
    } catch {
      try {
        const { data } = await apiClient.post("/api/auth/session", {});
        const token = data.accessToken || data.token;
        if (token) setAccessToken(token);
        return data?.user ?? null;
      } catch {
        return null;
      }
    }
  }
}

export async function loginClubRoom({ email, password }) {
  const { data } = await apiClient.post("/api/auth/login", { email, password });
  const token = data.accessToken || data.token;
  if (token) setAccessToken(token);
  return data;
}

export async function signupClubRoom(payload) {
  await apiClient.post("/api/auth/signup", payload);
}

export async function sendSignupEmailCode(email) {
  const { data } = await apiClient.post("/api/auth/email/send-code", { email });
  return data;
}

export async function verifySignupEmailCode(email, code) {
  const { data } = await apiClient.post("/api/auth/email/verify-code", {
    email,
    code,
  });
  return data;
}

export async function establishSessionFromCookies() {
  const { data } = await apiClient.post("/api/auth/session", {});
  const token = data.accessToken || data.token;
  if (token) setAccessToken(token);
  return data;
}

export async function completeKakaoSignup({ signupToken, nickname, Identification }) {
  const { data } = await apiClient.post("/api/auth/kakao/complete-signup", {
    signupToken,
    nickname,
    Identification,
  });
  const token = data.accessToken || data.token;
  if (token) setAccessToken(token);
  return data;
}

export function getKakaoLoginUrl(fromPath = "/club") {
  const from = encodeURIComponent(fromPath);
  return `${serverUrl}/api/auth/kakao?from=${from}`;
}

export async function startKakaoLink(fromPath = "/club/mypage/profile") {
  const { data } = await apiClient.post("/api/auth/kakao/link/start", {
    from: fromPath,
  });
  if (data?.authorizeUrl) {
    window.location.assign(data.authorizeUrl);
  }
  return data;
}

export function parseKakaoSignupToken(signupToken) {
  if (!signupToken) return null;
  return decodeJwtPayload(signupToken);
}

const KAKAO_SIGNUP_SESSION_KEY = "manchui.kakaoSignupSession";

export function saveKakaoSignupSession({ signupToken, email, nickname }) {
  if (!signupToken) return;
  sessionStorage.setItem(
    KAKAO_SIGNUP_SESSION_KEY,
    JSON.stringify({
      signupToken,
      email: email || "",
      nickname: nickname || "",
    }),
  );
}

export function loadKakaoSignupSession() {
  try {
    return JSON.parse(sessionStorage.getItem(KAKAO_SIGNUP_SESSION_KEY) || "{}");
  } catch {
    return {};
  }
}

export function clearKakaoSignupSession() {
  sessionStorage.removeItem(KAKAO_SIGNUP_SESSION_KEY);
}

export function resolveKakaoSignupPayload({
  signupTokenFromState,
  signupTokenFromUrl,
  nicknameFromForm,
  identificationFromForm,
}) {
  const stored = loadKakaoSignupSession();
  const signupToken =
    signupTokenFromState ||
    signupTokenFromUrl ||
    stored.signupToken ||
    "";
  const tokenPayload = parseKakaoSignupToken(signupToken);

  let identification = (identificationFromForm || "").trim();
  if (identification && !identification.startsWith("@")) {
    identification = `@${identification.replace(/^@+/, "")}`;
  }

  const nickname =
    (nicknameFromForm || "").trim() ||
    (stored.nickname || "").trim() ||
    (tokenPayload?.nickname || "").trim();

  return {
    signupToken,
    nickname,
    Identification: identification,
    email: stored.email || tokenPayload?.email || "",
  };
}

export { refreshAccessToken };
