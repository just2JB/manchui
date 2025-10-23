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
        <div className="teamCalender">
          <TeamCalender selectedDay={selectedDay} clickDate={clickDate} />
        </div>
        <div className="teamScheduleMenu">
          <div className="date">{selectedDay.toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
};

/* 
달력에 표시될 것
1. 연습이 있는 날
2. 연습 일정 작성 요청된 날
3. 연습 일정 작성이 완료된 날

날짜 클릭 시 종합된 일정과 해당일 연습 만들 수 있는 창 띄우기( 새 페이지 말고 하위 컴퍼넌트로 오버랩하자)
해당 날짜 선택 시
1. 해당 일 연습 일정 보기 
2. 해당 일 연습 일정 추가하기(수정하기)
3. 일정 작성 요청하기
4. 내 일정 작성 상태 보이기

연습 일정 추가 탭
1. 팀원의 스케줄 확인 후 연습 시간 설정
2. 연습장소 설정(1.개인이 입력 2. 미정상태)
3. 등록 완료
연습 장소 동아리 지원 시 - 임원진 계정에서 확인 가능한 페이지에서 예약후 할당
임원진 페이지에 연습장소 요청된 연습들 볼 수 있도록 구성, 이후 예약 완료하면 임원진이 할당 및 공지

문제1 - 다른 팀 연습 때문에 스케줄이 안될 경우 이를 확인하는 방법?
  ㄴ 원래 가능하지만 다른 팀때문에 불가능한 시간대는 따로표기
문제2 - 연습 시간 불가능한 날 입력 완료로 표시 할려면?
  ㄴ 1. 스케줄 불러올 때 전 주의 일정 삭제하면서 세이브하기
  ㄴ 2. 스케줄 입력에 임시저장과 일정 확정으로 구분하여 저장하기
  ㄴ 3. 그럼 스케줄 부터 다시 만들자


*/
export default TeamMain;
