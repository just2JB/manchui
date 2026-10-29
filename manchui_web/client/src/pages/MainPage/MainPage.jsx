import React, { useState, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { scrollWindowTopAfterNav } from "../../utils/navScroll";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react";
import "./MainPage.css";
import DarkVeil from "../../components/DarkVeil/DarkVeil";
import ActivityIllustration from "./ActivityIllustration";

const SESSION_ITEMS = [
  {
    id: "challenge",
    title: "만취 챌린지",
    description: "정기적으로 진행하는 만취만의 챌린지 활동을 소개합니다.",
  },
  {
    id: "popup",
    title: "팝업 클래스",
    description: "다양한 장르의 팝업 클래스를 통해 실력을 쌓고 교류합니다.",
  },
  {
    id: "festival",
    title: "축제",
    description: "봄·가을 축제 및 끼페스티벌 등 학교 행사에 참여합니다.",
  },
  {
    id: "performance",
    title: "외부 공연",
    description: "안산 유니온 페스타 등 외부 공연 및 대회에 나갑니다.",
  },
  {
    id: "community",
    title: "친목 활동",
    description: "MT, 회식 등 동아리원 간 친목을 다지는 시간입니다.",
  },
];

const AWARDS_YEARS = [
  {
    year: "2012~2022",
    items: ["창립 및 다수의 교내 행사 수상"],
  },
  {
    year: "2023",
    items: [
      "봄축제 'ESPERO : PANG!' 끼페스티벌 4위 장려상",
      "가을축제 'DDING-DONG' 동아리 공연 'HYLIGHT' 1위 대상",
      "제1회 안산 유니온 페스타 에리카 댄스 대표",
      "제1회 안산 유니온 페스타 1위 대상",
    ],
  },
  {
    year: "2024",
    items: [
      "봄축제 'ESPERO : BEAT' 끼페스티벌 'HEART:BEAT' 2위 우수상",
      "가을축제 'HYRICA : FALL:ING' 동아리 공연 1위 대상",
      "제2회 안산 유니온 페스타 에리카 댄스 대표",
      "제2회 안산 유니온 페스타 1위 대상",
    ],
  },
  {
    year: "2025",
    items: [
      "가을축제 'ESPERO : STAGE:0' 끼페스티벌 2위 우수상",
      "제3회 안산 유니온 페스타 에리카 댄스 대표",
      "제3회 안산 유니온 페스타 1위 대상",
      "BUZZ ON: Trigger Point 개최",
      "Monster Korea, Homura Film와 협업",
    ],
  },
  {
    year: "2026",
    items: [
      "봄 축제 ON:BOARD 3위 장려상",
      "BUZZ ON:SOPHMORE 개최",
      "Monster Korea, Homura Film와 협업",
      "농협은행 유튜브 예능 올랭말랭 출연",
    ],
  },
];

const QNA_ITEMS = [
  {
    q: "가입 오디션이 있나요?",
    a: "만취는 가입 오디션이 없이, 누구나 춤에 대한 관심만 있다면 참여할 수 있는 동아리입니다.",
  },
  {
    q: "정기적인 연습 날짜가 정해져 있나요?",
    a: "정해져 있지 않습니다! 공연 스케줄이 생긴다면 참여하는 사람들의 스케줄을 고려하여 팀 내에서 자율적으로 일정을 정합니다.",
  },
  {
    q: "가입하면 모든 활동에 참여해야 하나요?",
    a: "원하는 활동만 참여하셔도 됩니다! 자신이 할 수 있는 만큼 참여하면 되고, 바쁘시면 안 하셔도 괜찮습니다. 부원들의 의견을 존중하기 때문에 강요하지 않아요 :)",
  },
  {
    q: "춤을 처음 추는데 가입해도 잘 활동할 수 있을까요?",
    a: "네, 문제 없습니다! 춤을 처음 추더라도 쉽게 참여할 수 있는 챌린지나 클래스 활동이 있고, 큰 무대를 준비하더라도 알려 드리면서 진행하기 때문에 처음이셔도 전혀 문제 없습니다!",
  },
];

const AWARDS_HIGHLIGHT_REGEX =
  /(에리카 댄스 대표|1위 대상|ON:BOARD|장려상|우수상|대상|대표|1등)/g;
const AWARDS_HIGHLIGHT_WORDS = new Set([
  "에리카 댄스 대표",
  "1위 대상",
  "ON:BOARD",
  "장려상",
  "우수상",
  "대상",
  "대표",
  "1등",
]);

const renderAwardsTextWithHighlight = (text) =>
  text
    .split(AWARDS_HIGHLIGHT_REGEX)
    .map((part, idx) =>
      AWARDS_HIGHLIGHT_WORDS.has(part) ? (
        <strong key={`${part}-${idx}`}>{part}</strong>
      ) : (
        <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>
      ),
    );

const MainPage = () => {
  const location = useLocation();
  const calmMotion = useReducedMotion();
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionDirection, setSessionDirection] = useState(1);
  const [openFaqIndices, setOpenFaqIndices] = useState(() => new Set());

  useLayoutEffect(() => {
    if (location.hash === "#session") {
      requestAnimationFrame(() => {
        document
          .getElementById("session")
          ?.scrollIntoView({ behavior: "instant" });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.hash]);

  const selectSession = (index) => {
    const next = (index + SESSION_ITEMS.length) % SESSION_ITEMS.length;
    setSessionDirection(index > sessionIndex ? 1 : -1);
    setSessionIndex(next);
  };

  const handleSessionKey = (event, index) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % SESSION_ITEMS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + SESSION_ITEMS.length) % SESSION_ITEMS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = SESSION_ITEMS.length - 1;
    else return;
    event.preventDefault();
    selectSession(next);
    document.getElementById(`activity-tab-${next}`)?.focus();
  };

  return (
    <MotionConfig reducedMotion={calmMotion ? "always" : "user"}>
    <div className={`main-page ${calmMotion ? "main-page--calm" : ""}`}>
      <div className="main-page-bg" aria-hidden="true">
        {!calmMotion && <DarkVeil
          hueShift={245}
          noiseIntensity={0.28}
          scanlineIntensity={1}
          speed={0.35}
          scanlineFrequency={1}
          warpAmount={1.2}
        />}
      </div>
      <section className="copy copy--header">
        <motion.div className="copy-header" initial={calmMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <p className="copy-header-tagline">BY CHANCE · HOWEVER · YOU DANCE · FOREVER</p>
          <h1><img src="/logos/longLogo_white.png" alt="만취" className="copy-header-logo" /></h1>
          <p className="copy-header-crew">MANCHUI DANCE CREW</p>
          <p className="copy-header-desc">한양대학교 ERICA 중앙동아리 소속 종합예술 댄스동아리</p>
          <div className="copy-header-buttons">
            <Link to="/join" className="copy-header-btn copy-header-btn--primary"
              onClick={() => scrollWindowTopAfterNav("/join", location)}>가입하기 <span aria-hidden="true">→</span></Link>
            <button type="button" className="copy-header-btn copy-header-btn--secondary"
              onClick={() => document.getElementById("session")?.scrollIntoView({ behavior: calmMotion ? "instant" : "smooth" })}>
              활동 보기 <span aria-hidden="true">↓</span>
            </button>
          </div>
        </motion.div>
        <div className="hero-controls">
          <button type="button" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: calmMotion ? "instant" : "smooth" })}>
            만취 알아보기 <span aria-hidden="true">↓</span>
          </button>
        </div>
      </section>
      <section className="keyword-band keyword-band--reverse keyword-band--top">
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
          <motion.img
            className="about-short-logo"
            src="/logos/shortLogo.png"
            alt=""
            aria-hidden="true"
            initial={calmMotion ? false : { y: 18, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="about-text">
            <p className="main-eyebrow main-eyebrow--start">ABOUT US</p>
            <motion.h2
              className="about-title"
              initial={calmMotion ? false : { y: 18, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              만 가지를 취하다
            </motion.h2>
            <motion.div
              className="about-body"
              initial={calmMotion ? false : { y: 18, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <p className="about-p">
                한양대학교 ERICA 중앙동아리 소속{" "}
                <span className="about-accent">종합예술댄스동아리 만취</span>는
                &apos;만 가지를 취하다&apos;라는 뜻으로 여러 장르의 춤을
                섭렵하겠다는 의미를 가진 댄스 동아리입니다.
              </p>
              <p className="about-p">
                힙합을 베이스로, K-pop, 걸리쉬, 여러 댄서들의 코레오, 왁킹,
                락킹, 팝핀, 보깅까지!{" "}
                <span className="about-accent">다양한 장르</span>의 스트릿댄스를
                도전해오고 있습니다.
              </p>
              <p className="about-p">
                춤에 대한 열정만 있다면{" "}
                <span className="about-accent">
                  누구나 만취에 들어와 함께 배우고, 공유하며 춤출 수 있습니다!
                </span>
              </p>
            </motion.div>
          </div>
        </div>
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
      <section className="session" id="session">
        <p className="main-eyebrow">ACTIVITIES</p>
        <h2 className="session-heading">주요 활동</h2>
        <div className="session-inner">
          <div className="session-menu" role="tablist" aria-label="주요 활동 선택">
            {SESSION_ITEMS.map((item, i) => (
              <button key={item.id} type="button" role="tab" id={`activity-tab-${i}`}
                aria-selected={i === sessionIndex} aria-controls="activity-panel" tabIndex={i === sessionIndex ? 0 : -1}
                className={`session-menu-btn ${i === sessionIndex ? "session-menu-btn--active" : ""}`}
                onKeyDown={(event) => handleSessionKey(event, i)} onClick={() => selectSession(i)}>
                {item.title}
              </button>
            ))}
          </div>
          <div className="session-content-wrap" role="tabpanel" id="activity-panel" aria-labelledby={`activity-tab-${sessionIndex}`} tabIndex={0}>
            <AnimatePresence mode="wait" initial={false} custom={sessionDirection}>
              <motion.div key={sessionIndex} className="session-content" custom={sessionDirection}
                variants={{ enter: dir => ({ x: calmMotion ? 0 : dir * 24, opacity: 0 }), exit: dir => ({ x: calmMotion ? 0 : dir * -24, opacity: 0 }) }}
                initial="enter" animate={{ x: 0, opacity: 1 }} exit="exit"
                transition={{ duration: calmMotion ? 0 : 0.18 }}>
                <ActivityIllustration type={SESSION_ITEMS[sessionIndex].id} />
                <div className="session-copy">
                  <span className="session-number">0{sessionIndex + 1} / 0{SESSION_ITEMS.length}</span>
                  <h3>{SESSION_ITEMS[sessionIndex].title}</h3>
                  <p className="session-desc">{SESSION_ITEMS[sessionIndex].description}</p>
                  <p className="session-flow">{[
                    "안무 연습 → 함께 촬영 → 챌린지 완성",
                    "새로운 장르 → 안무 배우기 → 함께 연습",
                    "팀 연습 → 무대 준비 → 축제 공연",
                    "공연 준비 → 무대에 서기 → 관객과 소통",
                    "MT · 회식 → 함께 웃고 → 더 가까이",
                  ][sessionIndex]}</p>
                  <Link to="/join" className="session-join">함께하고 싶다면 <span aria-hidden="true">↗</span></Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="session-controls">
            <p aria-live="polite">{sessionIndex + 1} / {SESSION_ITEMS.length} · {SESSION_ITEMS[sessionIndex].title}</p>
            <div>
              <button type="button" onClick={() => selectSession(sessionIndex - 1)} aria-label="이전 활동">←</button>
              <button type="button" onClick={() => selectSession(sessionIndex + 1)} aria-label="다음 활동">→</button>
            </div>
          </div>
        </div>
      </section>
      <section className="awards faq-section" id="awards">
        <p className="main-eyebrow">FAQ</p>
        <h2 className="awards-title">자주 묻는 질문</h2>
        <div className="faq-list">
          {QNA_ITEMS.map((item, i) => {
            const isOpen = openFaqIndices.has(i);
            return (
              <div
                key={item.q}
                className={`faq-item ${isOpen ? "faq-item--open" : ""}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                  onClick={() =>
                    setOpenFaqIndices((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                >
                  <span className="faq-question-inner">
                    <span className="faq-q-mark" aria-hidden="true">
                      Q.
                    </span>
                    <span className="faq-q-text">{item.q}</span>
                  </span>
                  <span className="faq-chevron" aria-hidden="true">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 4.5L6 8L9.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      role="region"
                      aria-labelledby={`faq-question-${i}`}
                      className="faq-answer-outer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: calmMotion ? 0 : 0.24,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="faq-answer">{item.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
      <section className="qna qna--awards" id="qna">
        <p className="main-eyebrow">HISTORY</p>
        <h2 className="qna-heading">주요 행적</h2>
        <div className="qna-list">
          {AWARDS_YEARS.map((block) => (
            <motion.div
              key={block.year}
              className="qna-item"
              initial={calmMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.9 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="qna-q">{block.year}</p>
              <p className="qna-a">
                {block.items.map((text, idx) => (
                  <span
                    className="qna-awards-line"
                    key={`${block.year}-${idx}`}
                  >
                    <span className="qna-awards-bullet" aria-hidden="true">
                      •
                    </span>{" "}
                    {renderAwardsTextWithHighlight(text)}
                  </span>
                ))}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="toJoin" id="toJoin">
        <motion.div
          className="toJoin-inner"
          initial={calmMotion ? false : { y: 18, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.9 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="main-eyebrow toJoin-tagline">JOIN THE CREW</p>
          <h2 className="toJoin-title">
            누구나
            <br />
            함께
          </h2>
          <p className="toJoin-desc">
            만취는 항상 새로운 에너지를 기다립니다.
            <br />
            장르 불문, 실력 불문. 열정 하나면 충분합니다.
            <br />
            당신의 이야기를 우리와 함께 써내려가세요.
          </p>
          <div className="toJoin-buttons">
            <Link
              to="/join"
              onClick={() => scrollWindowTopAfterNav("/join", location)}
              className="toJoin-btn toJoin-btn--primary"
            >
              가입하기
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
    </MotionConfig>
  );
};

export default MainPage;
