import React from "react";
import "./Footer.css";
import { IoLogoInstagram, IoLogoYoutube } from "react-icons/io5";
import { Link, useLocation } from "react-router-dom";

const footerData = {
  youtubeLink: "https://www.youtube.com/@manchui10007",
  instagramLink: "https://www.instagram.com/maaaaaaanchui/",
  location:
    "경기도 안산시 상록구 한양대학로55 한양대학교 ERICA캠퍼스 학생복지관 422호",
  tagline: "한양대학교 ERICA 캠퍼스 댄스 동아리",
};

const Footer = () => {
  const location = useLocation();
  const isJoinSubPage =
    location.pathname.includes("/join") && location.pathname.length > 6;

  if (isJoinSubPage) return null;

  return (
    <footer className="footer">
      <div className="footer-top">
        <Link to="/" className="footer-logo">
          <img
            src="/logos/shortLogo.png"
            alt="MANCHUI"
            className="footer-logo-img"
          />
        </Link>
        <p className="footer-tagline">{footerData.tagline}</p>

        <nav className="footer-quick-links">
          <Link to="/">동아리 소개</Link>
          <span className="footer-dot" aria-hidden="true" />
          <Link to="/join">지원하기</Link>
          <span className="footer-dot" aria-hidden="true" />
          <Link to="/contact">문의하기</Link>
        </nav>

        <div className="footer-sns">
          <a
            href={footerData.instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MANCHUI 인스타그램"
          >
            <IoLogoInstagram size={22} />
          </a>
          <a
            href={footerData.youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MANCHUI 유튜브"
          >
            <IoLogoYoutube size={22} />
          </a>
        </div>
      </div>

      <div className="footer-info">
        <p className="footer-location">{footerData.location}</p>
        <p className="footer-contact">
          문의:{" "}
          <a
            href={footerData.instagramLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            인스타그램 DM
          </a>
        </p>
      </div>

      <div className="footer-bottom">
        <p className="footer-reserved">
          ⓒ 2025–{new Date().getFullYear()} MANCHUI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
