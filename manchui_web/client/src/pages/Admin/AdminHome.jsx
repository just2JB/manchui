import React from "react";
import { Link } from "react-router-dom";
import "./AdminHome.css";

const AdminHome = () => {
  return (
    <div className="adminHome">
      관리자 페이지 입니다.
      <div></div>
      <Link className="" to="/admin/join">
        가입 신청 관리
      </Link>
      <br></br>
      <Link className="" to="/admin/contact">
        문의관리
      </Link>
      <br></br>
      <Link className="" to="/admin/">
        부원관리
      </Link>
    </div>
  );
};

export default AdminHome;
