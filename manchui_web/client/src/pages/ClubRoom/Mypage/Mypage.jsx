import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Mypage.css";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;
import { useManchuiModal } from "../../../hooks/ManchuiModal";

const Mypage = () => {
  const { user } = useOutletContext();
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();

  const deleteUserHandle = async () => {
    if (manchuiModal("정말로 삭제하시겠습니까", "confirm")) {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/delete/${user._id}`,
          {},
          { withCredentials: true },
        );
        localStorage.removeItem("token");
        manchuiModal(response.data.message);
        nav("/club");
      } catch (error) {
        manchuiModal(error.response.data.message);
      }
    }
  };
  return (
    <div className="mypage">
      <div className="profil">
        <div className="userImage"></div>
        <div className="username">{user?.username}</div>
        <div className="userInfo">
          <div className="userName">{user?.Identification}</div>
          <div className="infoCircle"></div>
          <div className="userPosition">만취 {user?.position}</div>
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
