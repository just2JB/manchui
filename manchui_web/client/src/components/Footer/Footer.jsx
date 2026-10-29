import { useState } from "react";
import "./Footer.css";
import { IoLogoInstagram, IoLogoYoutube } from "react-icons/io5";
import { Link, useLocation } from "react-router-dom";
import { scrollWindowTopAfterNav } from "../../utils/navScroll";
import { CLUB_ROOM_ADDRESS, CLUB_ROOM_KAKAO_MAP_URL } from "../../constants/clubRoomLocation";

const footerData = {
  youtubeLink: "https://www.youtube.com/@manchui10007",
  instagramLink: "https://www.instagram.com/maaaaaaanchui/",
  developerEmail: "jb040222@naver.com",
};
const links = [{ to: "/", label: "동아리 소개" }, { to: "/join", label: "가입하기" }, { to: "/contact", label: "문의하기" }, { to: "/goods", label: "굿즈" }];

export default function Footer() {
  const location = useLocation();
  const [copyStatus, setCopyStatus] = useState("");
  const isJoinSubPage = location.pathname.includes("/join") && location.pathname.length > 6;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CLUB_ROOM_ADDRESS);
      setCopyStatus("주소를 복사했어요.");
    } catch {
      setCopyStatus("복사하지 못했어요. 아래 주소를 선택해 복사해주세요.");
    }
  };

  if (isJoinSubPage) return null;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" onClick={() => scrollWindowTopAfterNav("/", location)}>
              <img src="/logos/longLogo_white.png" alt="MANCHUI 홈" className="footer-logo-img" />
            </Link>
            <p className="footer-tagline">한양대학교 ERICA 댄스 동아리</p>
            <div className="footer-sns">
              <a href={footerData.instagramLink} target="_blank" rel="noopener noreferrer"><IoLogoInstagram size={20} aria-hidden="true" /> Instagram <span aria-hidden="true">↗</span></a>
              <a href={footerData.youtubeLink} target="_blank" rel="noopener noreferrer"><IoLogoYoutube size={20} aria-hidden="true" /> YouTube <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <nav className="footer-quick-links" aria-label="푸터 바로가기">
            {links.map(({to, label}) => <Link key={to} to={to} onClick={() => scrollWindowTopAfterNav(to, location)}>{label}<span aria-hidden="true">↗</span></Link>)}
          </nav>
        </div>
        <div className="footer-info">
          <div>
            <p className="footer-info-title">동아리 방</p>
            <p className="footer-location">{CLUB_ROOM_ADDRESS}</p>
            <div className="footer-location-actions">
              <a href={CLUB_ROOM_KAKAO_MAP_URL} target="_blank" rel="noopener noreferrer">지도에서 보기 ↗</a>
              <button type="button" onClick={copyAddress}>주소 복사</button>
            </div>
            <p className="footer-status" role="status">{copyStatus}</p>
          </div>
          <div className="footer-contact">
            <p>동아리 문의 <a href={footerData.instagramLink} target="_blank" rel="noopener noreferrer">인스타그램 DM ↗</a></p>
            <p>개발자 연락처 <a href={`mailto:${footerData.developerEmail}`}>{footerData.developerEmail}</a></p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025–{new Date().getFullYear()} MANCHUI. All rights reserved.</p>
          <Link to="/privacy" onClick={() => scrollWindowTopAfterNav("/privacy", location)}>개인정보 처리방침</Link>
          <button type="button" className="footer-top-button" onClick={() => {
            window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
            document.querySelector(".navbar a, .navbar button")?.focus({ preventScroll: true });
          }}>맨 위로 <span aria-hidden="true">↑</span></button>
        </div>
      </div>
    </footer>
  );
}
