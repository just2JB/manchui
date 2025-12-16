import React from "react";
import "./Join.css";
import { useNavigate } from "react-router-dom";

const Join = () => {
  const nav = useNavigate();

  return (
    <div className="start">
      <div className="slectWork">
        <div className="joinFormBtn" onClick={() => nav("/join/name")}>
          가입 하기
        </div>
        <div className="joinFormBtn" onClick={() => nav("/join/check")}>
          가입 확인
        </div>
        
      </div>
    </div>
  );
};

export default Join;
