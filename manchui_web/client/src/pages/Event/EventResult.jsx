import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5";
import { EVENT_GENRES } from "./eventData";
import { EVENT_VOTE_KEY, getEventStatus } from "../../api/eventApi";
import "./Event.css";

const EventResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState({ votes: {}, myVote: window.localStorage.getItem(EVENT_VOTE_KEY) });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const genreId = location.state?.genreId ?? status.myVote;
  const selectedGenre = EVENT_GENRES.find(({ id }) => id === genreId) ?? null;
  const votes = status.votes;
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const nextStatus = await getEventStatus();
        if (!active) return;
        setStatus(nextStatus);
        if (nextStatus.myVote) window.localStorage.setItem(EVENT_VOTE_KEY, nextStatus.myVote);
        setErrorMessage("");
      } catch {
        if (active) setErrorMessage("투표 현황을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStatus();
    const timer = window.setInterval(loadStatus, 15_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main className="event-page">
      <section className="event-phone event-result" aria-label="가두모집 투표 결과">
        <header className="event-result__header">
          <button type="button" className="event-icon-button" aria-label="투표 화면으로 돌아가기" onClick={() => navigate("/event")}><IoArrowBack /></button>
          <span>투표 결과</span>
          <span aria-hidden />
        </header>

        <div className="event-result__hero">
          <IoCheckmarkCircle />
          <strong>{location.state?.genreId && selectedGenre ? `${selectedGenre.name}에 투표했어요` : "현재 투표 현황"}</strong>
          <span>{selectedGenre ? "나의 선택과 현재 결과를 확인해보세요." : "장르별 현재 득표 결과예요."}</span>
        </div>

        {errorMessage ? <p className="event-result__message" role="alert">{errorMessage}</p> : null}
        {loading ? <p className="event-result__message">투표 현황을 불러오는 중...</p> : null}

        <div className="event-result__list">
          {EVENT_GENRES.map((genre) => {
            const genreVotes = votes[genre.id] ?? 0;
            const percentage = totalVotes ? Math.round((genreVotes / totalVotes) * 100) : 0;
            const isSelected = genre.id === selectedGenre?.id;
            return (
              <article key={genre.id} className={isSelected ? "is-selected" : ""}>
                <img src={genre.gif} alt="" />
                <div>
                  <header><strong>{genre.name}</strong><span>{percentage}%</span></header>
                  <div className="event-result__bar"><span style={{ width: `${percentage}%` }} /></div>
                  <small>{genreVotes}표{isSelected ? " · 나의 선택" : ""}</small>
                </div>
              </article>
            );
          })}
        </div>
        <div className="event-result__join">
          <button type="button" onClick={() => navigate("/join/form")}>만취 가입하러 가기</button>
        </div>
      </section>
    </main>
  );
};

export default EventResult;
