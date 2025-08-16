import React, { useState } from "react";
import AuthWindow from "./AuthWindow/AuthWindow";
import "./ClubRoom.css";

const ClubRoom = () => {
  const [authIsOpen, setAuthIsOpen] = useState(true);

  return (
    <div className="club-room">
      {authIsOpen ? <AuthWindow setAuthIsOpen={setAuthIsOpen} /> : <></>}
      <div className="my-info">
        <div className="profil">프로필이야</div>
        <div className="status">내 상태야</div>
      </div>
      <div className="menu">
        <div className="reservation">예약하기</div>
        <div className="practice">연습</div>
        <div className=""></div>
      </div>
    </div>
  );
};

export default ClubRoom;
