import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Mypage.css";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import apiClient from "../../../api/apiClient";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { DEVELOPER_CONTACT_MODAL_MESSAGE } from "../../../constants/developerContact";
import { useAuth } from "../../../context/AuthContext";

const Mypage = () => {
  const { user, logout } = useAuth();
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();
  const isExecutive = user?.position === "임원진";

  const handleLogout = async () => {
    if (!(await manchuiModal("로그아웃 하시겠습니까?", "confirm"))) return;
    let message = "로그아웃 되었습니다.";
    try {
      const res = await apiClient.post(
        "/api/auth/logout",
        {},
        { withCredentials: true },
      );
      if (res?.data?.message) message = res.data.message;
    } catch (e) {
      console.log(e);
    } finally {
      await manchuiModal(message);
      logout();
      nav("/club");
    }
  };

  return (
    <div className="mypageHub">
      <h1 className="mypageHub__pageTitle">마이페이지</h1>

      <button
        type="button"
        className="mypageHub__infoCard"
        onClick={() => nav("/club/mypage/profile")}
      >
        <div className="mypageHub__infoCardBody">
          <div className="mypageHub__avatar" aria-hidden="true">
            <img
              className="mypageHub__avatarImg"
              src="/logos/longLogo_white.png"
              alt=""
            />
          </div>
          <div className="mypageHub__infoMain">
            <span className="mypageHub__infoName">
              {user?.username ?? "이름 없음"}
            </span>
            <div className="mypageHub__infoMeta">
              <span className="mypageHub__infoMetaItem">
                <span className="mypageHub__infoMetaLabel">아이디</span>
                <span className="mypageHub__infoMetaValue">
                  {user?.Identification ?? "—"}
                </span>
              </span>
              <span className="mypageHub__infoMetaItem">
                <span className="mypageHub__infoMetaLabel">직책</span>
                <span className="mypageHub__infoMetaValue">
                  {user?.position ? `만취 ${user.position}` : "—"}
                </span>
              </span>
            </div>
          </div>
        </div>
        <MdOutlineKeyboardArrowRight className="mypageHub__infoArrow" />
      </button>

      <section className="mypageHub__section" aria-label="추천">
        <div className="mypageHub__sectionTitle mypageHub__sectionTitle--ko">
          추천
        </div>
        <ul className="mypageHub__menuList">
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow"
              onClick={() => nav("/club/mypage/recommendations/likes")}
            >
              <span>좋아요한 추천</span>
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
              onClick={() => nav("/club/mypage/recommendations/scraps")}
            >
              <span>스크랩한 추천</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
        </ul>
      </section>

      <section className="mypageHub__section" aria-label="기타">
        <div className="mypageHub__sectionTitle mypageHub__sectionTitle--ko">
          기타
        </div>
        <ul className="mypageHub__menuList">
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow"
              onClick={() => nav("/")}
            >
              <span>홈페이지</span>
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
              onClick={() => manchuiModal(DEVELOPER_CONTACT_MODAL_MESSAGE)}
            >
              <span>개발자 문의</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
          {isExecutive ? (
            <li className="mypageHub__menuItem">
              <button
                type="button"
                className="mypageHub__menuRow"
                onClick={() => nav("/admin")}
              >
                <span>관리자 페이지</span>
                <MdOutlineKeyboardArrowRight
                  className="mypageHub__menuRowArrow"
                  aria-hidden
                />
              </button>
            </li>
          ) : null}
        </ul>
      </section>

      <footer className="mypageHub__footer">
        <div className="mypageHub__legal">
          <Link to="/privacy" className="mypageHub__legalLink">
            개인정보처리방침
          </Link>
          <span className="mypageHub__legalDot" aria-hidden="true">
            ·
          </span>
          <Link to="/terms" className="mypageHub__legalLink">
            이용약관
          </Link>
        </div>
        <button
          type="button"
          className="mypageHub__logout"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </footer>
    </div>
  );
};

export default Mypage;
