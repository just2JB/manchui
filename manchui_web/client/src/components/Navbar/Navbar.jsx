import React, { useState } from "react";
import { Link } from "react-router-dom";
import { IoChevronDownSharp } from "react-icons/io5";

import "./Navbar.css";

const pages = [
  { name: "홈", path: "/" },
  { name: "동아리 소개", path: "/about" },
  { name: "가입", path: "/join" },
  { name: "굿즈", path: "/goods" },
  { name: "동아리방", path: "/club" },
];

function toTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="navbar">
      <div className="navbar-top">
        <Link className="logo" onClick={toTop} href="/">
          <img
            src="/logos/longLogo_white.png"
            alt="Logo"
            className="manchui-logo"
          />
        </Link>

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
      <div className="navbar-bottom"></div>
    </div>
  );
};

export default Navbar;
