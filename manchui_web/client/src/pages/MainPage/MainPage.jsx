import React, { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import "./MainPage.css";

const HERO_LINES = [
  "by chance,",
  "however you dance,",
  "forever",
];

const AWARDS = [
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

const PROJECTS = [
  {
    title: "꿈터 동아리 무대",
    description: "꿈터에서 진행하는 동아리 무대 공연으로, 정기적으로 팀별 무대를 선보입니다.",
  },
  {
    title: "만취 챌린지",
    description: "간단한 춤으로 SNS에 업로드하는 챌린지 활동. 누구나 참여할 수 있는 릴스/숏폼 댄스 챌린지입니다.",
  },
  {
    title: "만취 팝업 클래스",
    description: "장르쉐어 세션으로 다양한 스트릿댄스 장르를 경험하고 배우는 팝업 클래스입니다.",
  },
  {
    title: "교내 축제",
    description: "봄축제, 가을축제 등 ERICA 축제 무대에 참여하며 끼페스티벌, 동아리 공연 등에서 활동합니다.",
  },
  {
    title: "안산 유니온 페스타",
    description: "에리카 댄스 대표로 참가하여 매년 대상 수상의 성과를 이어가고 있습니다.",
  },
  {
    title: "외부 협업",
    description: "Monster Korea, Homura Film 등과의 협업 프로젝트를 진행하며 다양한 무대를 만들어갑니다.",
  },
];

function SectionFade({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function ProjectCard({ project, onClick }) {
  return (
    <motion.button
      type="button"
      className="landing-project-card"
      onClick={() => onClick(project)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="landing-project-card-title">{project.title}</span>
      <span className="landing-project-card-arrow">→</span>
    </motion.button>
  );
}

const HERO_TAGLINE_DURATION_MS = 3200;

const MainPage = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [heroPhase, setHeroPhase] = useState("tagline");
  const marqueeRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroPhase("manchui"), HERO_TAGLINE_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!marqueeRef.current) return;
    const el = marqueeRef.current;
    const width = el.scrollWidth / 2;
    let pos = 0;
    const speed = 0.4;
    let raf;
    const tick = () => {
      pos -= speed;
      if (pos <= -width) pos += width;
      el.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <AnimatePresence mode="wait">
            {heroPhase === "tagline" && (
              <motion.div
                key="tagline"
                className="landing-hero-typo"
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
              >
                {HERO_LINES.map((line, i) => (
                  <motion.p
                    key={line}
                    className="landing-hero-line"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.4 + i * 0.18,
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {line}
                  </motion.p>
                ))}
              </motion.div>
            )}
            {heroPhase === "manchui" && (
              <motion.p
                key="manchui"
                className="landing-hero-line landing-hero-manchui"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                MANCHUI
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* About */}
      <SectionFade className="landing-about">
        <h2 className="landing-about-title">만가지를 취하다, 만취</h2>
        <p className="landing-about-text">
          한양대학교 ERICA 중앙동아리 소속 종합예술댄스동아리 만취는 &quot;만가지를 취하다&quot;라는 뜻으로
          여러 장르의 춤을 섭렵하겠다는 의미를 가진 댄스 동아리입니다. 힙합을 베이스로, K-pop, 걸리쉬,
          여러 댄서들의 코레오, 왁킹, 락킹, 팝핀, 보깅까지 다양한 장르의 스트릿댄스를 도전해오고 있습니다.
          춤에 대한 열정만 있다면 누구나 만취에 들어와 함께 배우고, 공유하며, 춤출 수 있습니다.
        </p>
      </SectionFade>

      {/* Awards */}
      <SectionFade className="landing-awards">
        <h2 className="landing-section-title">수상 경력</h2>
        <div className="landing-awards-grid">
          {AWARDS.map(({ year, items }) => (
            <div key={year} className="landing-awards-year">
              <h3 className="landing-awards-year-title">{year}</h3>
              <ul className="landing-awards-list">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionFade>

      {/* Projects - marquee + modal */}
      <section className="landing-projects">
        <h2 className="landing-section-title landing-projects-title">진행 사업</h2>
        <div className="landing-marquee-wrap">
          <div className="landing-marquee" ref={marqueeRef}>
            {[...PROJECTS, ...PROJECTS].map((project, i) => (
              <ProjectCard
                key={`${project.title}-${i}`}
                project={project}
                onClick={setSelectedProject}
              />
            ))}
          </div>
        </div>
        {selectedProject && (
          <div
            className="landing-project-modal-backdrop"
            onClick={() => setSelectedProject(null)}
            onKeyDown={(e) => e.key === "Escape" && setSelectedProject(null)}
            role="dialog"
            aria-modal="true"
            aria-label="사업 상세"
          >
            <motion.div
              className="landing-project-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <h3>{selectedProject.title}</h3>
              <p>{selectedProject.description}</p>
              <button
                type="button"
                className="landing-project-modal-close"
                onClick={() => setSelectedProject(null)}
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </section>
    </div>
  );
};

export default MainPage;
