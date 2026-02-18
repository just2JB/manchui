import React from "react";
import { useOutletContext, Link } from "react-router-dom";
import "./AuthWindow.css";

const SignUpEmail = () => {
  const { formData, handleChange, signUpHandle, nav } = useOutletContext();

  return (
    <div className="signUpEmail formPage">
      <div className="auth-form-nav">
        <button
          type="button"
          className="auth-form-back"
          onClick={() => nav("/login")}
          aria-label="이전"
        >
          ← 로그인 선택으로
        </button>
        <Link to="/" className="auth-form-home">
          홈페이지로
        </Link>
      </div>
      <div className="auth-form-card">
        <h2 className="auth-form-title">계정 생성</h2>
        <form className="auth-form signup" onSubmit={signUpHandle}>
          <div className="field">
            <label htmlFor="signup-email">이메일</label>
            <input
              id="signup-email"
              type="email"
              name="email"
              value={formData.email}
              required
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="signup-identification">아이디</label>
            <input
              id="signup-identification"
              type="text"
              name="Identification"
              value={formData.Identification}
              required
              onChange={handleChange}
              placeholder="사용할 아이디를 입력하세요"
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="signup-password">비밀번호</label>
            <input
              id="signup-password"
              type="password"
              name="password"
              value={formData.password}
              required
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="signup-passwordCheck">비밀번호 확인</label>
            <input
              id="signup-passwordCheck"
              type="password"
              name="passwordCheck"
              value={formData.passwordCheck}
              required
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="signup-username">이름</label>
            <input
              id="signup-username"
              type="text"
              name="username"
              value={formData.username}
              required
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="signup-clubcode">동아리방 비밀번호</label>
            <input
              id="signup-clubcode"
              type="text"
              name="clubcode"
              value={formData.clubcode}
              required
              onChange={handleChange}
              placeholder="동아리방 비밀번호를 입력하세요"
            />
          </div>
          <button type="submit" className="auth-submit">
            계정 생성
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpEmail;
