const path = require("path");
const fs = require("fs");

const LOGO_CID = "manchui-logo";

function getEmailLogoPath() {
  return path.join(__dirname, "../assets/logos/longLogo_white.png");
}

function getEmailLogoAttachment() {
  const logoPath = getEmailLogoPath();
  if (!fs.existsSync(logoPath)) {
    return null;
  }
  return {
    filename: "manchui-logo.png",
    path: logoPath,
    cid: LOGO_CID,
  };
}

function getClientUrl() {
  return (process.env.CLIENT_URL || "").replace(/\/$/, "");
}

function getServerUrl() {
  const explicit = (process.env.SERVER_URL || "").replace(/\/$/, "");
  if (explicit) return explicit;

  const kakaoRedirect = (process.env.KAKAO_REDIRECT_URI || "").trim();
  const match = kakaoRedirect.match(/^(https?:\/\/[^/]+)/i);
  if (match) return match[1];

  return getClientUrl();
}

module.exports = {
  LOGO_CID,
  getEmailLogoPath,
  getEmailLogoAttachment,
  getClientUrl,
  getServerUrl,
};
