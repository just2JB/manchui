import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import axios from "axios";

import AuthWindow from "./AuthWindow/AuthWindow";
import "./ClubRoom.css";
import Schedule from "../../components/Schedule/Schedule";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const ClubRoom = () => {
  const [user, setUser] = useState({ username: "" });
  const { isLogin, setIsLogin, authIsOpen, setAuthIsOpen } = useOutletContext();
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const responsse = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true }
        );
        if (responsse.data.isValid) {
          setIsLogin(true);
          return setUser(responsse.data.user);
        }
        setIsLogin(false);
        return;
      } catch (error) {
        setIsLogin(false);
        console.log("토큰 인증 실패", error);
      }
    };
    verifyToken();
  }, []);

  const handleLogout = async (e) => {
    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      alert(response.data.message);
      setIsLogin(false);
      setUser({ username: "" });
    } catch (error) {
      console.log(error.response.data.message);
    }
  };
  return (
    <div className="club-room">
      {authIsOpen ? (
        <AuthWindow
          setIsLogin={setIsLogin}
          setUser={setUser}
          setAuthIsOpen={setAuthIsOpen}
        />
      ) : (
        <></>
      )}
      <div className="my-info">
        <div className="profil">
          <div className="aka">그냥 사는</div>
          <div className="username">{user.username}</div>
          <div className="position">직책: 댄서</div>

          <div className="profill-button">
            {isLogin ? (
              <>
                <Link className="mypage" to="/club/mypage">
                  마이페이지
                </Link>
                <div className="logout" onClick={handleLogout}>
                  로그아웃
                </div>
              </>
            ) : (
              <div className="authOpen" onClick={() => setAuthIsOpen(true)}>
                로그인
              </div>
            )}
          </div>
        </div>
        <div className="next-practice">
          <h3>나의 연습 일정</h3>
          <Schedule />
        </div>
      </div>
      <div className="menu">
        <div className="grid">
          <Link className="reservation menu-button" to="/club/reservation">
            동아리방<br></br> 예약
          </Link>

          <Link className="practice menu-button" to="/club/practice">
            연습
          </Link>
          <Link className="practice menu-button" to="/club/practice">
            버튼3
          </Link>
          <Link className="practice menu-button" to="/club/practice">
            버튼4
          </Link>
        </div>
        <div className=""></div>
      </div>
    </div>
  );
};

export default ClubRoom;
