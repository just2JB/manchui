import React, { useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import "./TeamMain.css";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useState } from "react";
const serverUrl = import.meta.env.VITE_SERVER_URL;
const clientUrl = import.meta.env.VITE_CLIENT_URL;
const TeamMain = () => {
  const [team, setTeam] = useState({ name: "", members: [] });
  const { user } = useOutletContext();
  const nav = useNavigate();
  const parmas = useParams();
  useEffect(() => {
    const getMyTeams = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/team/${parmas.id.slice(1)}`,
          {
            withCredentials: true,
          }
        );
        setTeam(response.data.team);
      } catch {
        alert("존재하지 않는 팀 입니다.");
        nav("/club/practice");
      }
    };
    getMyTeams();
  }, []);

  const quitTeamHandle = async (userId) => {
    //탈퇴 전 confirm 띄우기
    try {
      const response = await axios.post(
        `${serverUrl}/api/team/quit`,
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
      nav("/club/practice");
    }
  };
  const deleteTeamHandel = async () => {
    //삭제 전 확인 문구 띄우기
    try {
      const response = await axios.delete(
        `${serverUrl}/api/team/${parmas.id.slice(1)}`,
        {
          withCredentials: true,
        }
      );
      alert(response.data.message);
      nav("/club/practice");
    } catch {
      alert(error.response.data.message);
    }
  };
  return (
    <div className="teamMain">
      <div className="teamInfo">
        <div className="name">Team {team.name}</div>
        <div className="members">
          팀원:
          {team.members.map((member) => (
            <div className="member" key={member._id}>{member.username}</div>
          ))}
        </div>
        <div className="comment"> {team.comment}</div>
        <div className="invite">
          초대링크:
          <a className="joinUrl">{`${clientUrl}/club/team/join/${parmas.id}`}</a>
        </div>
        {team.leaderId === user._id ? (
          <div className="leaderMenu">
            <div className="delete" onClick={() => deleteTeamHandel()}>
              팀 삭제하기
            </div>
            <div className="edit">팀 정보 수정하기</div>
          </div>
        ) : (
          ""
        )}
        <div className="quit" onClick={() => quitTeamHandle(user._id)}>
          팀 탈퇴하기
        </div>
      </div>
      <div className="teamSchedule"></div>
    </div>
  );
};

export default TeamMain;
