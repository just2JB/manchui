import React, { useState } from "react";
import "./AuthWindow.css";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const AuthWindow = ({ setUser, setAuthIsOpen, setIsLogin }) => {
  const [loading, setLoading] = useState(false);
  const [currentWork, setCurrentWork] = useState("login");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordCheck: "",
    username: "",
    clubcode: "",
    Identification: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (e.target.className === "login") {
      setFormData({ email: formData.email, password: formData.password });
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/login`,
          formData,
          { withCredentials: true }
        );
        if (response.data.user) {
          setIsLogin(true);
          setUser(response.data.user);
          return setAuthIsOpen(false);
        } else {
          return alert(response.data.message);
        }
      } catch (error) {
        console.log(error.response.data.message);
        setErrorMessage("비밀번호가 틀렸거나, 존재하지 않는 계정입니다.");
      } finally {
        setLoading(false);
      }
    } else if (e.target.className === "signup") {
      console.log(formData);
      if (formData.password !== formData.passwordCheck) {
        return setErrorMessage("비밀번호가 일치하지 않습니다.");
      }
      if (formData.clubcode != 10007) {
        return setErrorMessage("동아리방 비밀번호가 틀렸습니다.");
      }
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/signup`,
          formData
        );
        if (response.status === 201) {
          alert("계정 생성이 성공 되었습니다.");
          setFormData({ email: formData.email, password: "" });
          setCurrentWork("login");
        }
      } catch (error) {
        setErrorMessage(error.response.data.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-window">
      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}
      <div className="form-div">
        <div className="top">
          <h2>{currentWork === "login" ? "로그인" : "계정생성"}</h2>
          <button className="close" onClick={() => setAuthIsOpen(false)}>
            창닫기
          </button>
        </div>
        {currentWork === "login" ? (
          <form className="login" onSubmit={handleSubmit}>
            <div className="email">
              <label>이메일</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                required
                onChange={handleChange}
              />
            </div>
            <div className="password">
              <label>비밀번호</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                required
                onChange={handleChange}
              />
            </div>
            <button type="submit">로그인</button>
          </form>
        ) : (
          <form className="signup" onSubmit={handleSubmit}>
            <div className="email">
              <label>이메일</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                required
                onChange={handleChange}
              />
            </div>
            <div className="Identification">
              <label>아이디</label>
              <input
                type="Identification"
                name="Identification"
                value={formData.Identification}
                required
                onChange={handleChange}
              />
            </div>
            <div className="password">
              <label>비밀번호</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                required
                onChange={handleChange}
              />
            </div>
            <div className="password-check">
              <label>비밀번호 확인</label>
              <input
                type="password"
                name="passwordCheck"
                value={formData.passwordCheck}
                required
                onChange={handleChange}
              />
            </div>
            <div className="username">
              <label>이름</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                required
                onChange={handleChange}
              />
            </div>
            <div className="clubcode">
              <label>동아리방 비밀번호</label>
              <input
                type="text"
                name="clubcode"
                value={formData.clubcode}
                required
                onChange={handleChange}
              />
            </div>
            <button type="submit">계정 생성</button>
          </form>
        )}
        <div className="error">{errorMessage}</div>
        <div className="bottom">
          {currentWork === "login" ? (
            <>
              계정 만들러 가기
              <button
                className="toSignup"
                onClick={() => setCurrentWork("signup")}
              >
                계정생성
              </button>
            </>
          ) : (
            <>
              이미계정이 있나요?
              <button
                className="toLogin"
                onClick={() => setCurrentWork("login")}
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthWindow;
//계정 생성 시 아이디 꼭 넣게 하자
