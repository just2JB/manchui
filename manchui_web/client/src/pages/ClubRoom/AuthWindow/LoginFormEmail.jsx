import React from "react";
import { useOutletContext } from "react-router-dom";
import "./AuthWindow.css";

const LoginFormEmail = () => {
  const { formData, loginHandle, handleChange, nav } = useOutletContext();

  return (
    <div className="loginFormEmail formPage">
      <button
        type="button"
        className="auth-form-back"
        onClick={() => nav("/login")}
        aria-label="이전"
      >
        ← 로그인 선택으로
      </button>
      <div className="auth-form-card">
        <h2 className="auth-form-title">로그인</h2>
        <form className="auth-form login" onSubmit={loginHandle}>
          <div className="field">
            <label htmlFor="login-email">이메일</label>
            <input
              id="login-email"
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
            <label htmlFor="login-password">비밀번호</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={formData.password}
              required
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="auth-submit">
            로그인
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginFormEmail;
