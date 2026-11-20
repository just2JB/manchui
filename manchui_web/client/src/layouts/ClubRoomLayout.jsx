import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ClubRoomNavbar from "../pages/ClubRoom/ClubRoomNavbar";
import "../pages/ClubRoom/clubMinimalTheme.css";
import "../pages/ClubRoom/clubPalette.css";
import "../pages/ClubRoom/clubLookNext.css";
import { ClubThemeContext, useClubTheme } from "../hooks/useClubTheme";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import Loading from "../components/Loading/Loading";
import PreparingPage from "./PreparingPage";
import { useAppSettings } from "../context/AppSettingsContext";
import { useAuth } from "../context/AuthContext";

/** 공개 예약 공유 링크만 어시스턴트 비활성화 시에도 표시 */
function isReservationSharePath(pathname) {
  return /^\/club\/reservation\/share\/[^/]+$/.test(pathname);
}

/** 일정 투표 링크: 비회원도 열 수 있는 공개 페이지 */
function isPollPath(pathname) {
  return /^\/club\/poll\/[^/]+\/?$/.test(pathname);
}

/** 연습 생성(시간 정하기) 화면: 하단에 만들기 바가 붙으므로 탭바를 숨긴다 */
function isPracticeCreatePath(pathname) {
  return /^\/club\/team\/[^/]+\/practice\/new\/?$/.test(pathname);
}

/** 홈 룩을 적용하는 페이지 (팀 페이지는 아직 제외) */
function isNextLookPath(pathname) {
  return /^\/club\/(mypage|recommend|reservation)(\/|$)/.test(pathname);
}

/** 예약 페이지는 데스크톱에서 600px 열 대신 전체 폭 사용 */
function isWideBodyPath(pathname) {
  return /^\/club\/reservation\/?$/.test(pathname) || isPollPath(pathname);
}

const ClubRoomLayout = () => {
  const { theme, toggleTheme } = useClubTheme();
  const location = useLocation();
  const {
    joinConfigLoading,
    joinConfigLoaded,
    siteRestricted,
    assistantEnabled,
    ensureJoinConfigLoaded,
  } = useAppSettings();
  const { user } = useAuth();
  const pollPage = isPollPath(location.pathname);
  const shareOnly = isReservationSharePath(location.pathname) || pollPage;
  const wideBody = isWideBodyPath(location.pathname);
  // 비로그인 게스트가 투표 링크로 들어오면 어시스턴트 탭은 숨긴다
  const hideBottomNav =
    location.pathname === "/club/login" || (pollPage && !user);
  /** 일정 종합 · 연습 생성 화면: 모바일 하단 탭바만 숨김 (PC 사이드바는 그대로) */
  const hideMobileTabBar = pollPage || isPracticeCreatePath(location.pathname);

  useEffect(() => {
    if (!shareOnly) {
      void ensureJoinConfigLoaded();
    }
  }, [shareOnly, ensureJoinConfigLoaded]);

  /** 홈과 같은 룩(clubLookNext.css)을 쓰는 페이지: body 에 표시해서 모달·시트(portal)까지 같이 바뀌게 한다 */
  const nextLook = !shareOnly && isNextLookPath(location.pathname);
  useEffect(() => {
    if (!nextLook) return undefined;
    document.body.dataset.clubLook = "next";
    return () => {
      delete document.body.dataset.clubLook;
    };
  }, [nextLook]);

  /** 모바일: 하단 탭 / PC(1024px+): 왼쪽 사이드바 */
  const showNav = assistantEnabled && !hideBottomNav;

  if (joinConfigLoading && !shareOnly) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <Loading overlay={false} size="sm" />
      </div>
    );
  }

  if (joinConfigLoaded && siteRestricted) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <PreparingPage variant="club" reason="siteRestricted" />
      </div>
    );
  }

  if (joinConfigLoaded && assistantEnabled === false && !shareOnly) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <PreparingPage variant="club" reason="assistantDisabled" />
      </div>
    );
  }

  return (
    <ClubThemeContext.Provider value={{ theme, toggleTheme }}>
      <ScrollToTopOnRoute />
      <div
        className={[
          "clubRoomLayout",
          showNav && "clubRoomLayout--withNav",
          hideMobileTabBar && "clubRoomLayout--noTabBar",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showNav ? <ClubRoomNavbar /> : null}
        <div
          className={[
            "clubRoombody",
            (hideBottomNav || hideMobileTabBar) && "clubRoombody--noBottomNav",
            wideBody && "clubRoombody--wide",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Outlet />
        </div>
      </div>
    </ClubThemeContext.Provider>
  );
};

export default ClubRoomLayout;
