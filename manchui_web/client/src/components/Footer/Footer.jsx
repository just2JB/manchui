import React from "react";
import "./Footer.css";
import { IoLogoInstagram, IoLogoYoutube } from "react-icons/io5";
import { Link } from "react-router-dom";

let footerData = {
  youtubeLink: "https://www.youtube.com/@manchui10007",
  instargramLink: "https://www.instagram.com/maaaaaaanchui/",
  location:
    "경기도 안산시 상록구 한양대학로55 한양대학교 ERICA캠퍼스 학생복지관 422호",
};

const Footer = () => {
  return (
    <>
      {location.pathname.includes("/join") && location.pathname.length > 6 ? (
        <></>
      ) : (
        <div className="footer">
          <div className="link-div">
            <div>
              <a href={footerData.youtubeLink} target="_blank">
                <IoLogoInstagram size={20} />
              </a>
              <a href={footerData.instargramLink} target="-blank">
                <IoLogoYoutube size={20} />
              </a>
            </div>
          </div>
          <div className="info">
            <p>{footerData.location}</p>
          </div>
          <div className="reservedDiv">
            <p className="reserved">
              ⓒ 2025-{new Date().getFullYear()} MANCHUI. All rights reserved.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
