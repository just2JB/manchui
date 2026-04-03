/** Link `to` 값과 현재 location이 같은 목적지인지 (다른 페이지 이동 vs 같은 페이지 재클릭) */
export function parseLinkTo(to) {
  if (typeof to === "string") {
    const hashIndex = to.indexOf("#");
    if (hashIndex === -1) {
      return { pathname: to || "/", hash: "" };
    }
    const pathname = to.slice(0, hashIndex) || "/";
    const rawHash = to.slice(hashIndex + 1);
    return {
      pathname,
      hash: rawHash ? `#${rawHash}` : "",
    };
  }
  const pathname = to.pathname ?? "/";
  const raw = to.hash;
  const hash =
    raw == null || raw === ""
      ? ""
      : String(raw).startsWith("#")
        ? String(raw)
        : `#${raw}`;
  return { pathname, hash };
}

export function isSameLinkDestination(to, location) {
  const { pathname, hash } = parseLinkTo(to);
  const locHash = location.hash || "";
  if (pathname !== location.pathname) return false;
  return hash === locHash;
}

/** 라우트 이동 직후 맨 위로: 다른 페이지로 가면 즉시, 같은 링크 재클릭이면 부드럽게 */
export function scrollWindowTopAfterNav(to, location) {
  if (isSameLinkDestination(to, location)) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
