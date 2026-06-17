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

export function isKakaoAuthCallbackPath(pathname = "") {
  return pathname === "/club/auth/kakao/callback";
}

const KAKAO_LOGIN_TICKET_KEY = "manchui.kakaoLoginTicket";
let kakaoExchangePromise = null;

function peekKakaoTicketFromQuery() {
  if (typeof window === "undefined") return null;
  if (!isKakaoAuthCallbackPath(window.location.pathname)) return null;
  return new URLSearchParams(window.location.search).get("kakaoTicket");
}

function readKakaoLoginTicket() {
  const fromQuery = peekKakaoTicketFromQuery();
  if (fromQuery) {
    sessionStorage.setItem(KAKAO_LOGIN_TICKET_KEY, fromQuery);
    return fromQuery;
  }
  return sessionStorage.getItem(KAKAO_LOGIN_TICKET_KEY) || null;
}

function clearKakaoLoginTicket() {
  sessionStorage.removeItem(KAKAO_LOGIN_TICKET_KEY);
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("kakaoTicket")) return;
  params.delete("kakaoTicket");
  const nextSearch = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`,
  );
}

function readKakaoCallbackAccessTokenFromHash() {
  if (typeof window === "undefined") return null;
  if (!isKakaoAuthCallbackPath(window.location.pathname)) return null;

  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!rawHash) return null;

  return new URLSearchParams(rawHash).get("accessToken");
}

function clearKakaoCallbackAccessTokenFromHash() {
  if (typeof window === "undefined") return;
  if (!window.location.hash) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

async function exchangeKakaoLoginTicket(kakaoTicket) {
  if (!kakaoExchangePromise) {
    kakaoExchangePromise = apiClient
      .post("/api/auth/kakao/exchange", { kakaoTicket })
      .then((response) => {
        clearKakaoLoginTicket();
        kakaoExchangePromise = null;
        return response.data;
      })
      .catch((error) => {
        kakaoExchangePromise = null;
        sessionStorage.removeItem(KAKAO_LOGIN_TICKET_KEY);
        throw error;
      });
  }
  return kakaoExchangePromise;
}

export async function completeKakaoCallbackAuth() {
  const kakaoTicket = readKakaoLoginTicket();
  if (kakaoTicket) {
    const data = await exchangeKakaoLoginTicket(kakaoTicket);
    const token = data.accessToken || data.token;
    if (token) setAccessToken(token);
    return data;
  }

  const accessTokenFromHash = readKakaoCallbackAccessTokenFromHash();
  if (accessTokenFromHash) {
    setAccessToken(accessTokenFromHash);
    clearKakaoCallbackAccessTokenFromHash();
    const { data } = await apiClient.post("/api/auth/verify-token", {});
    const token = data.accessToken || data.token;
    if (token) setAccessToken(token);
    return data;
  }

  if (getAccessToken()) {
    const { data } = await apiClient.post("/api/auth/verify-token", {});
    const token = data.accessToken || data.token;
    if (token) setAccessToken(token);
    return data;
  }

  const { data } = await apiClient.post("/api/auth/session", {});
  const token = data.accessToken || data.token;
  if (token) setAccessToken(token);
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
