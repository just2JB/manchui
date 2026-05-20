import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import "./AdminLayout.css";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = () => {
  const { user } = useAuth();

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
