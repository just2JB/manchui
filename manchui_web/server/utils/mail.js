const nodemailer = require("nodemailer");
const {
  buildSignupVerificationEmail,
} = require("./emailTemplates/signupVerification");
const { getEmailLogoAttachment } = require("./emailAssets");

function getSmtpPass() {
  return (process.env.SMTP_PASS || "").trim().replace(/\s+/g, "");
}

function isSmtpConfigured() {
  return Boolean(
    (process.env.SMTP_HOST || "").trim() &&
      (process.env.SMTP_USER || "").trim() &&
      getSmtpPass(),
  );
}

function getTransporter() {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = getSmtpPass();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port === 587,
  });
}

function getMailFrom() {
  const user = (process.env.SMTP_USER || "").trim();
  const raw = (process.env.SMTP_FROM || "").trim();
  if (!raw) {
    return { name: "만취", address: user };
  }
  const matched = raw.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
  if (matched) {
    return { name: matched[1].trim(), address: matched[2].trim() };
  }
  return raw.includes("@") ? raw : { name: "만취", address: user };
}

async function sendSignupVerificationEmail(email, code, expiresMinutes = 10) {
  const logoAttachment = getEmailLogoAttachment();
  const hasLogo = Boolean(logoAttachment);
  const { subject, text, html } = buildSignupVerificationEmail({
    code,
    expiresMinutes,
    hasLogo,
  });

  if (!isSmtpConfigured()) {
    console.log(`[dev] signup email verification for ${email}: ${code}`);
    return { devMode: true };
  }

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: getMailFrom(),
    to: email,
    subject,
    text,
    html,
    attachments: logoAttachment ? [logoAttachment] : [],
  });
  console.log(`[mail] verification sent to ${email} (${info.messageId || "ok"})`);
  return { devMode: false };
}

module.exports = {
  isSmtpConfigured,
  sendSignupVerificationEmail,
};
