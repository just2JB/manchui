import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import "./AdminHome.css";

const AdminHome = () => {
  const { user } = useOutletContext();

  return (
    <div className="adminHome">
      관리자 페이지 입니다.
      {user.position} 인증 완료
      <div className="linkBox">
        <Link className="" to="/club">
          동아리방으로
        </Link>
        <Link className="" to="/admin/join">
          가입 신청 관리
        </Link>
        <Link className="" to="/admin/contact">
          문의관리
        </Link>
        <Link className="" to="/admin/">
          부원관리
        </Link>
        <Link className="" to="/admin/setting">
          웹페이지 설정
        </Link>
      </div>
    </div>
  );
};

export default AdminHome;
