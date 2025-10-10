import axios from "axios";
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";
import { IoIosLogOut, IoIosLogIn, IoMdArrowBack } from "react-icons/io";
import { LuSquareArrowOutUpLeft } from "react-icons/lu";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const ClubRoomNavbar = ({ isLogin, setAuthIsOpen }) => {
  const location = useLocation();

  const nav = useNavigate();
  const handleLogout = async (e) => {
    if (confirm(`로그아웃 하시겠습니까?`)) {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/logout`,
          {},
          { withCredentials: true }
        );
        nav("/club");
        window.location.reload();
        alert(response.data.message);
      } catch (error) {
        nav("/club");
        window.location.reload();
        console.log(error.response.data.message);
      }
    }
  };
  return (
    <div className="ClubRoomNavbar">
      <div className="topBar">
        <div className="out">
          {location.pathname === "/club" ? (
            <Link to="/">
              <LuSquareArrowOutUpLeft className="navIcons" />
            </Link>
          ) : (
            <Link to="/club">
              <IoMdArrowBack className="navIcons" />
            </Link>
          )}
        </div>
        <div className="title">
          <div>
            {location.pathname === "/club" ? (
              <Link className="logo" to="/club">
                <img
                  src="/logos/longLogo_white.png"
                  alt="Logo"
                  className="manchui-logo"
                />
              </Link>
            ) : location.pathname === "/club/reservation" ? (
              <h2 className="title-text">동아리방 예약</h2>
            ) : location.pathname === "/club/practice" ? (
              <h2 className="title-text">연습</h2>
            ) : location.pathname.includes("/club/edit-schedule") ? (
              <h2 className="title-text">일정 작성</h2>
            ) : location.pathname === "/club/schedule" ? (
              <h2 className="title-text">일정 등록</h2>
            ) : location.pathname === "/club/mypage" ? (
              <h2 className="title-text">마이페이지</h2>
            ) : (
              <h2 className="title-text">없는 페이지입니다?</h2>
            )}
          </div>
        </div>
        <div className="button">
          {isLogin ? (
            <>
              <div className="logout" onClick={handleLogout}>
                <IoIosLogOut className="navIcons" />
              </div>
            </>
          ) : (
            <>
              <div
                className="login"
                onClick={() => {
                  setAuthIsOpen(true);
                }}
              >
                <IoIosLogIn className="navIcons" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubRoomNavbar;
