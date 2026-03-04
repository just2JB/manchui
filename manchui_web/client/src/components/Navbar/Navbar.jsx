import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoChevronDownSharp } from "react-icons/io5";

import "./Navbar.css";

const ALL_PAGES = [
  { name: "홈", path: "/" },
  { name: "가입", path: "/join" },
  { name: "문의", path: "/contact" },
  { name: "굿즈", path: "/goods" },
];
/** siteRestricted일 때는 가입만 표시 */
const RESTRICTED_PAGES = [{ name: "가입", path: "/join" }];

function toTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const Navbar = ({ siteRestricted = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const nav = useNavigate();

  const handleScroll = () => {
    const isAtTop = window.scrollY < 10;
    setScrolled(!isAtTop);
  };
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pages = siteRestricted ? RESTRICTED_PAGES : ALL_PAGES;

  return (
    <div className="navbar">
      <div
        className="navbar-top"
        style={{
          top:
            location.pathname.includes("/join") && location.pathname.length > 6
              ? "-80px"
              : "0px",
          backgroundColor: scrolled ? "#121212" : "transparent",
        }}
      >
        <div className="desktop">
          <div className="logoBox">
            <div className="shortLogo">
              <img src="/logos/shortLogo.png" alt="Logo" className="menuLogo" />
            </div>
          </div>
          <div className="menu">
            {pages.map((page) => (
              <div key={page} className="linkBox">
                <Link
                  className="link"
                  to={page.path}
                  style={{
                    color: location.pathname === page.path ? "#ffffff" : "",
                  }}
                  onClick={() => toTop()}
                >
                  {page.name}
                </Link>
              </div>
            ))}
          </div>
          <div className="loginButtonBox">
            <button className="loginButton" onClick={() => nav("/login")}>
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
