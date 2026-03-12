import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";
import { IoIosMenu, IoMdArrowBack, IoIosClose } from "react-icons/io";
import { LuSquareArrowOutUpLeft } from "react-icons/lu";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const ClubRoomNavbar = ({ isLogin, setAuthIsOpen }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const nav = useNavigate();
  const handleLogout = async (e) => {
    if (confirm(`로그아웃 하시겠습니까?`)) {
      let message = "로그아웃 되었습니다.";
      try {
        const res = await axios.post(
          `${serverUrl}/api/auth/logout`,
          {},
          { withCredentials: true },
        );
        if (res?.data?.message) message = res.data.message;
      } catch (e) {
        // 서버 오류여도 클라이언트 토큰은 제거
      } finally {
        localStorage.removeItem("token");
        nav("/login");
        alert(message);
      }
    }
  };
  return (
    <div className="ClubRoomNavbar">
      {location.pathname.includes("/club/team/join") ||
      location.pathname.includes("/login") ? (
        <div className="topBar inviteLink"></div>
      ) : (
        <div className="topBar">
          <div className="out">
            <div onClick={() => nav(-1)}>
              <IoMdArrowBack className="navIcons" />
            </div>
          </div>
          <div className="title">
            <div className="logoBox">
              {location.pathname !== "이미지만띄우기" ? (
                <img
                  src="/logos/longLogo_white.png"
                  alt="Logo"
                  className="manchui-logo"
                />
              ) : location.pathname === "/club/reservation" ? (
                <h2 className="title-text">동아리방 예약</h2>
              ) : location.pathname === "/club/practice" ? (
                <h2 className="title-text">연습</h2>
              ) : location.pathname === "/club/team" ? (
                <h2 className="title-text">팀</h2>
              ) : location.pathname === "/club/team/create-team" ? (
                <h2 className="title-text">팀 만들기</h2>
              ) : location.pathname.includes("/club/team/edit-team") ? (
                <h2 className="title-text">팀 관리</h2>
              ) : location.pathname.includes("/club/edit-schedule") ? (
                <h2 className="title-text">일정 작성</h2>
              ) : location.pathname.includes("/club/team/team-main") ? (
                <h2 className="title-text">팀 메인</h2>
              ) : location.pathname.includes("/club/schedule") ? (
                <h2 className="title-text">일정 등록</h2>
              ) : location.pathname.includes("/club/mypage") ? (
                <h2 className="title-text">프로필</h2>
              ) : (
                <h2 className="title-text">없는 페이지입니다?</h2>
              )}
            </div>
          </div>
          <div className="button" onClick={() => setMenuOpen(true)}>
            <IoIosMenu />
          </div>

          <div className={`menu ${menuOpen ? "openMenu" : ""}`}>
            <div
              className="closeSection"
              onClick={() => setMenuOpen(false)}
            ></div>
            <div className="menuMenu">
              <div className="topMenu">
                <div className="menuLogoBox">
                  <img
                    src="/logos/longLogo_white.png"
                    alt="Logo"
                    className="menuLogo"
                  />
                </div>
                <div className="closeMenu" onClick={() => setMenuOpen(false)}>
                  <IoIosClose />
                </div>
              </div>
              <div className="bottomMenu" onClick={() => setMenuOpen(false)}>
                <div className="menubutton homePage" onClick={() => nav("/")}>
                  홈페이지
                </div>
                <div className="menubutton contectDev">개발자 문의</div>
                <div
                  className="menubutton adminPage"
                  onClick={() => nav("/admin")}
                >
                  관리자 페이지
                </div>
                <div
                  className="menubutton myPage"
                  onClick={() => nav("/club/mypage")}
                >
                  내 프로필
                </div>
                {isLogin ? (
                  <div
                    className="menubutton logout"
                    onClick={() => handleLogout()}
                  >
                    로그아웃
                  </div>
                ) : (
                  <div
                    className="menubutton logout"
                    onClick={() => setAuthIsOpen(true)}
                  >
                    로그인
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubRoomNavbar;
