import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import axios from "axios";

import AuthWindow from "./AuthWindow/AuthWindow";
import "./ClubRoom.css";
import Loading from "../../components/Loading/Loading";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const ClubRoom = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ username: "" });
  const { isLogin, setIsLogin, authIsOpen, setAuthIsOpen } = useOutletContext();
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
      {user.position === "임원진" ? <Link to="/admin">관리자페이지</Link> : ""}
      <div className="my-info">
        <div className="profil">
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
        </div>
      </div>
      <div className="content">콘텐츠</div>

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
