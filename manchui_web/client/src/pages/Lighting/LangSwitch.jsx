import { useEffect } from "react";
import { LANGS, useLightingI18n } from "./lightingI18n";

/**
 * 언어 고르기. 페이지 맨 위에 두어서 번역이 있다는 걸 바로 알 수 있게 한다.
 * compact: 좁은 자리용 (KO / EN / 中 / 日)
 */
export default function LangSwitch({ compact = false }) {
  const { lang, setLang, t } = useLightingI18n();

  // 화면 읽기 프로그램과 번역기가 알 수 있게 문서 언어도 맞춘다
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [lang]);

  return (
    <div className={`ltLang${compact ? " ltLang--compact" : ""}`} role="group" aria-label={t("language")}>
      <svg className="ltLang__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          className={`ltLang__btn${lang === l.code ? " is-active" : ""}`}
          aria-pressed={lang === l.code}
          title={l.label}
          onClick={() => setLang(l.code)}
        >
          {compact ? l.short : l.label}
        </button>
      ))}
    </div>
  );
}
