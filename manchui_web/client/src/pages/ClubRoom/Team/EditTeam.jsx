import React, { useEffect, useState } from "react";
import "./EditTeam.css";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
const serverUrl = import.meta.env.VITE_SERVER_URL;
const EditTeam = () => {
  const [team, setTeam] = useState({
    name: "",
    members: [],
    requestSchedules: [],
  });
  const parmas = useParams();
  const nav = useNavigate();

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

  const [formData, setFormData] = useState({
    dayDate: getFomatDate(new Date().toLocaleDateString()),
  });
  const [openAddGoal, setOpenAddGoal] = useState(false);
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
      setFormData({
        ...formData,
        name: response.data.team.name,
        teamColor: response.data.team.teamColor,
      });
    } catch {
      alert("존재하지 않는 팀 입니다.");
      nav("/club/practice");
    }
  };

  const onChangeHandle = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const clickAdd = () => {
    if (openAddGoal) {
      setOpenAddGoal(false);
    } else {
      setOpenAddGoal(true);
    }
  };

  const addGoal = async () => {
    if (formData.dayName.length > 0 && formData.dayDate) {
      const newGoal = {
        name: formData.dayName,
        date: formData.dayDate,
      };
      try {
        const response = await axios.post(
          `${serverUrl}/api/team/add-goal`,
          { newGoal, teamId: team._id },
          { withCredentials: true }
        );
        alert("팀 목표가 추가 되었습니다.");
        getMyTeams();
        clickAdd();
      } catch (error) {
        alert("서버 에러입니다.");
      }
    }
  };
  const deleteGoalHandle = async (goalId) => {
    if (!confirm("정말로 삭제하시겠습니까?")) {
      return;
    }
    try {
      const response = await axios.post(
        `${serverUrl}/api/team/delete-goal`,
        {
          teamId: team._id,
          goalId: goalId,
        },
        {
          withCredentials: true,
        }
      );
      alert("팀 목표가 삭제 되었습니다.");
      getMyTeams();
    } catch (error) {}
  };
  const deleteTeamHandel = async () => {
    //삭제 전 확인 문구 띄우기
    if (!confirm("정말로 팀을 삭제하시겠습니까?")) {
      return;
    }

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

  const editInfoHandle = async () => {
    if (formData.name === team.name && formData.teamColor === team.teamColor) {
      return;
    }

    if (!confirm("정말로 변경하시겠습니까?")) {
      return;
    }
    try {
      const response = await axios.post(
        `${serverUrl}/api/team/edit`,
        {
          name: formData.name,
          teamColor: formData.teamColor,
          teamId: team._id,
        },
        { withCredentials: true }
      );
      alert("변경 되었습니다.");
      setFormData({
        dayDate: getFomatDate(new Date().toLocaleDateString()),
      });
      getMyTeams();
    } catch (error) {}
  };
  const quitTeamHandle = async (userId) => {
    if (userId === team.leaderId) {
      alert("팀장을 위임 후 탈퇴해 주세요.");
      return;
    }
    if (!confirm("정말로 탈퇴시키겠습니까?")) {
      return;
    }
    try {
      const response = await axios.post(
        `${serverUrl}/api/team/quit`,
        {
          teamId: team._id,
          userId: userId,
        },
        {
          withCredentials: true,
        }
      );
      alert(response.data.message);
      getMyTeams();
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  const changeLeaderHandle = async (userId) => {
    if (!confirm("정말로 팀장을 바꾸시겠습니까")) {
      return;
    }
    try {
      const response = await axios.post(
        `${serverUrl}/api/team/change-leader`,
        {
          teamId: team._id,
          userId: userId,
        },
        {
          withCredentials: true,
        }
      );
      alert(response.data.message);
      getMyTeams();
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  useEffect(() => {
    getMyTeams();
  }, []);

  return (
    <div className="editTeam">
      <div className="teamInfoEdit">
        <h2>팀 정보</h2>
        <div className="teamInfobox">
          <div className="teamName">
            <label>팀 이름</label>
            <input
              className="textInput"
              placeholder={team.name}
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => onChangeHandle(e)}
            />
          </div>
          <div className="teamColor">
            <label>팀 색상</label>
            <input
              className="colorInput"
              type="color"
              name="teamColor"
              value={formData.teamColor}
              onChange={(e) => onChangeHandle(e)}
            />
          </div>
        </div>
        <button
          className={`infoEditButton ${
            formData.name === team.name && formData.teamColor === team.teamColor
              ? "unChange"
              : ""
          }`}
          onClick={() => editInfoHandle()}
        >
          변경하기
        </button>
      </div>
      <div className="manageSection">
        <div className="goalManage">
          <h2>D-day</h2>
          <div className="listBox">
            <div className="goalList">
              {team.goals
                ? team.goals.map((item) => (
                    <div className="goal" key={item._id}>
                      <div className="goalName">{item.name}</div>
                      <div className="goalDate">{item.date}</div>
                      <div className="deleteGoal">
                        <button
                          className="deleteGoalButton"
                          onClick={() => deleteGoalHandle(item._id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                : ""}

              <div className="goal addButton" onClick={() => clickAdd()}>
                +새 일정
              </div>
            </div>
          </div>
          {openAddGoal ? (
            <div className="addGoal">
              <h2>일정 추가</h2>
              <input
                className="goalNameInput"
                type="text"
                name="dayName"
                placeholder="일정 이름"
                value={formData.dayName}
                onChange={(e) => onChangeHandle(e)}
              />
              <input
                className="dateInput"
                type="date"
                name="dayDate"
                value={formData.dayDate}
                onChange={(e) => onChangeHandle(e)}
              />

              <button className="addConfirm" onClick={() => addGoal()}>
                추가 완료
              </button>
              <button className="addCancle" onClick={() => clickAdd()}>
                닫기
              </button>
            </div>
          ) : (
            ""
          )}
        </div>

        <div className="temeMemberManage">
          <h2>멤버</h2>
          <div className="listBox">
            <div className="memberList">
              {team
                ? team.members.map((member) => (
                    <div
                      className={`member ${
                        team.leaderId === member._id ? "leader" : ""
                      }`}
                      key={member._id}
                    >
                      <div className="memberName">{member.username}</div>
                      <div className="memberId">{member.Identification}</div>
                      {team.leaderId === member._id ? (
                        <div className="leaderTag">팀장</div>
                      ) : (
                        <button
                          className="changeLeaderButton"
                          onClick={() => changeLeaderHandle(member._id)}
                        >
                          팀장 변경
                        </button>
                      )}

                      <button
                        className="quitMemberButton"
                        onClick={() => quitTeamHandle(member._id)}
                      >
                        {" "}
                        탈퇴
                      </button>
                      <div className="memberButton"></div>
                    </div>
                  ))
                : ""}
            </div>
          </div>
        </div>
      </div>
      <div className="footerButtons">
        <button className="deleteTeamButton" onClick={() => deleteTeamHandel()}>
          팀 삭제하기
        </button>
        <button className="backTeamMain" onClick={() => nav(-1)}>
          돌아가기
        </button>
      </div>
    </div>
  );
};

export default EditTeam;
