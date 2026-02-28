import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IoChevronDownSharp } from "react-icons/io5";

import "./Navbar.css";

const ALL_PAGES = [
  { name: "홈", path: "/" },
  { name: "가입", path: "/join" },
  { name: "굿즈", path: "/goods" },
  { name: "동아리방", path: "/login" },
];
/** siteRestricted일 때는 가입만 표시 */
const RESTRICTED_PAGES = [{ name: "가입", path: "/join" }];

function toTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const Navbar = ({ siteRestricted = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
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
        }}
      >
        <div className="navbar-left" />
        <Link className="logo" onClick={toTop} to="/">
          <img
            src="/logos/longLogo_white.png"
            alt="Logo"
            className="manchui-logo"
          />
        </Link>
        <div className="navbar-right">
        <ul className="page-list-ul">
          {pages.map((item) => (
            <Link
              key={item.path}
              onClick={toTop}
              to={item.path}
              className="link"
            >
              {item.name}
            </Link>
          ))}
        </ul>
        <div
          className={`pop-button ${isOpen ? "rotate" : ""}`}
          onClick={() => (isOpen ? setIsOpen(false) : setIsOpen(true))}
        >
          <IoChevronDownSharp />
        </div>
        <div
          className={`pop-button ${isOpen ? "rotate2" : ""}`}
          onClick={() => (isOpen ? setIsOpen(false) : setIsOpen(true))}
        >
          <IoChevronDownSharp />
        </div>
        <div className={`pop-bar pop-${isOpen ? "open" : "close"}`}>
          <ul className="pop-page-list-ul">
            {pages.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  isOpen ? setIsOpen(false) : setIsOpen(true);
                  toTop();
                }}
                className="link"
              >
                {item.name}
              </Link>
            ))}
          </ul>
          <div
            className="pop-back"
            onClick={() => (isOpen ? setIsOpen(false) : setIsOpen(true))}
          ></div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
