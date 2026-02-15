import React, { useEffect } from "react";
import "./AuthWindow.css";
import axios from "axios";
import { useNavigate, useOutletContext } from "react-router-dom";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const AuthWindow = () => {
  const { formData, setFormData } = useOutletContext();

  const nav = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true }
        );
        if (response.data.isValid) {
          nav("/club");
          return;
        }
        return;
      } catch (error) {
      } finally {
      }
    };
    verifyToken();
  }, []);

  return (
    <div className="auth-window">
      <div className="auth-window-inner">
        <h1 className="auth-window-title">동아리방 로그인</h1>
        <p className="auth-window-desc">
          만취 동아리방에 오신 것을 환영합니다.
        </p>
        <div className="auth-window-actions">
          <button
            type="button"
            className="auth-btn auth-btn-primary"
            onClick={() => nav("/login/login-email")}
          >
            <span className="auth-btn-label">로그인</span>
            <span className="auth-btn-sub">이미 계정이 있나요?</span>
          </button>
          <button
            type="button"
            className="auth-btn auth-btn-secondary"
            onClick={() => nav("/login/signup-email")}
          >
            <span className="auth-btn-label">계정 생성</span>
            <span className="auth-btn-sub">새로 계정 만들기</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthWindow;
//계정 생성 시 아이디 꼭 넣게 하자
