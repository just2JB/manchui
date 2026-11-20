import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import "./AdminLayout.css";
import "../ClubRoom/clubPalette.css";
import "../ClubRoom/clubLookNext.css";
import "./adminLook.css";
import { useClubTheme } from "../../hooks/useClubTheme";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = () => {
  const { user } = useAuth();
  // 어시스턴트와 같은 테마 설정(다크/라이트)을 body 에 적용 → adminLook.css 팔레트가 따라감
  useClubTheme();
  // 동아리방 새 룩(clubLookNext.css)도 켜서, 같이 쓰는 예약 달력·시간 막대·시트가 예약 페이지와 똑같이 보이게
  useEffect(() => {
    document.body.dataset.clubLook = "next";
    return () => {
      delete document.body.dataset.clubLook;
    };
  }, []);

  return (
    <div className="admin-layout">
      <AdminNavbar user={user} />
      <main className="admin-layout__main">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
};

export default AdminLayout;
