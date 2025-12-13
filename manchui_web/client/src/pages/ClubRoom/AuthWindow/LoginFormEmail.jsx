import React from "react";
import { useOutletContext } from "react-router-dom";

const LoginFormEmail = () => {
  const { formData, loginHandle, handleChange, nav } = useOutletContext();

  const handleSubmit = () => {
    nav("/login");
  };
  return (
    <div className="loginFormEmail formPage">
      <form className="login" onSubmit={loginHandle}>
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
    </div>
  );
};

export default LoginFormEmail;
