import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  isSameLinkDestination,
  scrollWindowTopAfterNav,
} from "../../utils/navScroll";
import "./Navbar.css";

const ALL_PAGES = [
  { name: "홈", nameEn: "HOME", path: "/" },
  {
    name: "주요 활동",
    nameEn: "SESSION",
    path: "/",
    scrollToId: "session",
  },
  { name: "가입", nameEn: "JOIN", path: "/join" },
  { name: "문의", nameEn: "CONTACT", path: "/contact" },
  { name: "굿즈", nameEn: "GOODS", path: "/goods" },
];

function isNavItemActive(page, location) {
  if (page.scrollToId) {
    return location.pathname === "/" && location.hash === `#${page.scrollToId}`;
  }
  if (page.path === "/") {
    return location.pathname === "/" && location.hash !== "#session";
  }
  return location.pathname === page.path;
}
/** siteRestricted일 때는 가입만 표시 */
const RESTRICTED_PAGES = [{ name: "가입", nameEn: "JOIN", path: "/join" }];

function toTopInstant() {
  window.scrollTo({ top: 0, behavior: "instant" });
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

  const closeMobileMenu = () => {
    setMobileMenu(false);
  };

  const afterMobileNavClick = (page) => {
    closeMobileMenu();
    if (page?.scrollToId) {
      if (
        location.pathname === "/" &&
        location.hash === `#${page.scrollToId}`
      ) {
        requestAnimationFrame(() =>
          document
            .getElementById(page.scrollToId)
            ?.scrollIntoView({ behavior: "smooth" }),
        );
      }
      return;
    }
    scrollWindowTopAfterNav(page.path, location);
  };

  const toMainPage = () => {
    if (isSameLinkDestination("/", location)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    nav("/");
    toTopInstant();
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
            <div className="shortLogo" onClick={() => toMainPage()}>
              MANCHUI
            </div>
          </div>
          <div className="menu">
            {pages.map((page) => (
              <div
                key={page.scrollToId ? `scroll-${page.scrollToId}` : page.path}
                className="linkBox"
              >
                <Link
                  className="link"
                  to={
                    page.scrollToId
                      ? { pathname: "/", hash: page.scrollToId }
                      : page.path
                  }
                  style={{
                    color: isNavItemActive(page, location) ? "#ffffff" : "",
                  }}
                  onClick={() => {
                    if (page.scrollToId) {
                      if (
                        location.pathname === "/" &&
                        location.hash === `#${page.scrollToId}`
                      ) {
                        document
                          .getElementById(page.scrollToId)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }
                      return;
                    }
                    scrollWindowTopAfterNav(page.path, location);
                  }}
                >
                  {page.name}
                </Link>
              </div>
            ))}
          </div>
          <div className="loginButtonBox">
            <button
              className="loginButton"
              onClick={() => {
                if (isSameLinkDestination("/login", location)) {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  return;
                }
                nav("/login");
                toTopInstant();
              }}
            >
              로그인
            </button>
          </div>
        </div>
        <div className="mobile">
          <div className="logo_long" onClick={() => toMainPage()}>
            <span className="shortLogo mobileShortLogo">MANCHUI</span>
          </div>
          <div>
            <div className="menu_btn" onClick={() => setMobileMenu(true)}>
              <IoMdMenu />
            </div>
          </div>
        </div>
        <div
          className={`mobileMenu ${mobileMenu ? "menuOn" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="모바일 메뉴"
        >
          <div className="mobileMenu-shell">
            <header className="mobileMenu-top">
              <span className="mobileMenu-top-spacer" aria-hidden="true" />
              <button
                type="button"
                className="mobileMenu-close"
                onClick={() => setMobileMenu(false)}
                aria-label="메뉴 닫기"
              >
                <IoMdClose aria-hidden />
              </button>
            </header>
            <nav className="mobileMenu-nav" aria-label="페이지 이동">
              <ul className="mobileMenu-list">
                {pages.map((page) => (
                  <li
                    key={
                      page.scrollToId ? `scroll-${page.scrollToId}` : page.path
                    }
                    className="mobileMenu-item"
                  >
                    <Link
                      className={`mobileMenu-link ${isNavItemActive(page, location) ? "mobileMenu-link--active" : ""}`}
                      to={
                        page.scrollToId
                          ? { pathname: "/", hash: page.scrollToId }
                          : page.path
                      }
                      onClick={() => afterMobileNavClick(page)}
                    >
                      {page.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mobileMenu-bottom">
              <div className="mobileMenu-divider" aria-hidden="true" />
              <Link
                to="/login"
                className="mobileMenu-loginCta"
                onClick={() => {
                  closeMobileMenu();
                  scrollWindowTopAfterNav("/login", location);
                }}
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
