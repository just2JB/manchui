import axios from "axios";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";
import { IoIosMenu, IoMdArrowBack, IoIosClose } from "react-icons/io";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import { useManchuiModal } from "../../hooks/ManchuiModal";

const ClubRoomNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const manchuiModal = useManchuiModal();

  const nav = useNavigate();
  const handleLogout = async (e) => {
    if (await manchuiModal(`로그아웃 하시겠습니까?`, "confirm")) {
      let message = "로그아웃 되었습니다.";
      try {
        const res = await axios.post(
          `${serverUrl}/api/auth/logout`,
          {},
          { withCredentials: true },
        );
        if (res?.data?.message) message = res.data.message;
      } catch (e) {
        console.log(e);
      } finally {
        await manchuiModal(message);
        localStorage.removeItem("token");
      }
    }
  };
  return (
    <div className="ClubRoomNavbar">
      {location.pathname.includes("/club/team/join") ? (
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
              <img
                src="/logos/longLogo_white.png"
                alt="Logo"
                className="manchui-logo"
              />
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
                <div
                  className="menubutton contectDev"
                  onClick={() => manchuiModal("테스트", "confirm")}
                >
                  개발자 문의
                </div>
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

                <div
                  className="menubutton logout"
                  onClick={() => handleLogout()}
                >
                  로그아웃
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubRoomNavbar;
