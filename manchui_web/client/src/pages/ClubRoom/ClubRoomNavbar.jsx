import React, { useLayoutEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";
import { IoPersonOutline, IoArrowBackOutline } from "react-icons/io5";
import { ClubNavIcon } from "./ClubNavIcons";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { useAuth } from "../../context/AuthContext";
import {
  CLUB_UNDER_DEVELOPMENT_MESSAGE,
  isClubPathBlockedForReservationDeploy,
} from "../../config/clubFeatureFlags";

/** 하단 탭(모바일)과 사이드바(PC)가 같은 목록을 사용 */
const NAV_ITEMS = [
  {
    path: "/club",
    label: "홈",
    icon: "home",
    isActive: (pathname) => (pathname.replace(/\/+$/, "") || "/") === "/club",
  },
  {
    path: "/club/team",
    label: "팀",
    icon: "team",
    isActive: (pathname) => pathname.startsWith("/club/team"),
  },
  {
    path: "/club/reservation",
    label: "예약",
    sideLabel: "동아리방 예약",
    icon: "reservation",
    isActive: (pathname) => pathname.startsWith("/club/reservation"),
  },
  {
    path: "/club/recommend",
    label: "추천",
    sideLabel: "노래 추천",
    icon: "recommend",
    isActive: (pathname) => pathname.startsWith("/club/recommend"),
  },
  {
    path: "/club/mypage",
    label: "내 정보",
    sideLabel: "마이페이지",
    icon: "mypage",
    isActive: (pathname) => pathname.startsWith("/club/mypage"),
  },
];

/**
 * 하단 탭의 선택 알약이 스윽 미끄러지게 한다.
 * 알약 하나를 선택된 버튼 위치로 transition 시키고(FLIP), 라벨이 생기며 밀려나는 다른 버튼들도
 * 이전 위치에서 새 위치로 부드럽게 옮긴다. 움직임 줄이기 설정이면 바로 자리만 맞춘다.
 */
function useSlidingPill(navRef, pillRef, activeIndex, hidden) {
  const lastLeftRef = useRef(null);

  useLayoutEffect(() => {
    const navEl = navRef.current;
    const pill = pillRef.current;
    if (!navEl || !pill) return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const buttons = [...navEl.querySelectorAll(".ClubRoomBottomNav__item")];

    // 1) 다른 버튼들: 이전 위치 → 새 위치 (FLIP)
    const nextLeft = buttons.map((b) => b.offsetLeft);
    const prevLeft = lastLeftRef.current;
    if (prevLeft && !reduce) {
      buttons.forEach((b, i) => {
        const dx = (prevLeft[i] ?? nextLeft[i]) - nextLeft[i];
        if (!dx) return;
        b.style.transition = "none";
        b.style.transform = `translateX(${dx}px)`;
      });
      void navEl.offsetWidth; // 시작 위치를 확정
      buttons.forEach((b) => {
        b.style.transition = "";
        b.style.transform = "";
      });
    }
    lastLeftRef.current = nextLeft;

    // 2) 알약: 선택된 버튼 자리로 (첫 표시와 크기 변경 때는 애니메이션 없이)
    const place = (animate) => {
      const active = buttons[activeIndex];
      if (!active) {
        pill.style.opacity = "0";
        return;
      }
      if (!animate) pill.style.transition = "none";
      pill.style.opacity = "1";
      pill.style.width = `${active.offsetWidth}px`;
      pill.style.transform = `translateX(${active.offsetLeft}px)`;
      if (!animate) {
        void pill.offsetWidth;
        pill.style.transition = "";
      }
    };
    place(Boolean(prevLeft) && !reduce);

    // ResizeObserver 는 observe 직후 한 번 바로 호출되므로 그 첫 호출은 건너뛴다
    // (건너뛰지 않으면 방금 시작한 미끄러짐을 끊고 제자리로 순간이동시킴)
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      lastLeftRef.current = buttons.map((b) => b.offsetLeft);
      place(false);
    });
    ro.observe(navEl);
    return () => ro.disconnect();
  }, [navRef, pillRef, activeIndex, hidden]);
}

