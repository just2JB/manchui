import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoArrowUndoSharp, IoChatbubble, IoClose, IoSend, IoShareOutline, IoStatsChart } from "react-icons/io5";
import "./Event.css";
import { EVENT_GENRES } from "./eventData";
import { EVENT_VOTE_KEY, getEventComments, getEventStatus, submitEventComment, submitEventVote } from "../../api/eventApi";

const getCurrentHourLabel = () =>
  `${String(new Date().getHours()).padStart(2, "0")}:00`;

const Event = () => {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [currentHour, setCurrentHour] = useState(getCurrentHourLabel);
  const [comments, setComments] = useState([]);
  const [commentGenreId, setCommentGenreId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [pendingVote, setPendingVote] = useState(null);
  const [voterIdentifier, setVoterIdentifier] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [infoGenre, setInfoGenre] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [myVote, setMyVote] = useState(() => window.localStorage.getItem(EVENT_VOTE_KEY));
  const [submitting, setSubmitting] = useState(false);
  const [eventError, setEventError] = useState("");

  const commentGenre = EVENT_GENRES.find(({ id }) => id === commentGenreId);

  useEffect(() => {
    const timer = window.setInterval(
      () => setCurrentHour(getCurrentHourLabel()),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const introTimer = window.setTimeout(() => setShowIntro(false), 1_650);
    return () => window.clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getEventStatus(), getEventComments()])
      .then(([status, nextComments]) => {
        if (!active) return;
        setComments(nextComments);
        if (status.myVote) {
          setMyVote(status.myVote);
          window.localStorage.setItem(EVENT_VOTE_KEY, status.myVote);
        }
      })
      .catch(() => {
        if (active) setEventError("이벤트 정보를 불러오지 못했습니다.");
      });
    return () => { active = false; };
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "만취 가두모집 장르 투표", url: window.location.href });
      } catch (error) {
        if (error?.name !== "AbortError") console.error("이벤트 공유에 실패했습니다.", error);
      }
    }
  };

  const handleVote = (genre) => {
    if (myVote) {
      navigate("/event/result");
      return;
    }
    setVoterIdentifier("");
    setPrivacyConsent(false);
    setEventError("");
    setPendingVote(genre);
  };

  const confirmVote = async () => {
    const normalizedIdentifier = voterIdentifier.trim();
    if (!pendingVote || submitting) return;
    if (!normalizedIdentifier) {
      setEventError("카카오톡 ID 또는 전화번호를 입력해주세요.");
      return;
    }
    if (!privacyConsent) {
      setEventError("개인정보 수집·이용에 동의해주세요.");
      return;
    }
    const genre = pendingVote;
    setSubmitting(true);
    setEventError("");
    try {
      await submitEventVote(genre.id, normalizedIdentifier, privacyConsent);
      window.localStorage.setItem(EVENT_VOTE_KEY, genre.id);
      setMyVote(genre.id);
      setPendingVote(null);
      navigate("/event/result", { state: { genreId: genre.id } });
    } catch (error) {
      const existingVote = error.response?.data?.myVote;
      if (error.response?.status === 409 && existingVote) {
        window.localStorage.setItem(EVENT_VOTE_KEY, existingVote);
        setMyVote(existingVote);
        setPendingVote(null);
        navigate("/event/result");
      } else {
        setEventError(error.response?.data?.message ?? "투표를 저장하지 못했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openComments = (genreId) => {
    setCommentGenreId(genreId);
    setCommentText("");
  };

  const closeComments = () => {
    setCommentGenreId("");
    setCommentText("");
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    const nextComment = commentText.trim();
    if (!nextComment || !commentGenreId || submitting) return;
    setSubmitting(true);
    setEventError("");
    try {
      const createdComment = await submitEventComment(commentGenreId, nextComment);
      setComments((currentComments) => [createdComment, ...currentComments]);
      setCommentText("");
    } catch (error) {
      setEventError(error.response?.data?.message ?? "댓글을 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="event-page">
      {showIntro ? (
        <div className="event-intro" aria-label="만취 장르 투표 불러오는 중" aria-live="polite">
          <span className="event-intro__glow" aria-hidden />
          <img src="/logos/longLogo_red.png" alt="만취" />
          <p>2026-2 가두모집</p>
        </div>
      ) : null}
      <section className="event-phone" aria-label="가두모집 장르 투표">
        <header className="event-toolbar">
          <button type="button" className="event-icon-button" aria-label="가입 페이지로 돌아가기" onClick={() => navigate("/join")}><IoArrowBack /></button>
          <button type="button" className="event-icon-button" aria-label="현재 투표 현황" onClick={() => navigate("/event/result")}><IoStatsChart /></button>
          <div className="event-title-button"><span>가두모집 투표</span></div>
          <button type="button" className="event-icon-button" aria-label="공유하기" onClick={handleShare}><IoShareOutline /></button>
          <button type="button" className="event-icon-button" aria-label="전체 댓글 보기" onClick={() => setShowAllComments(true)}><IoChatbubble /></button>
        </header>

        <div className="event-pagination" aria-hidden>
          {EVENT_GENRES.map(({ id }, index) => (
            <span
              key={id}
              className={index === EVENT_GENRES.length - 1 ? "is-active" : ""}
            />
          ))}
        </div>

        <div className="event-grid" role="group" aria-label="보고 싶은 장르 선택">
          {EVENT_GENRES.map((genre) => {
            const genreComments = comments.filter((comment) => comment.genreId === genre.id);
            const latestComment = genreComments[0];
            const isMyVote = myVote === genre.id;
            return (
              <article key={genre.id} className={`event-genre${isMyVote ? " event-genre--selected" : ""}`}>
                <img className="event-genre__gif" src={genre.gif} alt="" loading="eager" />
                <span className="event-genre__top"><span className="event-genre__avatar">{genre.name[0]}</span>{genre.name}</span>
                <button type="button" className="event-genre__center" aria-label={`${genre.name} 장르 설명 보기`} onClick={() => setInfoGenre(genre)}><strong>{genre.nameEn}</strong><small>{currentHour}</small></button>
                <button type="button" className="event-genre__heart" aria-label={`${genre.name}에 투표하기`} onClick={() => handleVote(genre)}>
                  <span aria-hidden>{isMyVote ? "♥" : "♡"}</span>
                </button>
                <button type="button" className="event-genre__comment-action" aria-label={`${genre.name} 댓글 작성하기`} onClick={() => openComments(genre.id)}>
                  <IoArrowUndoSharp />
                </button>
                {latestComment ? (
                  <button type="button" className="event-genre__comment" aria-label={`${genre.name} 댓글 보기: ${latestComment.content}`} onClick={() => openComments(genre.id)}>
                    <span className="event-genre__comment-bubble">{latestComment.content}</span>
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>

        {commentGenre ? (
          <div className="event-comments" role="dialog" aria-modal="true" aria-labelledby="event-comment-title">
            <button type="button" className="event-comments__backdrop" aria-label="댓글 창 닫기" onClick={closeComments} />
            <section className="event-comments__panel">
              <header>
                <div><span className="event-genre__avatar">{commentGenre.name[0]}</span><strong id="event-comment-title">{commentGenre.name} 댓글</strong></div>
                <button type="button" aria-label="댓글 창 닫기" onClick={closeComments}><IoClose /></button>
              </header>
              <div className="event-comments__list">
                {comments.some((comment) => comment.genreId === commentGenre.id) ? comments.filter((comment) => comment.genreId === commentGenre.id).map((comment) => (
                  <p key={comment.id}><span className="event-comments__mini-avatar"><IoChatbubble /></span><span>{comment.content}</span></p>
                )) : <span className="event-comments__empty">첫 댓글을 남겨보세요.</span>}
              </div>
              {eventError ? <p className="event-comments__error" role="alert">{eventError}</p> : null}
              <form onSubmit={handleCommentSubmit}>
                <input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={40} placeholder={`${commentGenre.name}에 댓글 달기`} aria-label="댓글 내용" autoFocus />
                <button type="submit" aria-label="댓글 등록" disabled={!commentText.trim() || submitting}><IoSend /></button>
              </form>
            </section>
          </div>
        ) : null}

        {showAllComments ? (
          <div className="event-comments" role="dialog" aria-modal="true" aria-labelledby="event-all-comments-title">
            <button type="button" className="event-comments__backdrop" aria-label="전체 댓글 닫기" onClick={() => setShowAllComments(false)} />
            <section className="event-comments__panel event-comments__panel--all">
              <header>
                <div><span className="event-genre__avatar"><IoChatbubble /></span><strong id="event-all-comments-title">전체 댓글</strong></div>
                <button type="button" aria-label="전체 댓글 닫기" onClick={() => setShowAllComments(false)}><IoClose /></button>
              </header>
              <div className="event-comments__list">
                {comments.length ? comments.map((comment) => {
                  const genre = EVENT_GENRES.find(({ id }) => id === comment.genreId);
                  return (
                    <p key={comment.id} className="event-comments__all-item">
                      <span className="event-comments__mini-avatar"><IoChatbubble /></span>
                      <span><small>{genre?.name ?? comment.genreId}</small>{comment.content}</span>
                    </p>
                  );
                }) : <span className="event-comments__empty">아직 등록된 댓글이 없습니다.</span>}
              </div>
            </section>
          </div>
        ) : null}

        {pendingVote ? (
          <div className="event-vote-modal" role="dialog" aria-modal="true" aria-labelledby="event-vote-title">
            <button type="button" className="event-vote-modal__backdrop" aria-label="투표 확인창 닫기" onClick={() => setPendingVote(null)} />
            <section className="event-vote-modal__card">
              <div className="event-vote-modal__preview">
                <img src={pendingVote.gif} alt="" />
                <span>{pendingVote.nameEn}</span>
              </div>
              <div className="event-vote-modal__content">
                <span className="event-vote-modal__eyebrow">GENRE VOTE</span>
                <h2 id="event-vote-title"><strong>{pendingVote.name}</strong>을<br />투표하시겠습니까?</h2>
                <p>중복 투표 방지를 위해 본인 확인 정보를 입력해주세요.</p>
                <label className="event-vote-modal__field">
                  <span>카카오톡 ID 또는 전화번호</span>
                  <input
                    type="text"
                    value={voterIdentifier}
                    onChange={(event) => setVoterIdentifier(event.target.value)}
                    maxLength={30}
                    placeholder="예: manchui2026 또는 010-1234-5678"
                    autoComplete="off"
                  />
                  <small>입력 정보는 암호화되어 중복 확인과 당첨자 연락에만 사용돼요.</small>
                </label>
                <label className="event-vote-modal__consent">
                  <input type="checkbox" checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} />
                  <span><strong>[필수]</strong> 개인정보 수집·이용에 동의합니다.</span>
                </label>
                <details className="event-vote-modal__privacy">
                  <summary>개인정보 수집·이용 안내 보기</summary>
                  <dl>
                    <div><dt>수집 항목</dt><dd>카카오톡 ID 또는 전화번호</dd></div>
                    <div><dt>이용 목적</dt><dd>본인 확인, 중복 투표 방지, 당첨자 선정 및 연락</dd></div>
                    <div><dt>보유 기간</dt><dd>2026년 10월 11일까지</dd></div>
                  </dl>
                  <p>동의를 거부할 수 있으나, 거부 시 투표 참여가 제한됩니다. 식별정보는 암호화해 보관하고 임원진만 당첨자 확인 목적으로 조회할 수 있습니다.</p>
                </details>
                <div className="event-vote-modal__actions">
                  <button type="button" onClick={() => setPendingVote(null)}>취소</button>
                  <button type="button" onClick={confirmVote} disabled={submitting || !voterIdentifier.trim() || !privacyConsent}>{submitting ? "투표 중..." : "투표하기"}</button>
                </div>
                {eventError ? <p className="event-vote-modal__error" role="alert">{eventError}</p> : null}
              </div>
            </section>
          </div>
        ) : null}

        {infoGenre ? (
          <div className="event-info-modal" role="dialog" aria-modal="true" aria-labelledby="event-info-title">
            <button type="button" className="event-info-modal__backdrop" aria-label="장르 설명 닫기" onClick={() => setInfoGenre(null)} />
            <section className="event-info-modal__card">
              <div className="event-info-modal__visual">
                <img src={infoGenre.gif} alt="" />
                <button type="button" aria-label="장르 설명 닫기" onClick={() => setInfoGenre(null)}><IoClose /></button>
                <span>{infoGenre.nameEn}</span>
              </div>
              <div className="event-info-modal__content">
                <span>STREET DANCE GENRE</span>
                <h2 id="event-info-title">{infoGenre.name}</h2>
                <p>{infoGenre.description}</p>
                <button type="button" onClick={() => { setInfoGenre(null); setVoterIdentifier(""); setPrivacyConsent(false); setEventError(""); setPendingVote(infoGenre); }}>{infoGenre.name} 투표하기</button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default Event;
