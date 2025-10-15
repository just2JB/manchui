import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./TeamMain.css";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useState } from "react";
const serverUrl = import.meta.env.VITE_SERVER_URL;
const clientUrl = import.meta.env.VITE_CLIENT_URL;
const TeamMain = () => {
  const [team, setTeam] = useState({ name: "", members: [] });
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
      } catch {}
    };
    getMyTeams();
  }, []);

  return (
    <div className="teamMain">
      <div className="teamInfo">
        <div className="name">Team {team.name}</div>
        <div className="members">
          팀원:
          {team.members.map((member) => (
            <div key={member._id}>{member.username}</div>
          ))}
        </div>
        <div className="comment"> {team.comment}</div>
        <div className="invite">
          팀원 초대하기{" "}
          <a className="joinUrl">{`${clientUrl}/club/team/join/${parmas.id}`}</a>
        </div>
        <div className="delete">팀 삭제하기</div>
        <div className="edit">팀 정보 수정하기</div>
      </div>
      <div className="teamSchedule"></div>
    </div>
  );
};

export default TeamMain;
