import React, { useState, useEffect, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import "./MainPage.css";

const COPY_LINES = ["by chance,", "however you dance,", "forever"];
const CHUNK_STAGGER = 0.32;
const BLANK_AFTER_TYPING_MS = 2200;
const CONTENT_AFTER_BLANK_MS = 500;
const CONTENT_STAGGER = 0.2;

const MainPage = () => {
  const [phase, setPhase] = useState("typing");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("blank"), BLANK_AFTER_TYPING_MS);
    const t2 = setTimeout(
      () => setPhase("content"),
      BLANK_AFTER_TYPING_MS + CONTENT_AFTER_BLANK_MS,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="main-page">
      <section className={`copy ${phase === "content" ? "copy--header" : ""}`}>
        <AnimatePresence mode="wait">
          {phase === "typing" && (
            <motion.div
              key="text"
              className="copy-text-wrap"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="copy-lines">
                {COPY_LINES.map((line, i) => (
                  <motion.p
                    key={line}
                    className="copy-line"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.55,
                      delay: i * CHUNK_STAGGER,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
          {phase === "blank" && <div key="blank" className="copy-blank" />}
          {phase === "content" && (
            <motion.div
              key="content"
              className="copy-header"
              initial={false}
              animate={{ opacity: 1 }}
            >
              <motion.p
                className="copy-header-tagline"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                ——— BY CHANCE · HOWEVER YOU DANCE · FOREVER
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: CONTENT_STAGGER,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <img
                  src="/logos/longLogo_white.png"
                  alt="만취"
                  className="copy-header-logo"
                />
              </motion.div>
              <motion.p
                className="copy-header-crew"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: CONTENT_STAGGER * 2,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                MANCHUI DANCE CREW
              </motion.p>
              <motion.p
                className="copy-header-desc"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: CONTENT_STAGGER * 3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                한양대학교 ERICA 중앙동아리 소속 종합예술 댄스동아리
              </motion.p>
              <motion.div
                className="copy-header-buttons"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: CONTENT_STAGGER * 4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  to="/join"
                  className="copy-header-btn copy-header-btn--primary"
                >
                  가입
                </Link>
                <button
                  type="button"
                  className="copy-header-btn copy-header-btn--secondary"
                >
                  활동 보기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <section className="keyword-band">
        <div className="keyword-band-viewport">
          <div className="keyword-band-track">
            <span className="keyword-band-inner">
              {[
                "STREET",
                "HIP HOP",
                "K-POP",
                "WAACKING",
                "LOCKING",
                "POPPING",
                "GIRLISH",
                "CHOREO",
              ].map((word) => (
                <span key={word} className="keyword-band-item">
                  <span className="keyword-band-word-wrap">
                    <span className="keyword-band-word">{word}</span>
                    <span
                      className="keyword-band-word-hover"
                      aria-hidden="true"
                    >
                      취하다
                    </span>
                  </span>
                  <span className="keyword-band-diamond" aria-hidden="true">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="#1a0000"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4 0 Q 5 2 8 4 Q 6 6 4 8 Q 3 6 0 4 Q 2 2 4 0 Z" />
                    </svg>
                  </span>
                </span>
              ))}
            </span>
            <span className="keyword-band-inner" aria-hidden="true">
              {[
                "STREET",
                "HIP HOP",
                "K-POP",
                "WAACKING",
                "LOCKING",
                "POPPING",
                "GIRLISH",
                "CHOREO",
              ].map((word) => (
                <span key={word} className="keyword-band-item">
                  <span className="keyword-band-word-wrap">
                    <span className="keyword-band-word">{word}</span>
                    <span
                      className="keyword-band-word-hover"
                      aria-hidden="true"
                    >
                      취하다
                    </span>
                  </span>
                  <span className="keyword-band-diamond" aria-hidden="true">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="#1a0000"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4 0 Q 5 2 8 4 Q 6 6 4 8 Q 3 6 0 4 Q 2 2 4 0 Z" />
                    </svg>
                  </span>
                </span>
              ))}
            </span>
          </div>
        </div>
      </section>
      <section className="about" id="about">
        <div className="about-bg" aria-hidden="true" />
        <div className="about-inner">
          <h2 className="about-title">
            <span className="about-title-line1">
              <span className="about-title-accent">만</span> 가지를
            </span>
            <span className="about-title-line2">
              <span className="about-title-accent">취</span> 하다
            </span>
          </h2>
          <p className="about-p">
            한양대학교 ERICA 중앙동아리 소속{" "}
            <span className="about-accent">종합예술댄스동아리 만취</span>는
            &apos;만 가지를 취하다&apos;라는 뜻으로 여러 장르의 춤을
            섭렵하겠다는 의미를 가진 댄스 동아리입니다.
          </p>
          <p className="about-p">
            힙합을 베이스로, K-pop, 걸리쉬, 여러 댄서들의 코레오, 왁킹, 락킹,
            팝핀, 보깅까지! <span className="about-accent">다양한 장르</span>의
            스트릿댄스를 도전해오고 있습니다.
          </p>
          <p className="about-p">
            춤에 대한 열정만 있다면{" "}
            <span className="about-accent">
              누구나 만취에 들어와 함께 배우고, 공유하며 춤출 수 있습니다!
            </span>
          </p>
        </div>
      </section>
      <section className="keyword-band keyword-band--reverse">
        <div className="keyword-band-viewport">
          <div className="keyword-band-track">
            <span className="keyword-band-inner">
              {[
                "STREET",
                "HIP HOP",
                "K-POP",
                "WAACKING",
                "LOCKING",
                "POPPING",
                "GIRLISH",
                "CHOREO",
              ].map((word) => (
                <span key={word} className="keyword-band-item">
                  <span className="keyword-band-word-wrap">
                    <span className="keyword-band-word">{word}</span>
                    <span
                      className="keyword-band-word-hover"
                      aria-hidden="true"
                    >
                      취하다
                    </span>
                  </span>
                  <span className="keyword-band-diamond" aria-hidden="true">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="#1a0000"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4 0 Q 5 2 8 4 Q 6 6 4 8 Q 3 6 0 4 Q 2 2 4 0 Z" />
                    </svg>
                  </span>
                </span>
              ))}
            </span>
            <span className="keyword-band-inner" aria-hidden="true">
              {[
                "STREET",
                "HIP HOP",
                "K-POP",
                "WAACKING",
                "LOCKING",
                "POPPING",
                "GIRLISH",
                "CHOREO",
              ].map((word) => (
                <span key={`rev-${word}`} className="keyword-band-item">
                  <span className="keyword-band-word-wrap">
                    <span className="keyword-band-word">{word}</span>
                    <span
                      className="keyword-band-word-hover"
                      aria-hidden="true"
                    >
                      취하다
                    </span>
                  </span>
                  <span className="keyword-band-diamond" aria-hidden="true">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="#1a0000"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4 0 Q 5 2 8 4 Q 6 6 4 8 Q 3 6 0 4 Q 2 2 4 0 Z" />
                    </svg>
                  </span>
                </span>
              ))}
            </span>
          </div>
        </div>
      </section>
      <section className="awards" id="awards">
        <h2 className="awards-title">Archive</h2>
        <div className="awards-scroll">
          <div className="awards-track">
            <article className="awards-year">
              <h3 className="awards-year-title">2023</h3>
              <ul className="awards-list">
                <li>봄축제 &apos;ESPERO : PANG!&apos; 끼페스티벌 4위 장려상</li>
                <li>
                  가을축제 &apos;DDING-DONG&apos; 동아리 공연
                  &apos;HYLIGHT&apos; 1위 대상
                </li>
                <li>제1회 안산 유니온 페스타 에리카 댄스 대표</li>
                <li>제1회 안산 유니온 페스타 1위 대상</li>
              </ul>
            </article>
            <article className="awards-year">
              <h3 className="awards-year-title">2024</h3>
              <ul className="awards-list">
                <li>
                  봄축제 &apos;ESPERO : BEAT&apos; 끼페스티벌
                  &apos;HEART:BEAT&apos; 2위 우수상
                </li>
                <li>
                  가을축제 &apos;HYRICA : FALL:ING&apos; 동아리 공연 1위 대상
                </li>
                <li>제2회 안산 유니온 페스타 에리카 댄스 대표</li>
                <li>제2회 안산 유니온 페스타 1위 대상</li>
              </ul>
            </article>
            <article className="awards-year">
              <h3 className="awards-year-title">2025</h3>
              <ul className="awards-list">
                <li>
                  가을축제 &apos;ESPERO : STAGE:0&apos; 끼페스티벌 2위 우수상
                </li>
                <li>제3회 안산 유니온 페스타 에리카 댄스 대표</li>
                <li>제3회 안산 유니온 페스타 1위 대상</li>
                <li>BUZZ ON: Trigger Point 개최</li>
                <li>Monster Korea, Homura Film와 협업</li>
              </ul>
            </article>
          </div>
        </div>
      </section>
      <div className="session"></div>
      <div className="qna"></div>
      <div className="toJoin"></div>
    </div>
  );
};

export default MainPage;