const ClubRoomNavbar = () => {
  const location = useLocation();
  const nav = useNavigate();
  const modal = useManchuiModal();
  const { user } = useAuth();
  const bottomNavRef = useRef(null);
  const pillRef = useRef(null);
  const activeIndex = NAV_ITEMS.findIndex((item) => item.isActive(location.pathname));
  const hidden = location.pathname.includes("/club/team/join");
  useSlidingPill(bottomNavRef, pillRef, activeIndex, hidden);

  if (hidden) {
    return <div className="ClubRoomNavbar ClubRoomNavbar--joinOnly" />;
  }

  const isTabLimited = (targetPath) =>
    isClubPathBlockedForReservationDeploy(targetPath);

  const goTab = async (targetPath) => {
    if (isTabLimited(targetPath)) {
      await modal(CLUB_UNDER_DEVELOPMENT_MESSAGE, "alert");
      return;
    }
    nav(targetPath);
  };

  const items = NAV_ITEMS.map((item) => ({
    ...item,
    active: item.isActive(location.pathname),
    limited: isTabLimited(item.path),
  }));

  const itemClass = (base, { active, limited }) =>
    [base, active && `${base}--active`, limited && `${base}--limited`]
      .filter(Boolean)
      .join(" ");

  return (
    <>
      <nav ref={bottomNavRef} className="ClubRoomBottomNav" aria-label="클럽룸 하단 메뉴">
        <span ref={pillRef} className="ClubRoomBottomNav__pill" aria-hidden="true" />
        {items.map((item) => {
          return (
            <button
              key={item.path}
              type="button"
              className={itemClass("ClubRoomBottomNav__item", item)}
              onClick={() => void goTab(item.path)}
              aria-label={item.label}
              aria-current={item.active ? "page" : undefined}
              aria-disabled={item.limited || undefined}
            >
              <span className="ClubRoomBottomNav__iconWrap" aria-hidden="true">
                <ClubNavIcon name={item.icon} active={item.active} className="ClubRoomBottomNav__icon" />
              </span>
              <span className="ClubRoomBottomNav__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <nav className="ClubRoomSideNav" aria-label="어시스턴트 메뉴">
        <Link to="/" className="ClubRoomSideNav__brand">
          <span className="ClubRoomSideNav__logo">MANCHUI</span>
          <span className="ClubRoomSideNav__brandSub">어시스턴트</span>
        </Link>

        <ul className="ClubRoomSideNav__list">
          {items.map((item) => {
            return (
              <li key={item.path}>
                <button
                  type="button"
                  className={itemClass("ClubRoomSideNav__item", item)}
                  onClick={() => void goTab(item.path)}
                  aria-current={item.active ? "page" : undefined}
                  aria-disabled={item.limited || undefined}
                >
                  <ClubNavIcon name={item.icon} active={item.active} className="ClubRoomSideNav__icon" />
                  <span>{item.sideLabel ?? item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="ClubRoomSideNav__footer">
          {user ? (
            <button
              type="button"
              className="ClubRoomSideNav__user"
              onClick={() => nav("/club/mypage")}
            >
              <span className="ClubRoomSideNav__avatar" aria-hidden>
                <IoPersonOutline />
              </span>
              <span className="ClubRoomSideNav__userText">
                <span className="ClubRoomSideNav__userName">
                  {user.username ?? "이름 없음"}
                </span>
                <span className="ClubRoomSideNav__userSub">{user.position === "임원진" ? "임원진 · 내 정보" : "내 정보"}</span>
              </span>
            </button>
          ) : null}
          {user?.position === "임원진" && (
            <Link to="/admin" className="ClubRoomSideNav__exit ClubRoomSideNav__admin">
              관리자 페이지 이동 <span aria-hidden="true">→</span>
            </Link>
          )}
          <Link to="/" className="ClubRoomSideNav__exit">
            <IoArrowBackOutline aria-hidden />
            메인 사이트로
          </Link>
        </div>
      </nav>
    </>
  );
};

export default ClubRoomNavbar;
