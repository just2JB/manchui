import React, { useState } from "react";
import "./AuthWindow.css";
import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import { useManchuiModal } from "../../../hooks/ManchuiModal";

const AuthWindow = ({ setUser, setOpenAuthWindow }) => {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [signUpForm, setSignUpForm] = useState({
    username: "",
    Identification: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const manchuiModal = useManchuiModal();
  const dismissible = typeof setOpenAuthWindow === "function";
  const closeModal = () => setOpenAuthWindow?.(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpForm((prev) => ({ ...prev, [name]: value }));
  };

  const loginHandle = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(
        `${serverUrl}/api/auth/login`,
        {
          email: loginForm.email,
          password: loginForm.password,
        },
        { withCredentials: true },
      );
      localStorage.setItem("token", response.data.token);
      setUser?.(response.data.user);
      setOpenAuthWindow?.(false);
    } catch (error) {
      manchuiModal(error?.response?.data?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const signUpHandle = async (e) => {
    e.preventDefault();
    if (signUpForm.password !== signUpForm.confirmPassword) {
      manchuiModal("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${serverUrl}/api/auth/signup`, {
        username: signUpForm.username,
        Identification: signUpForm.Identification,
        email: signUpForm.email,
        password: signUpForm.password,
      });
      manchuiModal("회원가입이 완료되었습니다. 로그인 해주세요.");
      setIsSignUpMode(false);
      setLoginForm((prev) => ({ ...prev, email: signUpForm.email }));
      setSignUpForm({
        username: "",
        Identification: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      manchuiModal(
        error?.response?.data?.message || "회원가입에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-window"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-window-heading"
    >
      <div
        className={`auth-window__backdrop ${dismissible ? "auth-window__backdrop--dismissible" : ""}`}
        onClick={dismissible ? closeModal : undefined}
        aria-hidden="true"
      />
      <div className="auth-window__card" onClick={(e) => e.stopPropagation()}>
        <header className="auth-window__head">
          <div className="auth-window__brand" aria-hidden="true">
            MANCHUI
          </div>
          {dismissible ? (
            <button
              type="button"
              className="auth-window__close"
              onClick={closeModal}
              aria-label="닫기"
            >
              ×
            </button>
          ) : (
            <span className="auth-window__close-spacer" aria-hidden="true" />
          )}
        </header>

        <h1 id="auth-window-heading" className="auth-window__title">
          {isSignUpMode ? "회원가입" : "동아리방 로그인"}
        </h1>
        <p className="auth-window__desc">
          {isSignUpMode
            ? "만취 동아리방 계정을 만들고 서비스를 이용해 보세요."
            : "이메일과 비밀번호로 로그인하세요."}
        </p>

        {isSignUpMode ? (
          <form className="auth-form" onSubmit={signUpHandle}>
            <div className="auth-field">
              <label htmlFor="auth-username">이름</label>
              <input
                id="auth-username"
                className="auth-input"
                name="username"
                value={signUpForm.username}
                onChange={handleSignUpChange}
                placeholder="이름"
                autoComplete="name"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-id">아이디</label>
              <input
                id="auth-id"
                className="auth-input"
                name="Identification"
                value={signUpForm.Identification}
                onChange={handleSignUpChange}
                placeholder="아이디"
                autoComplete="username"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-email-su">이메일</label>
              <input
                id="auth-email-su"
                className="auth-input"
                type="email"
                name="email"
                value={signUpForm.email}
                onChange={handleSignUpChange}
                placeholder="이메일"
                autoComplete="email"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-pw-su">비밀번호</label>
              <input
                id="auth-pw-su"
                className="auth-input"
                type="password"
                name="password"
                value={signUpForm.password}
                onChange={handleSignUpChange}
                placeholder="비밀번호"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-pw2">비밀번호 확인</label>
              <input
                id="auth-pw2"
                className="auth-input"
                type="password"
                name="confirmPassword"
                value={signUpForm.confirmPassword}
                onChange={handleSignUpChange}
                placeholder="비밀번호 확인"
                autoComplete="new-password"
                required
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "처리 중…" : "회원가입"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={loginHandle}>
            <div className="auth-field">
              <label htmlFor="auth-email">이메일</label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder="이메일 주소"
                autoComplete="email"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">비밀번호</label>
              <input
                id="auth-password"
                className="auth-input"
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="비밀번호"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "만취 중…" : "로그인"}
            </button>
          </form>
        )}

        <button
          type="button"
          className="auth-switch"
          onClick={() => setIsSignUpMode((prev) => !prev)}
        >
          {isSignUpMode
            ? "이미 계정이 있나요? 로그인"
            : "계정이 없나요? 회원가입"}
        </button>
      </div>
    </div>
  );
};

export default AuthWindow;
