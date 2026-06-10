const fs = require("fs");
const nodemailer = require("nodemailer");
const {
  buildSignupVerificationEmail,
} = require("./emailTemplates/signupVerification");
const { getEmailLogoAttachment } = require("./emailAssets");

function isProduction() {
  return (process.env.NODE_ENV || "").trim().toLowerCase() === "production";
}

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

function isResendConfigured() {
  return Boolean((process.env.RESEND_API_KEY || "").trim());
}

function getMailProvider() {
  if (isResendConfigured()) return "resend";
  if (isSmtpConfigured()) return "smtp";
  return null;
}

function isMailConfigured() {
  return Boolean(getMailProvider());
}

function getTransporter() {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = getSmtpPass();
  const secure =
    (process.env.SMTP_SECURE || "").trim().toLowerCase() === "true" ||
    port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure && port === 587,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
}

function parseMailFrom(rawInput) {
  const user = (process.env.SMTP_USER || "").trim();
  const raw = (rawInput || "").trim();
  if (!raw) {
    return { name: "만취", address: user };
  }
  const matched = raw.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
  if (matched) {
    return { name: matched[1].trim(), address: matched[2].trim() };
  }
  if (raw.includes("@")) {
    return raw;
  }
  return { name: raw.replace(/^"|"$/g, "").trim() || "만취", address: user };
}

function getMailFrom() {
  const raw =
    (process.env.MAIL_FROM || "").trim() ||
    (process.env.RESEND_FROM || "").trim() ||
    (process.env.SMTP_FROM || "").trim();
  return parseMailFrom(raw);
}

function formatMailFromAddress(from = getMailFrom()) {
  if (typeof from === "string") return from;
  return `${from.name} <${from.address}>`;
}

function buildLogoAttachmentForResend(logoAttachment) {
  if (!logoAttachment?.path || !fs.existsSync(logoAttachment.path)) {
    return null;
  }
  return {
    filename: logoAttachment.filename,
    content: fs.readFileSync(logoAttachment.path).toString("base64"),
    content_id: logoAttachment.cid,
  };
}

function formatMailError(error) {
  const parts = [error?.message || "Unknown mail error"];
  if (error?.code) parts.push(`code=${error.code}`);
  if (error?.responseCode) parts.push(`responseCode=${error.responseCode}`);
  if (error?.command) parts.push(`command=${error.command}`);
  return parts.join(" | ");
}

function buildMailNotConfiguredError() {
  const message = isProduction()
    ? "메일 발송 설정이 없습니다. 배포 환경에 RESEND_API_KEY 또는 SMTP 설정을 추가해 주세요."
    : "메일 발송 설정이 없습니다. SMTP 또는 RESEND_API_KEY를 .env에 설정해 주세요.";
  const error = new Error(message);
  error.code = "MAIL_NOT_CONFIGURED";
  return error;
}

function buildMailDeliveryError(error, provider) {
  const resendDetail = error?.message || "";
  let message = "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.";

  if (provider === "resend") {
    if (/domain is not verified/i.test(resendDetail)) {
      message =
        "Resend 발신 도메인이 인증되지 않았습니다. Gmail 주소는 사용할 수 없습니다. Resend에서 maaaaaaanchui.com 도메인을 인증한 뒤 RESEND_FROM=noreply@maaaaaaaanchui.com 으로 설정해 주세요.";
    } else if (resendDetail) {
      message = `메일 발송 오류: ${resendDetail}`;
    }
  }

  const deliveryError = new Error(message);
  deliveryError.code = "MAIL_DELIVERY_FAILED";
  deliveryError.cause = error;
  return deliveryError;
}

async function sendViaResend({ to, subject, text, html, logoAttachment }) {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const payload = {
    from: formatMailFromAddress(),
    to: [to],
    subject,
    text,
    html,
  };

  const attachment = buildLogoAttachmentForResend(logoAttachment);
  if (attachment) {
    payload.attachments = [attachment];
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      body?.message ||
      body?.error?.message ||
      body?.name ||
      `HTTP ${response.status}`;
    const error = new Error(detail);
    error.responseCode = response.status;
    throw error;
  }

  return { messageId: body?.id || "resend" };
}

async function sendViaSmtp({ to, subject, text, html, logoAttachment }) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: getMailFrom(),
    to,
    subject,
    text,
    html,
    attachments: logoAttachment ? [logoAttachment] : [],
  });
}

async function sendSignupVerificationEmail(email, code, expiresMinutes = 10) {
  const logoAttachment = getEmailLogoAttachment();
  const hasLogo = Boolean(logoAttachment);
  const { subject, text, html } = buildSignupVerificationEmail({
    code,
    expiresMinutes,
    hasLogo,
  });

  const provider = getMailProvider();
  if (!provider) {
    if (isProduction()) {
      throw buildMailNotConfiguredError();
    }
    console.log(`[dev] signup email verification for ${email}: ${code}`);
    return { devMode: true, provider: null };
  }

  try {
    const mailPayload = {
      to: email,
      subject,
      text,
      html,
      logoAttachment,
    };

    const info =
      provider === "resend"
        ? await sendViaResend(mailPayload)
        : await sendViaSmtp(mailPayload);

    console.log(
      `[mail] verification sent to ${email} via ${provider} (${info.messageId || "ok"})`,
    );
    return { devMode: false, provider };
  } catch (error) {
    console.error(
      `[mail] verification failed via ${provider}:`,
      formatMailError(error),
    );
    throw buildMailDeliveryError(error, provider);
  }
}

function logMailStartupStatus() {
  const provider = getMailProvider();
  if (provider === "resend") {
    const from = formatMailFromAddress();
    console.log(`[mail] provider=resend from=${from}`);
    if (
      /@gmail\.com|@googlemail\.com|@yahoo\.|@hotmail\.|@outlook\./i.test(from)
    ) {
      console.warn(
        "[mail] WARNING: RESEND_FROM uses a public mailbox domain. Resend requires a verified custom domain (e.g. noreply@maaaaaaaanchui.com).",
      );
    }
    return;
  }
  if (provider === "smtp") {
    const host = (process.env.SMTP_HOST || "").trim();
    const port = Number(process.env.SMTP_PORT || 587);
    console.log(`[mail] provider=smtp host=${host} port=${port}`);
    return;
  }
  if (isProduction()) {
    console.warn(
      "[mail] WARNING: no mail provider configured in production (set RESEND_API_KEY or SMTP_*)",
    );
    return;
  }
  console.log("[mail] provider=dev (codes logged to console only)");
}

module.exports = {
  isMailConfigured,
  isSmtpConfigured,
  isResendConfigured,
  getMailProvider,
  logMailStartupStatus,
  sendSignupVerificationEmail,
  formatMailError,
};
