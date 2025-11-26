import React, { useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import "./TeamMain.css";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import EditTeamPractice from "./EditTeamPractice";
import CreateTeamPractice from "./CreateTeamPractice";
import { useState } from "react";
import {
  IoMenuOutline,
  IoCloseOutline,
  IoTrashSharp,
  IoPencil,
} from "react-icons/io5";
import { TeamCalender } from "./TeamCalender";
import { HiUserGroup } from "react-icons/hi";
import {
  MdOutlineAccessTime,
  MdOutlinePlace,
  MdCalendarMonth,
} from "react-icons/md";
const serverUrl = import.meta.env.VITE_SERVER_URL;
const clientUrl = import.meta.env.VITE_CLIENT_URL;
const TeamMain = () => {
  const [team, setTeam] = useState({
    name: "",
    members: [],
    requestSchedules: [],
  });
  const [comment, setComment] = useState();
  const [openCreatePractice, setOpenCreatePractice] = useState(false);
  const [teamPractice, setTeamPractice] = useState([]);
  const [selectedDay, setselectedDay] = useState(new Date());
  const [infoMenuOpen, setinfoMenuOpen] = useState(false);
  const [practiceInfoDetail, setPracticeInfoDetail] = useState("unSelect");
  const [detailMemberOpen, setDetailMemberOpen] = useState(false);
  const [editPractice, setEditPractice] = useState("unSelect");
  const [daySchedulNow, setDaySchedulNow] = useState({
    confirm: [],
    unconfirm: [],
  });
  const { user } = useOutletContext();
  const nav = useNavigate();
  const parmas = useParams();
  const inviteURL = `${clientUrl}/club/team/join/${parmas.id}`;

  const clickDate = (date) => {
    setselectedDay(date);
    setDaySchedulNow({
      confirm: team.members.filter((member) =>
        team.memberSchedules
          .filter(
            (schedule) =>
              new Date(schedule.date).toLocaleDateString() ===
              date.toLocaleDateString()
          )
          .some((schedule) => schedule.userId === member._id)
      ),
      unconfirm: team.members.filter(
        (member) =>
          !team.memberSchedules
            .filter(
              (schedule) =>
                new Date(schedule.date).toLocaleDateString() ===
                date.toLocaleDateString()
            )
            .some((schedule) => schedule.userId === member._id)
      ),
    });
    return;
  };
  const clickPractice = (practice) => {
    if (practice._id === practiceInfoDetail._id) {
      setPracticeInfoDetail("unSelect");
    } else {
      setPracticeInfoDetail(practice);
    }
  };
  const getFomatDate = (localeDateString) => {
    localeDateString = localeDateString.split(". ").join(".");
    const year = localeDateString.split(".")[0];
    const month =
      localeDateString.split(".")[1].length === 1
        ? "0" + localeDateString.split(".")[1]
        : localeDateString.split(".")[1];
    const date =
      localeDateString.split(".")[2].length === 1
        ? "0" + localeDateString.split(".")[2]
        : localeDateString.split(".")[2];
    return `${year}-${month}-${date}`;
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
  const handelCommentChange = (e) => {
    setComment(e.target.value);
  };
  const submitCommentHandle = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${serverUrl}/api/team/edit`,
        {
          teamId: team._id,
          name: team.name,
          comment: comment,
        },
        {
          withCredentials: true,
        }
      );
      alert(response.data.message);
    } catch {
      alert("서버 오류입니다.");
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
        setTeam({
          ...response.data.team,
          memberSchedules: response.data.memberSchedules,
        });
        setComment(response.data.team.comment);
        setDaySchedulNow({
          confirm: response.data.team.members.filter((member) =>
            response.data.memberSchedules
              .filter(
                (schedule) =>
                  new Date(schedule.date).toLocaleDateString() ===
                  new Date().toLocaleDateString()
              )
              .some((schedule) => schedule.userId === member._id)
          ),
          unconfirm: response.data.team.members.filter(
            (member) =>
              !response.data.memberSchedules
                .filter(
                  (schedule) =>
                    new Date(schedule.date).toLocaleDateString() ===
                    new Date().toLocaleDateString()
                )
                .some((schedule) => schedule.userId === member._id)
          ),
        });
        await getPractice();
      } catch {
        alert("존재하지 않는 팀 입니다.");
        nav("/club/team");
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
      nav("/club/team");
    } catch (error) {
      alert(error.response.data.message);
      nav("/club/team");
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
      nav("/club/team");
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
      setEditPractice("unSelect");
      setPracticeInfoDetail("unSelect");
    } catch (error) {
      alert(error.response.data.message);
    }
  };
  const getTotal = () => {
    let total = 0;
    teamPractice.forEach((practice) => {
      total +=
        Number(practice.time.split("~")[1]) -
        Number(practice.time.split("~")[0]);
    });

    return total;
  };
  const shareHandler = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "만취에서 연습하기",
          text: `[${team.name}] 참여`,
          url: inviteURL,
        });
      } catch (error) {
        console.error("공유 실패:", error);
      }
    } else {
      navigator.clipboard.writeText(inviteURL);
      alert("초대 링크가 클립보드에 복사되었습니다.");
    }
  };
  return (
    <div className="teamMain">
      <div className="teamInfo">
        <div className="tmamInfoTop">
          <div className="name">
            <span
              style={{
                padding: "2px",
                marginRight: "3px",
                backgroundColor: `${team.teamColor}`,
              }}
            ></span>
            {team.name}
          </div>
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
          </div>
        </div>
        <div className="memberSection">
          <div className="memberLength"> 팀원: {team.members.length}명</div>
          <div className="members">
            {team.members.map((member) => (
              <div className="member" key={member._id}>
                {member.username.length > 3
                  ? member.username.slice(0, 3) + ".."
                  : member.username}
              </div>
            ))}
            <div className="member inviteMember" onClick={() => shareHandler()}>
              초대하기
            </div>
          </div>
        </div>

        <form className="comment" onSubmit={(e) => submitCommentHandle(e)}>
          <div className="commentContent">
            {comment}
            <input
              className="commentInput"
              value={comment}
              onChange={(e) => handelCommentChange(e)}
            ></input>
          </div>
        </form>
      </div>
      <div className="teamSchedule">
        <div className="teamCalender">
          <TeamCalender
            selectedDay={selectedDay}
            clickDate={clickDate}
            requestSchedules={team.requestSchedules}
            teamPractice={teamPractice}
          />
          <div
            className={`practiceInfoDetailPop ${
              practiceInfoDetail !== "unSelect" ? "openInfoDetail" : ""
            } `}
          >
            <div className="practiceInfoDetail">
              <div className="detailInfoBox">
                <h3>연습 정보</h3>
                {practiceInfoDetail !== "unSelect" ? (
                  <div className="edtailDate">
                    <MdCalendarMonth className="icons" />
                    {practiceInfoDetail.date}
                  </div>
                ) : (
                  ""
                )}

                {practiceInfoDetail !== "unSelect" ? (
                  <div className="edtailTime">
                    <MdOutlineAccessTime className="icons" />
                    {(practiceInfoDetail.time.split("~")[0] * 2) % 2 === 0
                      ? `${practiceInfoDetail.time.split("~")[0]}:00`
                      : `${practiceInfoDetail.time.split("~")[0] - 0.5}:30`}
                    ~
                    {(practiceInfoDetail.time.split("~")[1] * 2) % 2 === 0
                      ? `${practiceInfoDetail.time.split("~")[1]}:00`
                      : `${practiceInfoDetail.time.split("~")[1] - 0.5}:30`}
                  </div>
                ) : (
                  ""
                )}

                <div className="edtailPlace">
                  <MdOutlinePlace className="icons" />
                  {practiceInfoDetail.place}
                </div>
              </div>
              <div className="detailMembers">
                {practiceInfoDetail !== "unSelect"
                  ? team.members
                      .filter((member) =>
                        practiceInfoDetail.members.includes(member._id)
                      )
                      .map((member) => (
                        <div key={member._id} className="detailMember">
                          {member.username}
                        </div>
                      ))
                  : ""}
              </div>
              <div className="buttonBox">
                <div
                  className="editPracticButton"
                  onClick={() => setEditPractice(practiceInfoDetail)}
                >
                  <IoPencil />
                </div>
                <div
                  className="deletePracticeButton"
                  onClick={() => deletePracticeHandle(practiceInfoDetail._id)}
                >
                  <IoTrashSharp />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="teamScheduleMenu">
          <div className="practiceSection">
            <div className="thisDayPractice">
              {teamPractice
                .filter(
                  (practice) =>
                    new Date(practice.date).toLocaleDateString() ===
                    selectedDay.toLocaleDateString()
                )
                .map((practice) => (
                  <div
                    className={`practice ${
                      practice.time === practiceInfoDetail.time
                        ? "detailOpenPractice"
                        : ""
                    }`}
                    onClick={() => clickPractice(practice)}
                    key={practice._id}
                  >
                    <div className="top">
                      <div className="prTime">
                        <MdOutlineAccessTime className="icons" />
                        {(practice.time.split("~")[0] * 2) % 2 === 0
                          ? `${practice.time.split("~")[0]}:00`
                          : `${practice.time.split("~")[0] - 0.5}:30`}
                        ~
                        {(practice.time.split("~")[1] * 2) % 2 === 0
                          ? `${practice.time.split("~")[1]}:00`
                          : `${practice.time.split("~")[1] - 0.5}:30`}
                      </div>
                      <div className="prMember">
                        <HiUserGroup className="icons" />
                        {practice.members.length}
                      </div>
                    </div>
                    <div className="bottom">
                      <div className="prPlace">
                        <MdOutlinePlace className="icons" />
                        {practice.place}
                      </div>
                    </div>
                  </div>
                ))}
              <div
                className="practice"
                onClick={() => setOpenCreatePractice(true)}
              >
                + 새 연습
              </div>
            </div>
          </div>

          <div className="scheduleSection">
            <div className="writeState">
              <div className="" onClick={() => setDetailMemberOpen(true)}>
                <div className="stateText">일정 종합</div>
                <div className="state">
                  <div className="confirm">{daySchedulNow.confirm.length}</div>/
                  <div className="unConfirm">
                    {daySchedulNow.unconfirm.length}
                  </div>
                </div>
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
            <div
              className={`confirmMemberDetail ${
                detailMemberOpen ? "detailOpen" : "detailClose"
              }`}
            >
              <div className="membersBox">
                <div className="confirmMembers">
                  <h4>작성 완료</h4>
                  {daySchedulNow.confirm.map((member) => (
                    <div key={member._id}>{member.username}</div>
                  ))}
                </div>
                <div className="unconfirmMembers">
                  <h4 className="">미작성</h4>
                  {daySchedulNow.unconfirm.map((member) => (
                    <div key={member._id}>{member.username}</div>
                  ))}
                </div>
              </div>
              <div className="memberDetailButtons">
                <div
                  className="editSchedule"
                  onClick={() =>
                    nav(
                      `/club/edit-schedule/${getFomatDate(
                        selectedDay.toLocaleDateString()
                      )}`
                    )
                  }
                >
                  내 일정 편집
                </div>

                <div
                  className="closeDetail"
                  onClick={() => setDetailMemberOpen(false)}
                >
                  닫기
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {openCreatePractice ? (
        <CreateTeamPractice
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
      {editPractice !== "unSelect" ? (
        <EditTeamPractice
          setEditPractice={setEditPractice}
          editPractice={editPractice}
          team={team}
          getPractice={getPractice}
          selectedDayPractice={[
            ...teamPractice.filter(
              (practice) =>
                new Date(practice.date).toLocaleDateString() ===
                selectedDay.toLocaleDateString()
            ),
          ]}
          deletePracticeHandle={deletePracticeHandle}
        />
      ) : (
        ""
      )}

      <div className="teamRecord">
        <div className="practiceTotalTime">
          연습 시간
          <div className="value">
            {getTotal()}
            시간
          </div>
        </div>
        <div className="practiceNumber">
          연습 횟수<div className="value">{teamPractice.length}회</div>
        </div>
      </div>
      <div className={`teamInfoMenu ${infoMenuOpen ? "openMenu" : ""}`}>
        <div className="closeBack" onClick={() => setinfoMenuOpen(false)}></div>
        <div className="menubuttons">
          <div className="invite menuContent" onClick={() => shareHandler()}>
            초대하기
          </div>
          <div
            className="edit menuContent"
            onClick={() => nav(`/club/team/edit-team/:${team._id}`)}
          >
            팀 관리
          </div>
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
  );
};

/* 

!!!!!!연습 수정, 만들기에서 연속된 시간만 선택가능하게 만들어야함!!@!@!@!@!!!!

<span className="joinUrl"> {inviteURL}</span>
<div className="fullMemberPractice">
          모두 모인 횟수
          <div className="value">
            {
              teamPractice.filter(
                (practice) => practice.members.length === team.members.length
              ).length
            }
            회
          </div>
</div>
날짜 클릭 시 종합된 일정과 해당일 연습 만들 수 있는 창 띄우기( 새 페이지 말고 하위 컴퍼넌트로 오버랩하자)
해당 날짜 선택 시
5. 내 일정 작성 하기
7. 연습 수정 하기 // 권한
8. 일정 요청이 필요할까??? - 필요하다면 토글 버튼 같은걸 놓자


연습 일정 추가 탭
2. 연습장소 설정(1.개인이 입력 2. 미정상태)
3. 등록 완료
연습 장소 동아리 지원 시 - 임원진 계정에서 확인 가능한 페이지에서 예약후 할당
임원진 페이지에 연습장소 요청된 연습들 볼 수 있도록 구성, 이후 예약 완료하면 임원진이 할당 및 공지

해야할 것!!
2. 팀 정보 수정 구현
ㄴ 팀원 퇴출, 리더 변경, 삭제하기
팀 탈퇴 하고 싶으면 리더 변경 해야하게 바꾸기

3******************************************************. 연습일정 선택중 연속 시간만 선택가능하게 바꿔야함 ******************************************************.
3******************************************************. 연습일정 선택중 연속 시간만 선택가능하게 바꿔야함 ******************************************************.
3******************************************************. 연습일정 선택중 연속 시간만 선택가능하게 바꿔야함 ******************************************************.
3******************************************************. 연습일정 선택중 연속 시간만 선택가능하게 바꿔야함 ******************************************************.
3******************************************************. 연습일정 선택중 연속 시간만 선택가능하게 바꿔야함 ******************************************************.

4. 연습 모아보기 기능 만들기 내것만 보기 만취 전체 보기 등 새로 구성해보기 ex에타?
5. 30분 단위로 예약 해야하는가?? ㅇㅇㅇ

문제1 - 다른 팀 연습 때문에 스케줄이 안될 경우 이를 확인하는 방법?
  ㄴ 연습 생기면 스케쥴 추가 및 수정~ - 스케쥴 데이터 베이스 분리되어 구현 용이해짐!
*/

export default TeamMain;
