import React from "react";
import "./CreateTeam.css";
import { useState } from "react";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
import { useOutletContext, useNavigate } from "react-router-dom";
const serverUrl = import.meta.env.VITE_SERVER_URL;

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
          nav("/club/practice");
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
        <label>팀 이름</label>
        <div className="inputBox">
          <input name="name" onChange={(e) => handleChange(e)} />
          <button type="submit">만들기</button>
        </div>
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
