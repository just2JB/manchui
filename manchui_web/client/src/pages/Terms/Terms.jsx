import React from "react";
import { Link } from "react-router-dom";
import "./Terms.css";

/** 이용약관 페이지 — 내용은 추후 보강 */
const Terms = () => {
  return (
    <div className="terms-page">
      <h1>이용약관</h1>
      <p className="terms-lead">
        이용약관 문구는 준비 중입니다. 문의는 동아리 운영진에게 연락해 주세요.
      </p>
      <Link to="/" className="terms-back">
        홈으로
      </Link>
    </div>
  );
};

export default Terms;
