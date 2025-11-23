import React, { useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import "./Mypage.css";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const Mypage = () => {
  const { user } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    Identification: "",
    password: "",
    changePassword: "",
    checkPassword: "",
  });
  const parmas = useParams();
  const nav = useNavigate();
  const [selectedForm, setSelectedForm] = useState(parmas.data.slice(1));

  const handleChange = (e) => {
    if (selectedForm === "Identification") {
      setFormData({
        ...formData,
        [e.target.name]: "@" + e.target.value.split("@").join(""),
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const submitHandle = async (e) => {
    e.preventDefault();
    setLoading(true);
    const reqData = {
      formData: formData,
      userId: user._id,
    };
    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/edit/${selectedForm}`,
        reqData,
        { withCredentials: true }
      );
      alert(response.data.message);
      nav("/club");
    } catch (error) {
      alert(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="editUser">
      <form className="popForm" onSubmit={(e) => submitHandle(e)}>
        <div>
          <div className="formTop"></div>
          <div className="formHead">
            {selectedForm === "username"
              ? "이름 수정"
              : selectedForm === "Identification"
              ? "아이디 수정"
              : selectedForm === "password"
              ? "비밀번호 수정"
              : "잘못된 접근입니다"}
          </div>
          <div className="formExplanation">
            {selectedForm === "username"
              ? "만취 동아리방에서 사용될 이름입니다 본명을 사용해주세요"
              : selectedForm === "Identification"
              ? "만취 동아리방에서 사용될 아이디 입니다."
              : selectedForm === "password"
              ? ""
              : "잘못된 접근입니다"}
          </div>
          <div className="formInputBox">
            <div className="formInputText">
              {selectedForm === "username"
                ? "이름"
                : selectedForm === "Identification"
                ? "아이디"
                : selectedForm === "password"
                ? "비밀번호"
                : "잘못된 접근입니다"}
            </div>
            <input
              className="formInput"
              type={`${selectedForm === "password" ? "password" : "text"}`}
              name={selectedForm}
              value={formData[selectedForm]}
              placeholder={user[selectedForm]}
              onChange={(e) => handleChange(e)}
            />
            <div className="inputState"></div>
          </div>
          {selectedForm === "password" ? (
            <div className="formInputBox">
              <div className="formInputText">새로운 비밀번호</div>
              <input
                type="password"
                className="formInput"
                name="changePassword"
                value={formData.changePassword}
                onChange={(e) => handleChange(e)}
              />
              <div className="inputState"></div>
            </div>
          ) : (
            ""
          )}
          {selectedForm === "password" ? (
            <div className="formInputBox">
              <div className="formInputText">비밀번호 확인</div>
              <input
                type="password"
                className="formInput"
                name="checkPassword"
                value={formData.checkPassword}
                onChange={(e) => handleChange(e)}
              />
              <div className="inputState"></div>
            </div>
          ) : (
            ""
          )}
        </div>
        <button className="submitButton" type="submit">
          완료
        </button>
      </form>
      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Mypage;
