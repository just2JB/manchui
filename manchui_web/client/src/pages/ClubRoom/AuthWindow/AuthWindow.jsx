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
      <>
        이미계정이 있나요?
        <button className="toLogin" onClick={() => nav("/login/login-email")}>
          로그인
        </button>
      </>
      <>
        계정 만들러 가기
        <button className="toSignup" onClick={() => nav("/login/signup-email")}>
          계정생성
        </button>
      </>
    </div>
  );
};

export default AuthWindow;
//계정 생성 시 아이디 꼭 넣게 하자
