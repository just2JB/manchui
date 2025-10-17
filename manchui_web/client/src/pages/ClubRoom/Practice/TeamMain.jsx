import React, { useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import "./TeamMain.css";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useState } from "react";
import { IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import { TeamCalender } from "./TeamCalender";
const serverUrl = import.meta.env.VITE_SERVER_URL;
const clientUrl = import.meta.env.VITE_CLIENT_URL;
const TeamMain = () => {
  const [team, setTeam] = useState({ name: "", members: [] });
  const [selectedDay, setselectedDay] = useState(new Date());
  const [infoMenuOpen, setinfoMenuOpen] = useState(false);
  const { user } = useOutletContext();
  const nav = useNavigate();
  const parmas = useParams();
  const inviteURL = `${clientUrl}/club/team/join/${parmas.id}`;

  const clickDate = (date) => {
    setselectedDay(date);
    return;
  };

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
        <div className="tmamInfoTop">
          <div className="name">Team {team.name}</div>
          <div className="menuDiv">
            {infoMenuOpen ? (
              <button
                className="menuButton"
                onClick={() => setinfoMenuOpen(false)}
              >
                <IoCloseOutline />
              </button>
            ) : (
              <button
                className="menuButton"
                onClick={() => setinfoMenuOpen(true)}
              >
                <IoMenuOutline />
              </button>
            )}
            <div className={`teamInfoMenu ${infoMenuOpen ? "openMenu" : ""}`}>
              <div className="invite menuContent">초대하기</div>
              <div className="edit menuContent">팀 정보 수정하기</div>
              <div
                className="quit menuContent"
                onClick={() => quitTeamHandle(user._id)}
              >
                팀 탈퇴하기
              </div>
              {team.leaderId === user._id ? (
                <div className="leaderMenu">
                  <div
                    className="delete menuContent"
                    onClick={() => deleteTeamHandel()}
                  >
                    팀 삭제하기
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>

        <div className="members">
          -팀원: {team.members.length}명
          {team.members.map((member) => (
            <div className="member" key={member._id}>
              {member.username}
            </div>
          ))}
        </div>
        <div className="comment">
          -설명
          <div className="commentContent">{team.comment}</div>
        </div>
      </div>
      <div className="teamSchedule">
        <div className="teamScheduleMenu"></div>
        <div className="teamCalender">
          <TeamCalender selectedDay={selectedDay} clickDate={clickDate} />
        </div>
      </div>
      날짜 클릭 시 종합된 일정과 해당일 연습 만들 수 있는 창 띄우기( 새 페이지
      말고 하위 컴퍼넌트로 오버랩하자)
    </div>
  );
};

export default TeamMain;
