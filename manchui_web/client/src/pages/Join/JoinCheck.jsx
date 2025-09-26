import React, { useState } from "react";
import "./JoinCheck.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import { useRef } from "react";
import { useEffect } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const JoinCheck = () => {
  const [formData, setFormData] = useState("");
  const [findData, setFindData] = useState();
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const studentIdRef = useRef();
  const backRef = useRef();
  useEffect(() => {
    studentIdRef.current.focus();
  }, []);

  const handleChange = (e) => {
    setFindData();
    setFormData(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.get(
        `${serverUrl}/api/join/check/${formData}`,
        {
          withCredentials: true,
        }
      );
      setFindData(response.data.join);
    } catch (error) {
      alert(error.response.data.message);
      setFindData();
    } finally {
      setLoading(false);
      backRef.current.focus();
    }
  };

  return (
    <div className="joinCheck">
      <form className="inputForm" onSubmit={handleSubmit}>
        <div className="text">학번(10자리)을 입력해주세요</div>
        <span className="subText">ex) {new Date().getFullYear()}123456</span>
        <input
          type="text"
          name="studentId"
          value={formData.studentId}
          ref={studentIdRef}
          required
          onChange={handleChange}
        />
        {findData ? (
          <div className="check">
            <div>이름: {findData.name}</div>
            <div>학과: {findData.major}</div>
            <div>신청 날짜: {new Date(findData.applyAt).toLocaleString()}</div>
          </div>
        ) : (
          ""
        )}

        <div className={`buttonBox ${findData ? "finded" : ""}`}>
          <button className="submit" onClick={handleSubmit}>
            확인하기
          </button>
          <button className="submit" ref={backRef} onClick={() => nav("/join")}>
            돌아가기
          </button>
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

export default JoinCheck;
