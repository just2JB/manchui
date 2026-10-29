import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  isSameLinkDestination,
  scrollWindowTopAfterNav,
} from "../../utils/navScroll";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import "./Navbar.css";

const PREPARING_FEATURE_MSG = "준비 중인 기능입니다.";
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

const Navbar = ({ siteRestricted = false, assistantEnabled = true }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const location = useLocation();
  const nav = useNavigate();
  const modal = useManchuiModal();

  const showPreparingOnly = assistantEnabled === false;

  const showPreparingFeatureModal = () => {
    void modal(PREPARING_FEATURE_MSG, "alert");
  };

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
            {showPreparingOnly ? (
              <button
                type="button"
                className="loginButton loginButton--prep"
                onClick={showPreparingFeatureModal}
              >
                어시스턴트
              </button>
            ) : (
              <Link className="loginButton" to="/club">
                어시스턴트
              </Link>
            )}
          </div>
        </div>
        <div className="mobile">
          <div className="logo_long" onClick={() => toMainPage()}>
            <span className="shortLogo mobileShortLogo">MANCHUI</span>
          </div>
          <div className="mobile-actions">
            {showPreparingOnly ? (
              <button
                type="button"
                className="mobile-assistant-btn mobile-assistant-btn--prep"
                onClick={showPreparingFeatureModal}
              >
                어시스턴트
              </button>
            ) : (
              <Link className="mobile-assistant-btn" to="/club">
                어시스턴트
              </Link>
            )}
            <button
              type="button"
              className="menu_btn"
              onClick={() => setMobileMenu(true)}
              aria-label="메뉴 열기"
            >
              <IoMdMenu aria-hidden />
            </button>
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
              {showPreparingOnly ? (
                <button
                  type="button"
                  className="mobileMenu-loginCta mobileMenu-loginCta--prep"
                  onClick={() => {
                    closeMobileMenu();
                    showPreparingFeatureModal();
                  }}
                >
                  어시스턴트
                </button>
              ) : (
                <Link
                  className="mobileMenu-loginCta"
                  to="/club"
                  onClick={() => closeMobileMenu()}
                >
                  어시스턴트
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
