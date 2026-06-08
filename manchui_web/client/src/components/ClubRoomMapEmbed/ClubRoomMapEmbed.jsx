import React, { useLayoutEffect, useMemo, useRef } from "react";
import { IoLinkOutline } from "react-icons/io5";
import {
  CLUB_ROOM_ADDRESS,
  CLUB_ROOM_KAKAO_ROUGHMAP,
  getKakaoMapLinkUrl,
  getNaverMapLinkUrl,
} from "../../constants/clubRoomLocation";
import kakaoMapBasic from "../../assets/kakao/kakaomap_basic.png";
import "./ClubRoomMapEmbed.css";

const NaverMapIcon = () => (
  <svg
    className="clubRoomMapEmbed__linkIcon"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    aria-hidden="true"
  >
    <rect width="20" height="20" rx="4" fill="#03C75A" />
    <path
      fill="#fff"
      d="M11.2 5.5H9.4v9h1.6c1.8 0 3-1.2 3-3.1 0-1.6-1-2.9-2.8-2.9Zm.1 6.3H11V8.4h.4c1.1 0 1.7.7 1.7 1.7s-.6 2.2-1.8 2.2ZM5.5 5.5h1.9l1.8 4.4L11 5.5h1.9l-2.7 9h-1.8L5.5 5.5Z"
    />
  </svg>
);

function waitForRoughmapLander(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (window.daum?.roughmap?.Lander) {
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error("Kakao RoughMap loader timeout"));
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}

function renderRoughmap(containerEl, frameEl, { timestamp, key, height }) {
  if (!containerEl || !window.daum?.roughmap?.Lander) return;

  const mapWidth = Math.max(280, Math.floor(frameEl?.offsetWidth || 640));
  containerEl.innerHTML = "";
  new window.daum.roughmap.Lander({
    timestamp: String(timestamp),
    key: String(key),
    mapWidth: String(mapWidth),
    mapHeight: String(height),
  }).render();
}

async function copyAddress(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("copy failed");
}

const ClubRoomMapEmbed = ({ height = 360, className = "" }) => {
  const { timestamp, key } = CLUB_ROOM_KAKAO_ROUGHMAP;
  const containerId = useMemo(
    () => `daumRoughmapContainer${timestamp}`,
    [timestamp],
  );
  const frameRef = useRef(null);
  const containerRef = useRef(null);
  const rootClass = ["clubRoomMapEmbed", className].filter(Boolean).join(" ");

  const handleCopyAddress = async () => {
    try {
      await copyAddress(CLUB_ROOM_ADDRESS);
    } catch {
      window.prompt("아래 주소를 복사해 주세요:", CLUB_ROOM_ADDRESS);
    }
  };

  useLayoutEffect(() => {
    let cancelled = false;
    let resizeObserver;
    let retryTimer;

    const mountMap = (attempt = 0) => {
      if (cancelled) return;
      const frameWidth = frameRef.current?.offsetWidth ?? 0;
      if (frameWidth === 0 && attempt < 12) {
        retryTimer = setTimeout(() => mountMap(attempt + 1), 80);
        return;
      }
      renderRoughmap(containerRef.current, frameRef.current, {
        timestamp,
        key,
        height,
      });
    };

    waitForRoughmapLander()
      .then(() => {
        if (cancelled) return;
        requestAnimationFrame(() => mountMap());
      })
      .catch(() => {});

    if (typeof ResizeObserver !== "undefined" && frameRef.current) {
      resizeObserver = new ResizeObserver(() => mountMap());
      resizeObserver.observe(frameRef.current);
    }

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      resizeObserver?.disconnect();
    };
  }, [timestamp, key, height]);

  return (
    <div className={rootClass}>
      <div className="clubRoomMapEmbed__addressRow">
        <p className="clubRoomMapEmbed__addressText">{CLUB_ROOM_ADDRESS}</p>
        <button
          type="button"
          className="clubRoomMapEmbed__addressCopyBtn"
          onClick={() => void handleCopyAddress()}
          aria-label="주소 복사"
        >
          <IoLinkOutline className="clubRoomMapEmbed__addressCopyIcon" aria-hidden />
        </button>
      </div>
      <div
        ref={frameRef}
        className="clubRoomMapEmbed__frameWrap"
        style={{ height, minHeight: height }}
      >
        <div
          ref={containerRef}
          id={containerId}
          className="root_daum_roughmap root_daum_roughmap_landing clubRoomMapEmbed__kakao"
        />
      </div>
      <div className="clubRoomMapEmbed__links">
        <a
          className="clubRoomMapEmbed__link"
          href={getKakaoMapLinkUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={kakaoMapBasic}
            alt=""
            className="clubRoomMapEmbed__linkIcon"
            width={18}
            height={18}
          />
          카카오맵에서 보기
        </a>
        <a
          className="clubRoomMapEmbed__link"
          href={getNaverMapLinkUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <NaverMapIcon />
          네이버지도에서 보기
        </a>
      </div>
    </div>
  );
};

export default ClubRoomMapEmbed;
