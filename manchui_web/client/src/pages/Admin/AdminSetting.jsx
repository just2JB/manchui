import React from "react";
import "./AdminSetting.css";
const clientURL = import.meta.env.VITE_CLIENT_URL;

const AdminSetting = () => {
  return (
    <div>
      <div className="joinSetting">
        <iframe
          className="joinFrame"
          title="joinForm"
          src={`${clientURL}/join`}
          width="400"
          height="300"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
        >
          로드 중…
        </iframe>
        <button className="openJoin">웹 가입신청 폼 활성화</button>
        <button className="closeJoin">웹 가입신청 폼 비활성회</button>
      </div>
    </div>
  );
};

export default AdminSetting;
