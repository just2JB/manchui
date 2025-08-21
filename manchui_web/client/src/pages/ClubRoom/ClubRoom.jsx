import React, { useState } from "react";
import axios from "axios";

import AuthWindow from "./AuthWindow/AuthWindow";
import "./ClubRoom.css";

const ClubRoom = () => {
  const [authIsOpen, setAuthIsOpen] = useState(true);
  const [user, setUser] = useState({ username: "" });

  const handleLogout = async (e) => {
    try {
      const response = await axios.post(
        "https://manchuitestserver.run.goorm.site/api/auth/logout",
        {},
        { withCredentials: true }
      );
      alert(response.data.message);
      setUser({ username: "" });
    } catch (error) {
      console.log(error.response.data.message);
    }
  };

  return (
    <div className="club-room">
      {authIsOpen ? (
        <AuthWindow setUser={setUser} setAuthIsOpen={setAuthIsOpen} />
      ) : (
        <></>
      )}
      <div className="my-info">
        <div className="profil">
          {user.username.length > 0 ? (
            <>
              <>{user.username}</>
              <button className="logout" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="authOpen" onClick={() => setAuthIsOpen(true)}>
                로그인
              </button>
            </>
          )}
        </div>
        <div className="status">내 상태</div>
      </div>
      <div className="menu">
        <div className="reservation">예약하기</div>
        <div className="practice">연습</div>
        <div className=""></div>
      </div>
    </div>
  );
};

export default ClubRoom;
