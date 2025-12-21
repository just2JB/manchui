import React from "react";
import "./AdminSetting.css";
const clientURL = import.meta.env.VITE_CLIENT_URL;

const AdminSetting = () => {
  return (
    <div>
      <div className="joinSetting">
       
        <button className="openJoin">웹 가입신청 폼 활성화</button>
        <button className="closeJoin">웹 가입신청 폼 비활성회</button>
      </div>
    </div>
  );
};

export default AdminSetting;
