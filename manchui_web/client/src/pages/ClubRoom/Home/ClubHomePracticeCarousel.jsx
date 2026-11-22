import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IoChevronBack, IoChevronForward, IoLocationOutline } from "react-icons/io5";

/**
 * 홈 '다가오는 연습': 연습마다 카드 한 장, 옆으로 밀어서 넘긴다.
 * 다음 카드가 살짝 보여서 넘길 수 있다는 게 드러나고, 위에 몇 번째인지 표시.
 */
export default function ClubHomePracticeCarousel({
  practices,
  teamsCount,
  formatWhen,
  formatTime,
  formatPlace,
}) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const count = practices.length;

  // 스크롤 위치 → 지금 보이는 카드 번호
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const slide = track.firstElementChild;
        if (!slide) return;
        const step = slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || "0");
        setIndex(Math.min(count - 1, Math.max(0, Math.round(track.scrollLeft / step))));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  const goTo = (next) => {
    const track = trackRef.current;
    const slide = track?.children[next];
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft - track.firstElementChild.offsetLeft, behavior: "smooth" });
  };

  return (
    <section className="dHero" aria-labelledby="dhero-title">
      <div className="dHero__eyebrow">
        <h2 id="dhero-title">다가오는 연습</h2>
        {count > 1 ? (
          <div className="dHero__nav">
            <span className="dHero__count" aria-live="polite">
              {index + 1} / {count}
            </span>
            <button type="button" className="dHero__arrow" onClick={() => goTo(index - 1)}
              disabled={index === 0} aria-label="이전 연습">
              <IoChevronBack aria-hidden="true" />
            </button>
            <button type="button" className="dHero__arrow" onClick={() => goTo(index + 1)}
              disabled={index >= count - 1} aria-label="다음 연습">
              <IoChevronForward aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {count === 0 ? (
        <div className="dHero__empty">
          <p className="dHero__time dHero__time--empty">예정된 연습이 없어요</p>
          <Link className="dHero__cta" to="/club/team">{teamsCount ? "팀에서 연습 잡기" : "팀 만들기"}</Link>
        </div>
      ) : (
        <ol className="dHero__track" ref={trackRef} data-single={count === 1 || undefined} aria-label="연습 목록, 옆으로 넘겨 보기">
          {practices.map((practice, i) => (
            <li key={practice._id ?? `${practice.dateKey}-${practice.time}-${i}`} className="dHero__slide"
              style={{ "--team": practice.teamColor }} aria-label={`${i + 1}번째 연습`}>
              <p className="dHero__when">{formatWhen(practice.dateKey)}</p>
              <p className="dHero__team"><i aria-hidden="true" />{practice.teamName}</p>
              <p className="dHero__time">{formatTime(practice.time)}</p>
              <p className="dHero__place">
                <IoLocationOutline aria-hidden="true" />
                {formatPlace(practice.place)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
