import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import "./TeamJoin.css";
import axios from "axios";
import AuthWindow from "../AuthWindow/AuthWindow";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import Loading from "../../../components/Loading/Loading";
//false라면 로그인 창 띄우고 버튼 눌러 가입 가입 후 연습 탭으로 이동
//clubRoom처럼 구성하면 될 거 같아요 알죠?
const TeamJoin = () => {
  const [user, setUser] = useState({ username: "" });
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const { isLogin, setIsLogin, authIsOpen, setAuthIsOpen } = useOutletContext();
  const parmas = useParams();
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();
  const joinTeamHandle = async (userId) => {
    try {
      setLoading(true);
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
      manchuiModal(response.data.message);
      nav("/club/team");
    } catch (error) {
      await manchuiModal(error.response.data.message);
    } finally {
      setLoading(false);
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
        await manchuiModal("팀이 없습니다 링크를 다시확인해 주세요!");
        nav("/club");
      }
    };
    getMyTeams();
    verifyToken();
  }, []);
  return (
    <div className="teamJoin">
      <div className="container">
        <div>
          <img
            src="/logos/longLogo_red.png"
            alt="Logo"
            className="inviteLogo"
          />
          <div className="teamnameText">{teamName} 참여하기</div>
        </div>

        {isLogin ? (
          <div className="login">
            <div className="usernameText">{user.username}님을 초대합니다.</div>
            <button
              className="joinButton"
              onClick={() => joinTeamHandle(user._id)}
            >
              참여하기
            </button>
            <button className="joinButton" onClick={() => nav("/club")}>
              만취 홈
            </button>
            <div className="anotherAccount" onClick={() => setAuthIsOpen(true)}>
              다른 계정으로 로그인
            </div>
          </div>
        ) : (
          <div className="login">
            <div className="usernameText">로그인후 참여하기</div>
            <button className="joinButton" onClick={() => setAuthIsOpen(true)}>
              로그인
            </button>
            <button className="joinButton" onClick={() => nav("/club")}>
              만취 홈
            </button>
          </div>
        )}
      </div>
      {authIsOpen ? (
        <AuthWindow
          setIsLogin={setIsLogin}
          setUser={setUser}
          setAuthIsOpen={setAuthIsOpen}
        />
      ) : (
        <></>
      )}
      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default TeamJoin;
