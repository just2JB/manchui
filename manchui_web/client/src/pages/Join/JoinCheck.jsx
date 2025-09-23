import React, { useState } from "react";
import "./JoinCheck.css";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const JoinCheck = () => {
  const [formData, setFormData] = useState("");
  const [findData, setFindData] = useState({ name: "" });
  const handleChange = (e) => {
    setFormData(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/join/check/${formData}`,
        {
          withCredentials: true,
        }
      );
      setFindData(response.data.join);
      alert(response.data.message);
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <div className="joinCheck">
      <div className="text">학번(10자리)을 입력해주세요</div>
      <span className="subText">ex) {new Date().getFullYear()}123456</span>
      <input
        type="text"
        name="studentId"
        value={formData.studentId}
        required
        onChange={handleChange}
      />
      <button onClick={handleSubmit}>확인하기</button>
      <div>이름: {findData.name}</div>
      <div>학과: {findData.major}</div>
      <div>신청 날짜: {new Date(findData.applyAt).toLocaleString()}</div>
    </div>
  );
};

export default JoinCheck;
