import React, { useState } from "react";
import "./AuthWindow.css";

const AuthWindow = ({ setAuthIsOpen }) => {
  const [currentWork, setCurrentWork] = useState("login");
  return (
    <div className="auth-window">
      <div className="form-div">
        <div className="top">
          <h2>{currentWork === "login" ? "로그인" : "계정생성"}</h2>
          <button className="close" onClick={() => setAuthIsOpen(false)}>
            x
          </button>
        </div>
        {currentWork === "login" ? (
          <form className="login">
            <div className="userid">
              <label>아이디</label>
              <input type="text" required />
            </div>
            <div className="password">
              <label>비밀번호</label>
              <input type="password" required />
            </div>

            <button className="login-button">로그인</button>
          </form>
        ) : (
          <form className="signup">
            <div className="userid">
              <label>아이디</label>
              <input type="text" required />
            </div>
            <div className="username">
              <label>이름</label>
              <input type="text" required />
            </div>
            <div className="email">
              <label>이메일</label>
              <input type="email" required />
            </div>
            <div className="password">
              <label>비밀번호</label>
              <input type="password" required />
            </div>
            <div className="password-check">
              <label>비밀번호 확인</label>
              <input type="password" required />
            </div>
            <button className="signup-button">계정생성</button>
          </form>
        )}
        <div className="bottom">
          로그인 하러가기
          <button className="toLogin" onClick={() => setCurrentWork("login")}>
            로그인
          </button>
          계정이 없나요?
          <button className="toSignup" onClick={() => setCurrentWork("signup")}>
            계정생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthWindow;
