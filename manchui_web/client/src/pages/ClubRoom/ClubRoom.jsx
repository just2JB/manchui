import React, { useState, useEffect, useRef } from "react";
import { Link, useOutletContext } from "react-router-dom";
import axios from "axios";

import AuthWindow from "./AuthWindow/AuthWindow";
import "./ClubRoom.css";
import Loading from "../../components/Loading/Loading";
import Beams from "../../components/Beams/Beams";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const ClubRoom = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ username: "" });
  const { isLogin, setIsLogin, authIsOpen, setAuthIsOpen } = useOutletContext();
  const [profilSpeed, setProfilSpeed] = useState(0);

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const handleLogout = async (e) => {
    if (confirm(`로그아웃 하시겠습니까?`)) {
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
    }
  };

  return (
    <div className="club-room">
      <div className="my-info">
        <div className="infoBack">
          <Beams
            beamWidth={20}
            beamHeight={40}
            beamNumber={1}
            lightColor="rgba(184, 184, 184, 1)"
            speed={profilSpeed}
            noiseIntensity={0}
            scale={0.25}
            rotation={315}
          />
        </div>
        <div className="profil">
          <div className="topMenu">
            <h3 className="title">내 정보</h3>
            <div className="myPage">수정하기</div>
          </div>
          <div
            className="user"
            onClick={() => setProfilSpeed(profilSpeed + 0.5)}
          >
            <div className="aka">{user.aka} </div>
            <div className="username">{user.username} </div>
            <div className="position">직책: {user.position}</div>
            {isLogin ? (
              <>
                <div className="logout" onClick={handleLogout}>
                  로그아웃
                </div>
              </>
            ) : (
              <div className="authOpen" onClick={() => setAuthIsOpen(true)}>
                로그인
              </div>
            )}
            <div className="nextPractice">다음 연습</div>
          </div>
        </div>
      </div>
      <div className="content">
        <div className="schedule">
          <div className="topMenu">
            <div className="left">
              <h3 className="title">나의 일정</h3>
              <div className="month">10월</div>
            </div>
            <div className="right">
              <div className="toToday">오늘</div>
              <div className="update">일정등록</div>
            </div>
          </div>
          <div className="swiper"></div>
        </div>
      </div>
      <div className="toAdmin">
        {user.position === "임원진" ? (
          <Link to="/admin">관리자페이지</Link>
        ) : (
          ""
        )}
      </div>
      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}

      {authIsOpen ? (
        <AuthWindow
          setIsLogin={setIsLogin}
          setUser={setUser}
          setAuthIsOpen={setAuthIsOpen}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default ClubRoom;
