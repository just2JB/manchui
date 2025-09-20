import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./Mypage.css";

const Mypage = () => {
  const { user } = useOutletContext();
  const [formData, setFormData] = useState({
    username: "",
    aka: "",
    password: "",
    changePassword: "",
    checkPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <div className="mypage">
      <form className="changeInfo">
        <div className="email">
          <label>이메일</label>
          <input type="email" name="email" value={user.email} disabled />
        </div>
        <div className="username">
          <label>이름</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            placeholder={user.username}
            onChange={handleChange}
          />
        </div>
        <div className="aka">
          <label>별명</label>
          <input
            type="text"
            name="aka"
            value={formData.aka}
            placeholder={user.aka}
            onChange={handleChange}
          />
        </div>
        <button type="submit">정보 수정</button>
      </form>
      <form className="changePassword">
        <div className="password">
          <label>현재 비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            required
            onChange={handleChange}
          />
        </div>
        <div className="password">
          <label>변경할 비밀번호</label>
          <input
            type="password"
            name="changePassword"
            value={formData.changePassword}
            required
            onChange={handleChange}
          />
        </div>
        <div className="password-check">
          <label>비밀번호 확인</label>
          <input
            type="password"
            name="checkPassword"
            value={formData.checkPassword}
            required
            onChange={handleChange}
          />
        </div>
        <button type="submit">비밀번호 변경</button>
      </form>
    </div>
  );
};

export default Mypage;
