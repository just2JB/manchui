import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { useShineCard } from "../useShineCard";
import "./TeamListCard.css";

/**
 * 팀 목록 카드 — 팀 이름 + 팀 색만으로.
 * 검정에 팀 색을 조금 섞은 짙은 면, 배경엔 팀 이름을 아주 크게 팀 색 윤곽선으로 깔아 가장자리에서 잘리게.
 * 윤곽선은 SVG 필터로 글자 바깥 모양만 따서 그린다 → 한글처럼 획이 겹치는 글자도 글자마다 선 하나.
 * 배경 글자 폰트: 영문 Bebas Neue, 한글 Black Han Sans. 한글은 같은 크기면 커 보여서 조금 작게.
 * 앞쪽 이름은 흰색.
 */
const TeamListCard = ({ team, isLeader, isActive, onClick }) => {
  const { ref, handlers } = useShineCard();
  const color = team.teamColor || "#E87070";
  const memberCount = Array.isArray(team.members) ? team.members.length : 0;
  const name = String(team.name ?? "").trim() || "팀";
  const hasHangul = /[가-힣]/.test(name);
  const filterId = `teamTileOutline${useId().replace(/:/g, "")}`;

  // 배경 글자를 세로 가운데에: 폰트의 글자 상자(ascent/descent)는 실제 잉크보다 아래 여백이 커서
  // 상자를 가운데 두면 글자가 위로 쏠려 보인다. 폰트가 불러와진 뒤 canvas 로 '실제 잉크'의 위·아래를 재서
  // 잉크 중심이 카드 세로 중앙에 오도록 기준선 위치를 정한다.
  const bigTextRef = useRef(null);
  const [bigBaseline, setBigBaseline] = useState(null);
  useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      const el = bigTextRef.current;
      const svg = el?.ownerSVGElement;
      if (!el || !svg) return;
      const height = svg.getBoundingClientRect().height;
      const style = getComputedStyle(el);
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx || !height) return;
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const m = ctx.measureText(el.textContent ?? "");
      const ascent = m.actualBoundingBoxAscent;
      const descent = m.actualBoundingBoxDescent;
      if (!Number.isFinite(ascent) || !Number.isFinite(descent)) return;
      // 기준선 y: 잉크 중심(기준선 위 (ascent - descent)/2)이 height/2 에 오도록
      setBigBaseline(height / 2 + (ascent - descent) / 2);
    };
    measure();
    document.fonts?.ready?.then(() => {
      if (alive) measure();
    });
    return () => {
      alive = false;
    };
  }, [name]);
  const meta = [`멤버 ${memberCount}명`, isLeader ? "팀장" : null, isActive ? "연습 중" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      ref={ref}
      type="button"
      className="teamTile"
      onClick={onClick}
      style={{ "--team": color }}
      aria-label={`${name} 팀 열기`}
      {...handlers}
    >
      <svg className="teamTile__bigName" aria-hidden="true" focusable="false">
        <defs>
          {/* 글자 모양을 1.2px 키운 것 − 원래 모양 = 바깥 윤곽만 남은 고리 → 팀 색으로 칠함 */}
          <filter id={filterId} x="-5%" y="-10%" width="110%" height="120%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="grown" />
            <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
            <feFlood floodColor="currentColor" result="paint" />
            <feComposite in="paint" in2="ring" operator="in" />
          </filter>
        </defs>
        <text
          ref={bigTextRef}
          x="0"
          y={bigBaseline ?? "50%"}
          dominantBaseline={bigBaseline == null ? "central" : "alphabetic"}
          className={`teamTile__bigText${hasHangul ? " teamTile__bigText--ko" : ""}`}
          filter={`url(#${filterId})`}
        >
          {hasHangul ? name : name.toUpperCase()}
        </text>
      </svg>
      <span className="teamTile__glare" aria-hidden="true" />

      <span className="teamTile__meta">{meta}</span>
      <span className="teamTile__name">{name}</span>
    </button>
  );
};

export default TeamListCard;
