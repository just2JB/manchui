import axios from "axios";
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";

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
            <Link to="/">홈으로</Link>
          ) : (
            <Link to="/club">뒤로가기</Link>
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
            ) : location.pathname === "/club/mypage" ? (
              <h2 className="title-text">마이페이지</h2>
            ) : (
              ""
            )}
          </div>
        </div>
        <div className="button">
          {isLogin ? (
            <>
              <div className="logout" onClick={handleLogout}>
                로그아웃
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
                로그인
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubRoomNavbar;
