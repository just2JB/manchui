import React from "react";
import { IoLogoInstagram } from "react-icons/io5";
import "./Contact.css";

const INSTAGRAM_URL = "https://www.instagram.com/maaaaaaanchui/";

const Contact = () => {
  return (
    <div className="contact-page">
      <section className="contact-section">
        <h1 className="contact-title">문의하기</h1>
        <p className="contact-message">
          문의는 인스타그램 DM으로 해주세요.
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-instagram-btn"
        >
          <IoLogoInstagram size={24} aria-hidden />
          <span>인스타그램으로 문의하기</span>
        </a>
      </section>
    </div>
  );
};

export default Contact;
