import React, { useEffect, useState } from "react";
import "./EditTeam.css";
import axios from "axios";
import { useParams } from "react-router-dom";
const serverUrl = import.meta.env.VITE_SERVER_URL;
const EditTeam = () => {
  const [team, setTeam] = useState({
    name: "",
    members: [],
    requestSchedules: [],
  });
  const parmas = useParams();

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
      const response = await axios.post(`${serverUrl}/api/team/delete-goal`, {
        teamId: team._id,
        goalId: goalId,
      });
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

  useEffect(() => {
    getMyTeams();
  }, []);

  return (
    <div className="editTeam">
      <div className="teamName">
        <input
          placeholder={team.name}
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => onChangeHandle(e)}
        />
        <button>변경하기</button>
      </div>
      <div className="teamColor">
        <input type="color" name="color" />
        <button>변경하기</button>
      </div>

      <div className="goalAdd">
        <div className="goalList">
          {team.goals
            ? team.goals.map((item) => (
                <div className="goal" key={item._id}>
                  <div className="goalName">{item.name}</div>
                  <div className="goalDate">{item.date}</div>
                  <button
                    className="deleteGoal"
                    onClick={() => deleteGoalHandle(item._id)}
                  >
                    삭제
                  </button>
                </div>
              ))
            : ""}
        </div>
        <input
          type="text"
          name="dayName"
          value={formData.dayName}
          onChange={(e) => onChangeHandle(e)}
        />
        <input
          type="date"
          name="dayDate"
          value={formData.dayDate}
          onChange={(e) => onChangeHandle(e)}
        />
        <button onClick={() => addGoal()}>추가하기</button>
      </div>

      <div className="temeMemberManage">
        <div className="memberList">
          {team
            ? team.members.map((member) => (
                <div className="member" key={member._id}>
                  <div className="memberId">{member.Identification}</div>
                  <div className="memberName">{member.username}</div>
                  <button className="changeLeaderButton">리더로 변경</button>
                  <button className="quitMemberButton">팀에서 탈퇴</button>
                </div>
              ))
            : ""}
        </div>
      </div>

      <div className="deleteTeam">
        <button
          className="delete menuContent"
          onClick={() => deleteTeamHandel()}
        >
          팀 삭제하기
        </button>
      </div>
    </div>
  );
};

export default EditTeam;
