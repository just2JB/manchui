import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { IoMdMenu, IoMdClose } from "react-icons/io";
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
  const [mobileMenu, setMobileMenu] = useState(false);
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

  const clickMobileLink = () => {
    toTop();
    setMobileMenu(false);
  };

  return (
    <div className="navbar">
      <div
        className={`navbar-top ${scrolled ? "navbar-top--scrolled" : ""}`}
        style={{
          top:
            location.pathname.includes("/join") && location.pathname.length > 6
              ? "-80px"
              : "0px",
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
              <div key={page.path} className="linkBox">
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
        <div className="mobile">
          <div></div>
          <div className="logo_long">
            <img src="/logos/shortLogo.png" alt="Logo" className="menuLogo" />
          </div>
          <div>
            <div className="menu_btn" onClick={() => setMobileMenu(true)}>
              <IoMdMenu />
            </div>
          </div>
        </div>
        <div className={`mobileMenu ${mobileMenu ? "menuOn" : ""}`}>
          {" "}
          <div className="mobileLoginButtonBox">
            <Link to="/login" className="mobileLoginButton">
              로그인
            </Link>
          </div>
          <div class="wave -one"></div>
          <div class="wave -two"></div>
          <div class="wave -three"></div>
          <div class="menuContents">
            <div className="floatButtons">
              {pages.map((page, index) => (
                <div key={page.path} className="mobileLinkBox">
                  <div
                    className={`mobileLinkButton float${index}`}
                    style={{
                      top: `-${((pages.length - index) ^ 2) * 4}px`,
                      rotate: `-${((pages.length - index - 1) ^ 2) * 5}deg`,
                    }}
                  >
                    <Link
                      className="link"
                      to={page.path}
                      style={{
                        color: location.pathname === page.path ? "#ffffff" : "",
                      }}
                      onClick={() => clickMobileLink()}
                    >
                      {page.name}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="closeMenu" onClick={() => setMobileMenu(false)}>
            <IoMdClose />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
