import React from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { user } = useOutletContext();

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
