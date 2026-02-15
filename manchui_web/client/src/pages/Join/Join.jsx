import React from "react";
import "./Join.css";
import { useNavigate } from "react-router-dom";

const Join = () => {
  const nav = useNavigate();

  return (
    <div className="join">
      <div className="joinInner">
        <h1 className="joinTitle">가입하기</h1>
        <p className="joinDesc">가입 신청 또는 신청 내역을 확인하세요.</p>
        <div className="joinActions">
          <button
            type="button"
            className="joinBtn joinBtnPrimary"
            onClick={() => nav("/join/form")}
          >
            <span className="joinBtnLabel">가입 하기</span>
            <span className="joinBtnSub">새로 가입 신청하기</span>
          </button>
          <button
            type="button"
            className="joinBtn joinBtnSecondary"
            onClick={() => nav("/join/check")}
          >
            <span className="joinBtnLabel">가입 확인</span>
            <span className="joinBtnSub">학번으로 신청 내역 확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Join;
