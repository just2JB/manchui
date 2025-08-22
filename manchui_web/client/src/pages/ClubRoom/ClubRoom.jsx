import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import AuthWindow from "./AuthWindow/AuthWindow";
import "./ClubRoom.css";
import PracticeCard from "../../components/PracticeCard/PracticeCard";

const mokData = [
  {
    name: "봄축제-올데프",
    date: "2025-08-30",
    startTime: 18,
    endTime: 20,
    place: "귀곡산장",
  },
  {
    name: "꿈터-사이렌",
    date: "2025-09-03",
    startTime: 18,
    endTime: 20,
    place: "이젠스튜디오 E10",
  },
  {
    name: "꿈터-볼케이노",
    date: "2025-09-10",
    startTime: 18,
    endTime: 20,
    place: "이젠스튜디오 E10",
  },
  {
    name: "꿈터-사이렌",
    date: "2025-09-19",
    startTime: 18,
    endTime: 20,
    place: "이젠스튜디오 E10",
  },
];

const ClubRoom = () => {
  const [user, setUser] = useState({ username: "" });
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const responsse = await axios.post(
          "https://manchuitestserver.run.goorm.site/api/auth/verify-token",
          {},
          { withCredentials: true }
        );
        if (responsse.data.isValid) {
          return setUser(responsse.data.user);
        }
        return setAuthIsOpen(true);
      } catch (error) {
        setAuthIsOpen(true);
        console.log("토큰 인증 실패", error);
      }
    };
    verifyToken();
  }, []);

  const [authIsOpen, setAuthIsOpen] = useState(false);

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
          <div className="aka">그냥 사는</div>
          <div className="username">{user.username}</div>
          <div className="position">직책: 댄서</div>
          {user.username.length > 0 ? (
            <>
              <Link className="mypage" to="/club/mypage">
                마이페이지
              </Link>
              <button className="logout" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <button className="authOpen" onClick={() => setAuthIsOpen(true)}>
              로그인
            </button>
          )}
        </div>
        <div className="next-practice">
          <h3>나의 연습 일정</h3>
          <div className="cards">
            {mokData.map((practice) => (
              <PracticeCard practice={practice} />
            ))}
          </div>
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
