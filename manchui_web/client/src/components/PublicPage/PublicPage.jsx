import { Link } from "react-router-dom";
import "./PublicPage.css";

export default function PublicPage({ label, title, description, children, note }) {
  return (
    <main className="public-page">
      <div className="public-page__inner">
        <Link to="/" className="public-page__back">← 홈으로</Link>
        <div className="public-page__grid">
          <header className="public-page__heading">
            <p className="public-page__label">{label}</p>
            <h1>{title}</h1>
            <p className="public-page__description">{description}</p>
            <img src="/logos/longLogo_white.png" alt="MANCHUI" className="public-page__logo" />
          </header>
          <section className="public-page__content" aria-label={title}>
            {children}
          </section>
        </div>
        <div className="public-page__baseline">
          <span>BY CHANCE, YOU DANCE.</span>
          <p>{note}</p>
        </div>
      </div>
    </main>
  );
}
