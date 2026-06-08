import React from "react";
import { IoLogoInstagram } from "react-icons/io5";

const InstagramLinkArt = ({ variant = "detail" }) => (
  <div
    className={`recommendInstaArt${variant === "card" ? " recommendInstaArt--card" : ""}`}
    aria-hidden="true"
  >
    <IoLogoInstagram className="recommendInstaArt__icon" aria-hidden />
  </div>
);

export default InstagramLinkArt;
