import React, { useState, useEffect, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "./MainPage.css";

const COPY_LINES = ["by chance,", "however you dance,", "forever"];
const CHUNK_STAGGER = 0.32;
const BLANK_AFTER_TYPING_MS = 2200;
const CONTENT_AFTER_BLANK_MS = 500;
const CONTENT_STAGGER = 0.2;

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

const MainPage = () => {
  const [phase, setPhase] = useState("typing");
  const [sessionIndex, setSessionIndex] = useState(0);

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
                  onClick={() =>
                    document.getElementById("session")?.scrollIntoView({ behavior: "smooth" })
                  }
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
          <motion.h2
            className="about-title"
            initial={{ x: 80, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="about-title-line1">
              <span className="about-title-accent">만</span> 가지를
            </span>
            <span className="about-title-line2">
              <span className="about-title-accent">취</span> 하다
            </span>
          </motion.h2>
          <motion.div
            className="about-body"
            initial={{ x: 80, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
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
              힙합을 베이스로, K-pop, 걸리쉬, 여러 댄서들의 코레오, 왁킹, 락킹,
              팝핀, 보깅까지! <span className="about-accent">다양한 장르</span>
              의 스트릿댄스를 도전해오고 있습니다.
            </p>
            <p className="about-p">
              춤에 대한 열정만 있다면{" "}
              <span className="about-accent">
                누구나 만취에 들어와 함께 배우고, 공유하며 춤출 수 있습니다!
              </span>
            </p>
          </motion.div>
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
      <section className="session" id="session">
        <h2 className="session-heading">주요 활동</h2>
        <div className="session-menu">
          {SESSION_ITEMS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`session-menu-btn ${i === sessionIndex ? "session-menu-btn--active" : ""}`}
              onClick={() => setSessionIndex(i)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="session-content-wrap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={sessionIndex}
              className="session-content"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="session-image-placeholder">
                <span className="session-image-placeholder-text">
                  사진 영역
                </span>
                <span className="session-image-placeholder-sub">
                  (이미지 추후 첨부)
                </span>
              </div>
              <p className="session-desc">
                {SESSION_ITEMS[sessionIndex].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      <section className="awards" id="awards">
        <h2 className="awards-title">주요 행적</h2>
        <div className="awards-swiper-wrap">
          <Swiper
            className="awards-swiper"
            modules={[Autoplay, Pagination]}
            direction="horizontal"
            slidesPerView={3}
            spaceBetween={20}
            loop={true}
            allowTouchMove={true}
            simulateTouch={true}
            pagination={{ clickable: true }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              900: { slidesPerView: 3 },
            }}
          >
            {AWARDS_YEARS.map((block) => (
              <SwiperSlide key={block.year}>
                <article className="awards-year">
                  <h3 className="awards-year-title">{block.year}</h3>
                  <ul className="awards-list">
                    {block.items.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
      <section className="qna" id="qna">
        <h2 className="qna-heading">자주 묻는 질문</h2>
        <div className="qna-list">
          {QNA_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              className="qna-item"
              initial={{ opacity: 0, x: i % 2 === 0 ? -28 : 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="qna-q">
                <span className="qna-q-mark">Q.</span> {item.q}
              </p>
              <p className="qna-a">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="toJoin" id="toJoin">
        <div className="toJoin-inner">
          <p className="toJoin-tagline">JOIN THE CREW</p>
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
            <Link to="/join" className="toJoin-btn toJoin-btn--primary">
              가입하기
            </Link>
            <a
              href="https://www.instagram.com/maaaaaaanchui/"
              target="_blank"
              rel="noopener noreferrer"
              className="toJoin-btn toJoin-btn--secondary"
            >
              인스타그램 팔로우
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MainPage;
