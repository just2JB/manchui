import React, { useState } from "react";
import { Link } from "react-router-dom";

import "./Navbar.css";

const pages = [
  { name: "홈", path: "/" },
  { name: "동아리 소개", path: "/about" },
  { name: "문의하기", path: "/contact" },
  { name: "가입 안내", path: "/join" },
  { name: "동아리방", path: "/club" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="navbar">
      <a className="logo" href="/">
        <img
          src="/logos/longLogo_white.png"
          alt="Logo"
          className="manchui-logo"
        />
      </a>

      <ul className="page-list-ul">
        {pages.map((item) => (
          <Link key={item.path} to={item.path} className="link">
            {item.name}
          </Link>
        ))}
      </ul>

      <button className="pop-button" onClick={() => setIsOpen(true)}>
        열기
      </button>

      <div className={`pop-bar pop-${isOpen ? "open" : "close"}`}>
        <button className="pop-close-button" onClick={() => setIsOpen(false)}>
          나가기
        </button>

        <ul className="pop-page-list-ul">
          {pages.map((item) => (
            <Link key={item.path} to={item.path} className="link">
              {item.name}
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
