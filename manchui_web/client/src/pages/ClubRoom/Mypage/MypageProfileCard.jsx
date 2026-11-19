import React, { useRef } from "react";
import "./MypageProfileCard.css";

/**
 * 마이페이지 상단 프로필 카드 — 명함처럼.
 * 반짝임: 주기적으로 지나가는 빛 띠 + 손가락/마우스 위치를 따라가는 하이라이트·홀로그램 + 살짝 기울기.
 * 움직임 줄이기 설정이면 기울기·애니메이션 없음 (CSS 에서도 끔).
 * onOpen 이 없으면 눌러서 이동하지 않는 카드(div)로 그린다 (내 정보 수정 화면 상단).
 */
export default function MypageProfileCard({ user, isKakaoLinked, onOpen }) {
  const cardRef = useRef(null);

  const setPointer = (event) => {
    const card = cardRef.current;
    if (!card) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const rect = card.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
    card.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
    card.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
    card.dataset.active = "true";
  };

  const resetPointer = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    delete card.dataset.active;
  };

  const position = user?.position ? `만취 ${user.position}` : "만취";
  const clickable = typeof onOpen === "function";
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      ref={cardRef}
      type={clickable ? "button" : undefined}
      className={`profileCard${clickable ? "" : " profileCard--static"}`}
      onClick={clickable ? onOpen : undefined}
      onPointerMove={setPointer}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse") resetPointer();
      }}
      aria-label={clickable ? `${user?.username ?? "내"} 정보 보기` : undefined}
    >
      <span className="profileCard__holo" aria-hidden="true" />
      <span className="profileCard__glare" aria-hidden="true" />
      <span className="profileCard__sweep" aria-hidden="true" />
      <span className="profileCard__watermark" aria-hidden="true" />

      <span className="profileCard__top">
        {isKakaoLinked ? <span className="profileCard__kakao">kakao 연동</span> : null}
      </span>

      <span className="profileCard__bottom">
        <span className="profileCard__role">{position}</span>
        <span className="profileCard__name">{user?.username ?? "이름 없음"}</span>
        <span className="profileCard__foot">
          <span className="profileCard__id">
            <span className="profileCard__idLabel">ID</span>
            {user?.Identification ?? "—"}
          </span>
          {clickable ? (
            <span className="profileCard__more" aria-hidden="true">
              내 정보 보기 ›
            </span>
          ) : null}
        </span>
      </span>
    </Tag>
  );
}
