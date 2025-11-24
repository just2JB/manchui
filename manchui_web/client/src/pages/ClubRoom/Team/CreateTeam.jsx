import React from "react";
import "./CreateTeam.css";
import { useState } from "react";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useOutletContext, useNavigate } from "react-router-dom";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import "./TeamCalender.css";
const CreateTeam = () => {
  const [teamData, setTeamData] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useOutletContext();
  const nav = useNavigate();
  const handleChange = (e) => {
    setTeamData({
      ...teamData,
      [e.target.name]: e.target.value,
    });
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (teamData.name) {
      const resData = { ...teamData, userId: user._id };
      try {
        const response = await axios.post(
          `${serverUrl}/api/team/create`,
          resData,
          { withCredentials: true }
        );
        if (response.status === 201) {
          alert("팀 생성이 성공 되었습니다.");
          nav("/club/team");
        }
      } catch (error) {
        alert("서버 에러입니다.");
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <div className="createTeam">
      <form onSubmit={(e) => handleCreate(e)} className="createTeamForm">
        <div className="formTop">
          <div className="formHead">팀 만들기</div>
          <div className="formExplanation">연습일정 쉽게 맞추기</div>
          <div className="inputBox teamName">
            <div className="inputText">팀 이름</div>
            <input
              className="formInput"
              name="name"
              onChange={(e) => handleChange(e)}
            />
          </div>
          <div className="inputBox teamName">
            <div className="inputText comment">설명</div>
            <input
              className="formInput"
              name="comment"
              onChange={(e) => handleChange(e)}
            />
          </div>
          <div className="memberSection">
            
          </div>
        </div>
        <button className="submitButton" type="submit">
          만들기
        </button>
      </form>
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

export default CreateTeam;
