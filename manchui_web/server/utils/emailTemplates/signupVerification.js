const { LOGO_CID, getClientUrl, getServerUrl } = require("../emailAssets");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSignupVerificationEmail({
  code,
  expiresMinutes = 10,
  hasLogo = false,
}) {
  const safeCode = escapeHtml(code);
  const safeMinutes = escapeHtml(expiresMinutes);
  const clientUrl = getClientUrl();
  const safeClientUrl = clientUrl ? escapeHtml(clientUrl) : "";
  const copyUrl = escapeHtml(`${getServerUrl()}/api/auth/email/copy/${code}`);

  const logoBlock = hasLogo
    ? `<img src="cid:${LOGO_CID}" alt="만취" width="200" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;max-width:200px;width:100%;height:auto;" />`
    : `<p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.08em;color:#ffffff;text-align:center;">MANCHUI</p>`;

  const siteLink = clientUrl
    ? `<a href="${safeClientUrl}" style="color:#e57373;text-decoration:none;">${safeClientUrl.replace(/^https?:\/\//, "")}</a>`
    : "만취 동아리방";

  const text = [
    "만취 동아리방 회원가입을 위한 인증번호입니다.",
    "",
    `인증번호: ${code}`,
    "",
    `인증번호는 ${expiresMinutes}분간 유효합니다.`,
    "본인이 요청하지 않았다면 이 메일을 무시해 주세요.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>만취 이메일 인증</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0a0a0a;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background-color:#141414;border:1px solid #2d2d2d;border-radius:18px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,0.45);">
          <tr>
            <td style="padding:32px 28px 24px;background-color:#0f0f0f;border-bottom:3px solid #b30000;">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <h1 style="margin:0;font-size:22px;line-height:1.35;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">이메일 인증</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.65;color:#a8a8a8;">동아리방 회원가입을 완료하려면 아래 인증번호를 입력해 주세요.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#8a8a8a;letter-spacing:0.04em;text-transform:uppercase;">Verification Code</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:22px 18px;border:1px solid #333333;border-radius:14px;">
                    <a href="${copyUrl}" style="display:inline-block;font-size:36px;line-height:1;font-weight:700;letter-spacing:0.34em;padding-left:0.34em;color:#ffffff;text-decoration:none;font-variant-numeric:tabular-nums;-webkit-user-select:all;user-select:all;">${safeCode}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8c8c8c;text-align:center;">
                번호를 누르면 복사할 수 있습니다.
              </p>
              <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#8c8c8c;text-align:center;">
                인증번호는 <strong style="color:#ededed;">${safeMinutes}분</strong>간 유효합니다.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:14px 16px;background-color:#181818;border-radius:10px;">
                    <p style="margin:0;font-size:12px;line-height:1.65;color:#9a9a9a;">
                      본인이 요청하지 않았다면 이 메일을 무시해 주세요. 인증번호는 다른 사람과 공유하지 마세요.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid #262626;background-color:#101010;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#777777;text-align:center;">
                ${siteLink}
              </p>
              <p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:#555555;text-align:center;">
                © 만취 Manchui · 이 메일은 발신 전용입니다.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: `[만취] 인증번호 ${code}`,
    text,
    html,
  };
}

module.exports = {
  buildSignupVerificationEmail,
};
