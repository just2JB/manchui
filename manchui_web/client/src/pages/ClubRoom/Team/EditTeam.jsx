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
  const [formData, setFormData] = useState({
    dayDate: new Date().toISOString().split("T")[0],
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

      <div className="dayAdd">
        <div className="goalList">
          {team.goals
            ? team.goals.map((item) => (
                <div className="goal" key={item}>
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
          value={formData.dayDate || new Date().toISOString().split("T")[0]}
          onChange={(e) => onChangeHandle(e)}
        />
        <button onClick={() => addGoal()}>추가하기</button>
      </div>
    </div>
  );
};

export default EditTeam;
/*
1. 이름 바꾸기
2. 리더 바꾸기
3. 팀 목표 설정하기
4. 설명 바꾸기
5. 멤버 관리
6. 팀 제거
*/
