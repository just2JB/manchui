import React from "react";
import { Link } from "react-router-dom";
import "./LegalDocument.css";

/**
 * 개인정보 처리방침 · 이용약관 공통 레이아웃 (잘 읽히는 것에 집중)
 * - 맨 위 한눈에 보기 요약
 * - 목차 (PC 왼쪽 고정, 모바일 접기)
 * - 번호 매긴 조항, 표는 모바일에서 카드처럼 쌓인다
 *
 * blocks: { type: "p", text } | { type: "list", items: [text | { label, text }] }
 *       | { type: "table", columns: [..], rows: [[..]] } | { type: "note", text }
 */
function Block({ block }) {
  if (block.type === "list") {
    return (
      <ul className="legalDoc__list">
        {block.items.map((item, index) =>
          typeof item === "string" ? (
            <li key={index}>{item}</li>
          ) : (
            <li key={index}>
              <strong>{item.label}</strong> {item.text}
            </li>
          ),
        )}
      </ul>
    );
  }
  if (block.type === "table") {
    return (
      <div className="legalDoc__tableWrap">
        <table className="legalDoc__table">
          <thead>
            <tr>
              {block.columns.map((column) => (
                <th key={column} scope="col">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} data-label={block.columns[cellIndex]}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === "note") {
    return <p className="legalDoc__note">{block.text}</p>;
  }
  return <p className="legalDoc__p">{block.text}</p>;
}

export default function LegalDocument({ title, effectiveDate, previousDate, intro, summary = [], sections, otherDoc }) {
  return (
    <div className="legalDoc">
      <header className="legalDoc__head">
        <p className="legalDoc__brand">MANCHUI 만취</p>
        <h1 className="legalDoc__title">{title}</h1>
        <p className="legalDoc__date">
          시행일 {effectiveDate}
          {previousDate ? <span> · 이전 버전 {previousDate}</span> : null}
        </p>
        {intro ? <p className="legalDoc__intro">{intro}</p> : null}
      </header>

      {summary.length > 0 ? (
        <section className="legalDoc__summary" aria-labelledby="legal-summary-title">
          <h2 id="legal-summary-title" className="legalDoc__summaryTitle">한눈에 보기</h2>
          <ul className="legalDoc__summaryList">
            {summary.map((item) => (
              <li key={item.title} className="legalDoc__summaryItem">
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="legalDoc__body">
        <nav className="legalDoc__toc" aria-label="목차">
          <details open className="legalDoc__tocDetails">
            <summary>목차</summary>
            <ol>
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>
                    <span className="legalDoc__tocNum">{index + 1}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </nav>

        <article className="legalDoc__article">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="legalDoc__section">
              <h2 className="legalDoc__h2">
                <span className="legalDoc__num">{index + 1}</span>
                {section.title}
              </h2>
              {section.blocks.map((block, blockIndex) => (
                <Block key={blockIndex} block={block} />
              ))}
            </section>
          ))}

          <footer className="legalDoc__foot">
            {otherDoc ? (
              <Link to={otherDoc.to} className="legalDoc__footLink">
                {otherDoc.label} 보기 →
              </Link>
            ) : null}
            <Link to="/" className="legalDoc__footLink legalDoc__footLink--sub">
              메인으로
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
