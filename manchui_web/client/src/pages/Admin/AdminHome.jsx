import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import "./AdminHome.css";

const AdminHome = () => {
  const { user } = useOutletContext();

  return (
    <div className="adminHome">
      <div className="adminTopMenu">
        <Link className="linkClubRoom" to="/club">
          동아리방으로
        </Link>
        <div className="title">관리자 페이지</div>
        <div className="info">{user.username}</div>
      </div>

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
