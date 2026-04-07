import React from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import "./Mypage.css";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import axios from "axios";
import { useManchuiModal } from "../../../hooks/ManchuiModal";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const Mypage = () => {
  const { user } = useOutletContext();
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();

  const handleLogout = async () => {
    if (!(await manchuiModal("로그아웃 하시겠습니까?", "confirm"))) return;
    let message = "로그아웃 되었습니다.";
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
      if (res?.data?.message) message = res.data.message;
    } catch (e) {
      console.log(e);
    } finally {
      await manchuiModal(message);
      localStorage.removeItem("token");
      nav("/club");
    }
  };

  return (
    <div className="mypageHub">
      <button
        type="button"
        className="mypageHub__infoCard"
        onClick={() => nav("/club/mypage/profile")}
      >
        <div className="mypageHub__infoMain">
          <span className="mypageHub__infoTitle">내 정보</span>
          {user?.username ? (
            <span className="mypageHub__infoSub">{user.username}</span>
          ) : null}
        </div>
        <MdOutlineKeyboardArrowRight className="mypageHub__infoArrow" />
      </button>

      <section className="mypageHub__section" aria-label="메뉴">
        <div className="mypageHub__sectionTitle">메뉴</div>
        <ul className="mypageHub__menuList">
          <li className="mypageHub__menuItem mypageHub__menuItem--muted">
            추가 메뉴는 추후 연결 예정입니다.
          </li>
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
