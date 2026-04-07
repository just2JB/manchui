import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Mypage.css";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import axios from "axios";
import { useManchuiModal } from "../../../hooks/ManchuiModal";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const EditProfile = () => {
  const { user } = useOutletContext();
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();

  const deleteUserHandle = async () => {
    const ok = await manchuiModal("정말로 삭제하시겠습니까", "confirm");
    if (!ok) return;
    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/delete/${user._id}`,
        {},
        { withCredentials: true },
      );
      localStorage.removeItem("token");
      await manchuiModal(response.data.message);
      nav("/club");
    } catch (error) {
      await manchuiModal(error.response?.data?.message ?? "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="mypage editProfile">
      <div className="profil">
        <div className="userImage" />
        <div className="username">{user?.username}</div>
        <div className="userInfo">
          <div className="userName">{user?.Identification}</div>
          <div className="infoCircle" />
          <div className="userPosition">만취 {user?.position}</div>
        </div>
      </div>
      <div className="list">
        <div
          className="changeName"
          onClick={() => nav("/club/mypage/username")}
          role="presentation"
        >
          이름 <MdOutlineKeyboardArrowRight className="arrowRight" />
        </div>
        <div
          className="changeIdentification"
          onClick={() => nav("/club/mypage/Identification")}
          role="presentation"
        >
          아이디 <MdOutlineKeyboardArrowRight className="arrowRight" />
        </div>
        <div
          className="changePassword"
          onClick={() => nav("/club/mypage/password")}
          role="presentation"
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

export default EditProfile;
