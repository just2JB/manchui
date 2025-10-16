import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import "./TeamJoin.css";
import axios from "axios";
import AuthWindow from "../AuthWindow/AuthWindow";
const serverUrl = import.meta.env.VITE_SERVER_URL;
//false라면 로그인 창 띄우고 버튼 눌러 가입 가입 후 연습 탭으로 이동
//clubRoom처럼 구성하면 될 거 같아요 알죠?
const TeamJoin = () => {
  const [user, setUser] = useState({ username: "" });
  const [teamName, setTeamName] = useState("");
  const { isLogin, setIsLogin, authIsOpen, setAuthIsOpen } = useOutletContext();
  const parmas = useParams();
  const nav = useNavigate();
  const joinTeamHandle = async (userId) => {
    try {
      const response = await axios.post(
        `${serverUrl}/api/team/join`,
        {
          teamId: parmas.id.slice(1),
          userId: userId,
        },
        {
          withCredentials: true,
        }
      );
      alert(response.data.message);
      nav("/club/practice");
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true }
        );
        if (response.data.isValid) {
          setUser(response.data.user);
          setIsLogin(true);
          return;
        }
        return;
      } catch (error) {
        console.log("토큰 인증 실패", error);
        setIsLogin(false);
      } finally {
      }
    };
    const getMyTeams = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/team/${parmas.id.slice(1)}`,
          {
            withCredentials: true,
          }
        );
        setTeamName(response.data.team.name);
      } catch (error) {
        alert("팀이 없습니다 링크를 다시확인해 주세요!");
        nav("/club");
      }
    };
    getMyTeams();
    verifyToken();
  }, []);
  return (
    <div className="teamJoin">
      {isLogin ? (
        <div>
          {user.username}님 Team {teamName}에 가입하기
          <button onClick={() => joinTeamHandle(user._id)}>가입하기</button>
        </div>
      ) : (
        <div>로그인하고 Team {teamName}에 가입하기</div>
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

export default TeamJoin;
