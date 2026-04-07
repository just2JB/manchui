import React from "react";
import { Link } from "react-router-dom";
import "./AdminHome.css";

const AdminHome = () => {
  return (
    <div className="adminHome">
      <p className="adminHome__lead">업무 메뉴를 선택하세요.</p>

      <div className="linkBox">
        <Link className="linkbutton" to="/admin/join">
          가입 신청 관리
        </Link>
        <Link className="linkbutton" to="/admin/contact">
          문의관리
        </Link>
        <Link className="linkbutton" to="/admin/member">
          부원관리
        </Link>
        <Link className="linkbutton" to="/admin/setting">
          웹페이지 설정
        </Link>
      </div>
    </div>
  );
};

export default AdminHome;
