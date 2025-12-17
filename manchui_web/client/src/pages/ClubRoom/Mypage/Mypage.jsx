import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Mypage.css";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import axios from "axios";
import Loading from "../../../components/Loading/Loading";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const Mypage = () => {
  const { user, setIsLogin } = useOutletContext();
  const [formData, setFormData] = useState({
    username: "",
    Identification: "",
    password: "",
    changePassword: "",
    checkPassword: "",
  });
  const [selectedForm, setSelectedForm] = useState("unSelcet");
  const nav = useNavigate();
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

  const deleteUserHandle = async () => {
    if (confirm("정말로 삭제하시겠습니까")) {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/delete/${user._id}`,
          {},
          { withCredentials: true }
        );
        alert(response.data.message);
        nav("/club");
        setIsLogin(false);
      } catch (error) {
        alert(error.response.data.message);
      } finally {
      }
      setIsLogin(false);
    }
  };
  return (
    <div className="mypage">
      <div className="profil">
        <div className="userImage"></div>
        <div className="username">{user.username}</div>
        <div className="userInfo">
          <div className="userName">{user.Identification}</div>
          <div className="infoCircle"></div>
          <div className="userPosition">만취 {user.position}</div>
        </div>
      </div>
      <div className="list">
        <div
          className="changeName"
          onClick={() => nav("/club/mypage/:username")}
        >
          이름 <MdOutlineKeyboardArrowRight className="arrowRight" />
        </div>
        <div
          className="changeIdentification"
          onClick={() => nav("/club/mypage/:Identification")}
        >
          아이디 <MdOutlineKeyboardArrowRight className="arrowRight" />
        </div>
        <div
          className="changePassword"
          onClick={() => nav("/club/mypage/:password")}
        >
          비밀번호 <MdOutlineKeyboardArrowRight className="arrowRight" />
        </div>
        <div className="deleteAccount" onClick={() => deleteUserHandle()}>
          계정 삭제 <MdOutlineKeyboardArrowRight className="arrowRight" />
        </div>
      </div>
    </div>
  );
};

export default Mypage;
