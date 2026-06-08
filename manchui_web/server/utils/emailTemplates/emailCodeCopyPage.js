function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJsString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/</g, "\\u003c");
}

function buildEmailCodeCopyPage(code) {
  const safeCode = escapeHtml(code);
  const jsCode = escapeJsString(code);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>인증번호 복사 · 만취</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: #0a0a0a;
      color: #ededed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
    }
    .card {
      width: 100%;
      max-width: 420px;
      padding: 28px 24px;
      border: 1px solid #2d2d2d;
      border-radius: 18px;
      background: #141414;
      text-align: center;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 1.15rem;
      font-weight: 700;
    }
    .code {
      margin: 18px 0 12px;
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: 0.34em;
      padding-left: 0.34em;
      font-variant-numeric: tabular-nums;
    }
    .status {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.6;
      color: #a8a8a8;
    }
    .status--ok { color: #7dd3a8; }
    .status--error { color: #e57373; }
    button {
      margin-top: 18px;
      padding: 10px 18px;
      border: 1px solid #b30000;
      border-radius: 999px;
      background: rgba(179, 0, 0, 0.16);
      color: #fff;
      font: inherit;
      font-size: 0.92rem;
      cursor: pointer;
    }
    button:hover { background: rgba(179, 0, 0, 0.28); }
  </style>
</head>
<body>
  <div class="card">
    <h1>이메일 인증번호</h1>
    <p class="code" id="code">${safeCode}</p>
    <p class="status" id="status">인증번호를 복사하는 중…</p>
    <button type="button" id="copyBtn" hidden>다시 복사</button>
  </div>
  <script>
    (function () {
      var code = '${jsCode}';
      var statusEl = document.getElementById('status');
      var copyBtn = document.getElementById('copyBtn');

      function setStatus(message, type) {
        statusEl.textContent = message;
        statusEl.className = 'status' + (type ? ' status--' + type : '');
      }

      function fallbackCopy() {
        var textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      }

      function copyCode() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(code).then(function () { return true; }).catch(function () {
            return fallbackCopy();
          });
        }
        return Promise.resolve(fallbackCopy());
      }

      function runCopy() {
        copyCode().then(function (ok) {
          if (ok) {
            setStatus('인증번호가 복사되었습니다. 가입 화면으로 돌아가 붙여넣기 해 주세요.', 'ok');
          } else {
            setStatus('자동 복사에 실패했습니다. 아래 번호를 직접 선택해 복사해 주세요.', 'error');
            copyBtn.hidden = false;
          }
        });
      }

      copyBtn.addEventListener('click', runCopy);
      runCopy();
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  buildEmailCodeCopyPage,
};
