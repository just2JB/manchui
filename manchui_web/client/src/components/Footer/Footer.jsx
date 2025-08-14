import React from "react";
import "./Footer.css";
import { IoLogoInstagram, IoLogoYoutube } from "react-icons/io5";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className="footer">
      <div className="link-div">
        <a href="https://www.instagram.com/maaaaaaanchui/" target="_blank">
          <IoLogoInstagram size={20} />
        </a>
        <a href="https://www.youtube.com/@manchui10007" target="-blank">
          <IoLogoYoutube size={20} />
        </a>
        <Link>가입 하기</Link>
      </div>

      <div className="info">
        <p>
          Dance Crew. <span className="span-red">MANCHUI</span>
        </p>
        <p>
          경기도 안산시 상록구 한양대학로 55, 한양대학교 ERICA캠퍼스 학생복지관
          ~~~호
        </p>
        <p>jb040222@hanyang.ac.kr</p>
      </div>

      <div className="footer-logo">
        <a className="logo" href="/">
          <img src="/logos/shortLogo.png" alt="Logo" className="short-logo" />
        </a>
        <p className="reserved">ⓒ 2025 MANCHUI. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
