import React from "react";
import { useOutletContext } from "react-router-dom";

const SignUpEmail = () => {
  const { formData, handleChange, signUpHandle, nav } = useOutletContext();

  const handleSubmit = () => {
    nav("/login");
  };
  return (
    <div className="signUpEmail formPage">
      <form className="signup" onSubmit={signUpHandle}>
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
    </div>
  );
};

export default SignUpEmail;
