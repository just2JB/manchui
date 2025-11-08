import React, { useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import "./TeamMain.css";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useState } from "react";
import {
  IoMenuOutline,
  IoCloseOutline,
  IoTrash,
  IoPencil,
} from "react-icons/io5";
import { TeamCalender } from "./TeamCalender";
import { HiUserGroup } from "react-icons/hi";
import { MdOutlineAccessTime, MdOutlinePlace } from "react-icons/md";
import { LiaPlusSolid } from "react-icons/lia";
import CreatePractice from "./CreatePractice";
const serverUrl = import.meta.env.VITE_SERVER_URL;
const clientUrl = import.meta.env.VITE_CLIENT_URL;
const TeamMain = () => {
  const [team, setTeam] = useState({
    name: "",
    members: [],
    requestSchedules: [],
  });
  const [openCreatePractice, setOpenCreatePractice] = useState(false);
  const [teamPractice, setTeamPractice] = useState([]);
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

  const getPractice = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/practice/teamPractice/${parmas.id.slice(1)}`,
        {
          withCredentials: true,
        }
      );
      const sortedPractices = response.data.teamPractice.sort((a, b) => {
        const aFirst = a.time.split("~")[0];
        const bFirst = b.time.split("~")[0];
        if (aFirst > bFirst) return 1;
        if (aFirst === bFirst) return 0;
        if (aFirst < bFirst) return -1;
      });
      setTeamPractice(sortedPractices);
    } catch {
      alert("연습을 불러올 수 없습니다.");
    }
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
        await getPractice();
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

  const requestsHandle = async () => {
    try {
      const response = await axios.post(
        `${serverUrl}/api/team/request-schedule`,
        {
          teamId: parmas.id.slice(1),
          date: selectedDay.toLocaleDateString(),
        },
        {
          withCredentials: true,
        }
      );
      setTeam({ ...team, requestSchedules: response.data.newRequestSchedules });
      alert(response.data.message);
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  const deletePracticeHandle = async (id) => {
    try {
      const response = await axios.delete(`${serverUrl}/api/practice/${id}`, {
        withCredentials: true,
      });
      setTeamPractice(teamPractice.filter((practice) => practice._id !== id));
      alert(response.data.message);
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  return (
    <div className="teamMain">
      <div className="teamInfo">
        <div className="tmamInfoTop">
          <div className="name">{team.name}</div>
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
          <TeamCalender
            selectedDay={selectedDay}
            clickDate={clickDate}
            requestSchedules={team.requestSchedules}
            teamPractice={teamPractice}
          />
        </div>
        <div className="teamScheduleMenu">
          <div className="practiceSection">
            <h4>연습</h4>
            <div className="thisDayPractice">
              {teamPractice
                .filter(
                  (practice) =>
                    new Date(practice.date).toLocaleDateString() ===
                    selectedDay.toLocaleDateString()
                )
                .map((practice) => (
                  <div className="practice" key={practice._id}>
                    <div className="top">
                      <div className="prTime">
                        <MdOutlineAccessTime />
                        {practice.time}
                      </div>
                      <div className="prMember">
                        <HiUserGroup />
                        {practice.members.length}
                      </div>
                    </div>
                    <div className="bottom">
                      <div className="prPlace">
                        <MdOutlinePlace />
                        {practice.place}
                      </div>
                    </div>

                    <div className="moreOption">
                      <div className="hoverDiv"></div>
                      <div className="edit">
                        <IoPencil />
                      </div>
                      <div
                        className="delete"
                        onClick={() => deletePracticeHandle(practice._id)}
                      >
                        <IoTrash />
                      </div>
                    </div>
                  </div>
                ))}
              <div
                className="practice"
                onClick={() => setOpenCreatePractice(true)}
              >
                <LiaPlusSolid />
              </div>
            </div>
          </div>

          <div className="scheduleSection">
            <div className="writeState">
              <div className="stateText">일정 종합</div>
              <div className="state">
                <div className="confirm">1</div>/
                <div className="unConfirm">{team.members.length}</div>
              </div>
            </div>
            {team.requestSchedules.some(
              (item) => item === selectedDay.toLocaleDateString()
            ) ? (
              <div
                className="requestSchedule redButton"
                onClick={() => requestsHandle()}
              >
                요청
                <br />
                취소
              </div>
            ) : (
              <div className="requestSchedule" onClick={() => requestsHandle()}>
                일정
                <br />
                요청
              </div>
            )}
          </div>
        </div>
      </div>

      {openCreatePractice ? (
        <CreatePractice
          setOpenCreatePractice={setOpenCreatePractice}
          selectedDay={selectedDay}
          team={team}
          getPractice={getPractice}
          selectedDayPractice={[
            ...teamPractice.filter(
              (practice) =>
                new Date(practice.date).toLocaleDateString() ===
                selectedDay.toLocaleDateString()
            ),
          ]}
        />
      ) : (
        ""
      )}
    </div>
  );
};

/* 
      <span className="joinUrl"> {inviteURL}</span>
날짜 클릭 시 종합된 일정과 해당일 연습 만들 수 있는 창 띄우기( 새 페이지 말고 하위 컴퍼넌트로 오버랩하자)
해당 날짜 선택 시
4. 팀원 일정 작성 상태 보기
5. 내 일정 작성 하기
6. 연습 정보 상세보기
8. 연습실 설정하기

연습 일정 추가 탭
1. 팀원의 스케줄 확인 후 연습 시간 설정
2. 연습장소 설정(1.개인이 입력 2. 미정상태)
3. 등록 완료
연습 장소 동아리 지원 시 - 임원진 계정에서 확인 가능한 페이지에서 예약후 할당
임원진 페이지에 연습장소 요청된 연습들 볼 수 있도록 구성, 이후 예약 완료하면 임원진이 할당 및 공지
4. 연습 멤버 추가 시 - 그 날짜의 그 멤버들의 연습도 가져오기

문제1 - 다른 팀 연습 때문에 스케줄이 안될 경우 이를 확인하는 방법?
  ㄴ 원래 가능하지만 다른 팀때문에 불가능한 시간대는 따로표기
*/

export default TeamMain;
