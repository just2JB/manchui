import React from "react";
import { useNavigate } from "react-router-dom";
import "./Mypage.css";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { IoPersonOutline } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useAuth } from "../../../context/AuthContext";

const EditProfile = () => {
  const { user, logout } = useAuth();
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();

  const deleteUserHandle = async () => {
    const ok = await manchuiModal("정말로 삭제하시겠습니까", "confirm");
    if (!ok) return;
    try {
      const response = await apiClient.post(
        `/api/auth/delete/${user._id}`,
        {},
        { withCredentials: true },
      );
      logout();
      await manchuiModal(response.data.message);
      nav("/club");
    } catch (error) {
      await manchuiModal(
        error.response?.data?.message ?? "삭제에 실패했습니다.",
      );
    }
  };

  return (
    <div className="mypageHub editProfile">
      <button
        type="button"
        className="mypageSaved__back"
        onClick={() => nav("/club/mypage")}
      >
        ← 마이페이지
      </button>

      <h1 className="mypageHub__pageTitle">내정보 수정</h1>

      <div className="editProfile__hero">
        <div className="editProfile__avatar" aria-hidden="true">
          <IoPersonOutline className="editProfile__avatarIcon" />
        </div>
        <h2 className="editProfile__name">
          {user?.username ?? "이름 없음"}
        </h2>
        <p className="editProfile__meta">
          <span className="editProfile__metaItem">
            {user?.Identification ?? "—"}
          </span>
          <span className="editProfile__metaDot" aria-hidden="true">
            ·
          </span>
          <span className="editProfile__metaItem">
            {user?.position ? `만취 ${user.position}` : "—"}
          </span>
        </p>
      </div>

      <section className="mypageHub__section" aria-label="계정 정보">
        <div className="mypageHub__sectionTitle mypageHub__sectionTitle--ko">
          계정
        </div>
        <ul className="mypageHub__menuList">
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow"
              onClick={() => nav("/club/mypage/username")}
            >
              <span>이름</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow"
              onClick={() => nav("/club/mypage/Identification")}
            >
              <span>아이디</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow"
              onClick={() => nav("/club/mypage/password")}
            >
              <span>비밀번호</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
        </ul>
      </section>

      <section className="mypageHub__section" aria-label="계정 삭제">
        <div className="mypageHub__sectionTitle mypageHub__sectionTitle--ko">
          위험 구역
        </div>
        <ul className="mypageHub__menuList">
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow mypageHub__menuRow--danger"
              onClick={() => void deleteUserHandle()}
            >
              <span>계정 삭제</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default EditProfile;
