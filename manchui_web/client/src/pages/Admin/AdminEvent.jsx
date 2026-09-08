import { useCallback, useEffect, useMemo, useState } from "react";
import { IoChatbubbleOutline, IoClose, IoEyeOutline, IoGiftOutline, IoRefreshOutline, IoTrashOutline } from "react-icons/io5";
import apiClient from "../../api/apiClient";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { EVENT_GENRES } from "../Event/eventData";
import "./AdminEvent.css";

const EMPTY_DATA = { votes: {}, totalVotes: 0, eligibleVoteCount: 0, comments: [], recentVotes: [], lastDraw: null };

const formatDateTime = (value) => value
  ? new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })
  : "-";

const AdminEvent = () => {
  const manchuiModal = useManchuiModal();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [prizes, setPrizes] = useState([{ id: 1, name: "", winnerCount: 1 }]);
  const [voteDetail, setVoteDetail] = useState(null);

  const genreMap = useMemo(
    () => new Map(EVENT_GENRES.map((genre) => [genre.id, genre])),
    [],
  );

  const fetchEventData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: responseData } = await apiClient.get("/api/event/admin");
      setData(responseData);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "이벤트 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEventData();
  }, [fetchEventData]);

  const deleteComment = async (comment) => {
    if (!(await manchuiModal(`'${comment.content}' 댓글을 삭제할까요?`, "confirm"))) return;
    setWorking(true);
    try {
      await apiClient.delete(`/api/event/admin/comments/${comment.id}`);
      setData((current) => ({
        ...current,
        comments: current.comments.filter(({ id }) => id !== comment.id),
      }));
    } catch (requestError) {
      await manchuiModal(requestError.response?.data?.message ?? "댓글을 삭제하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const resetCollection = async (type) => {
    const isVotes = type === "votes";
    const label = isVotes ? "모든 투표" : "모든 댓글";
    if (!(await manchuiModal(`${label}을 삭제할까요?\n삭제한 데이터는 복구할 수 없습니다.`, "confirm"))) return;
    setWorking(true);
    try {
      await apiClient.delete(`/api/event/admin/${type}`);
      await fetchEventData();
      await manchuiModal(`${label}을 삭제했습니다.`);
    } catch (requestError) {
      await manchuiModal(requestError.response?.data?.message ?? `${label}을 삭제하지 못했습니다.`);
    } finally {
      setWorking(false);
    }
  };

  const drawWinners = async () => {
    const cleanPrizes = prizes.map(({ name, winnerCount }) => ({
      name: name.trim(),
      winnerCount: Number(winnerCount),
    }));
    if (cleanPrizes.some(({ name }) => !name)) {
      await manchuiModal("모든 상품명을 입력해주세요.");
      return;
    }
    if (cleanPrizes.some(({ winnerCount }) => !Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 100)) {
      await manchuiModal("상품별 당첨 인원을 1명 이상 100명 이하로 입력해주세요.");
      return;
    }
    const totalWinnerCount = cleanPrizes.reduce((sum, prize) => sum + prize.winnerCount, 0);
    if (totalWinnerCount > 100) {
      await manchuiModal("전체 당첨 인원은 100명 이하로 설정해주세요.");
      return;
    }
    if (totalWinnerCount > data.eligibleVoteCount) {
      await manchuiModal(`추첨 가능한 참여자는 ${data.eligibleVoteCount}명입니다.`);
      return;
    }
    if (!(await manchuiModal(`${cleanPrizes.length}개 상품의 당첨자 ${totalWinnerCount}명을 추첨할까요?`, "confirm"))) return;
    setWorking(true);
    try {
      const { data: draw } = await apiClient.post("/api/event/admin/draw", {
        prizes: cleanPrizes,
      });
      setData((current) => ({ ...current, lastDraw: draw }));
      await manchuiModal(`${totalWinnerCount}명의 당첨자를 추첨했습니다.`);
    } catch (requestError) {
      await manchuiModal(requestError.response?.data?.message ?? "당첨자를 추첨하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  const updatePrize = (id, field, value) => {
    setPrizes((current) => current.map((prize) => (
      prize.id === id ? { ...prize, [field]: value } : prize
    )));
  };

  const addPrize = () => {
    setPrizes((current) => [
      ...current,
      { id: Math.max(0, ...current.map(({ id }) => id)) + 1, name: "", winnerCount: 1 },
    ]);
  };

  const removePrize = (id) => {
    setPrizes((current) => current.length > 1 ? current.filter((prize) => prize.id !== id) : current);
  };

  const showVoteDetail = async (voteId) => {
    setWorking(true);
    try {
      const { data: detail } = await apiClient.get(`/api/event/admin/votes/${voteId}`);
      setVoteDetail(detail);
    } catch (requestError) {
      await manchuiModal(requestError.response?.data?.message ?? "상세정보를 불러오지 못했습니다.");
    } finally {
      setWorking(false);
    }
  };

  if (loading && !data.totalVotes && !data.comments.length) {
    return <div className="adminEvent"><h1 className="admin-page-heading">이벤트 관리</h1><p className="adminEvent__state">불러오는 중…</p></div>;
  }

  return (
    <div className="adminEvent">
      <div className="adminEvent__heading">
        <div>
          <h1 className="admin-page-heading">이벤트 관리</h1>
          <p>2026-2 가두모집 장르 투표 현황과 댓글을 관리합니다.</p>
        </div>
        <button type="button" onClick={() => void fetchEventData()} disabled={loading || working}><IoRefreshOutline /> 새로고침</button>
      </div>

      {error ? <p className="adminEvent__error" role="alert">{error}</p> : null}

      <section className="adminEvent__summary" aria-label="이벤트 요약">
        <article><span>총 투표</span><strong>{data.totalVotes ?? 0}</strong><small>명 참여</small></article>
        <article><span>추첨 대상</span><strong>{data.eligibleVoteCount ?? 0}</strong><small>연락정보 확인 가능</small></article>
        <article><span>전체 댓글</span><strong>{data.comments.length}</strong><small>개 등록</small></article>
        <article><span>현재 1위</span><strong>{EVENT_GENRES.reduce((top, genre) => (data.votes[genre.id] ?? 0) > (data.votes[top.id] ?? 0) ? genre : top, EVENT_GENRES[0]).name}</strong><small>실시간 기준</small></article>
      </section>

      <section className="adminEvent__panel adminEvent__draw">
        <div className="adminEvent__panelHead"><div><h2>당첨자 추첨</h2><p>암호화된 연락정보가 있는 투표자 중 중복 없이 무작위로 추첨합니다.</p></div></div>
        <div className="adminEvent__prizeList">
          {prizes.map((prize, index) => (
            <div className="adminEvent__prizeRow" key={prize.id}>
              <span className="adminEvent__prizeIndex">{index + 1}</span>
              <label><span>상품명</span><input value={prize.name} onChange={(event) => updatePrize(prize.id, "name", event.target.value)} maxLength={50} placeholder="예: 만취 굿즈" /></label>
              <label><span>당첨 인원</span><input type="number" min="1" max="100" value={prize.winnerCount} onChange={(event) => updatePrize(prize.id, "winnerCount", event.target.value)} /></label>
              <button type="button" className="adminEvent__removePrize" onClick={() => removePrize(prize.id)} disabled={prizes.length === 1}>삭제</button>
            </div>
          ))}
          <button type="button" className="adminEvent__addPrize" onClick={addPrize} disabled={prizes.length >= 20}>+ 상품 추가</button>
        </div>
        <div className="adminEvent__drawForm">
          <button type="button" onClick={() => void drawWinners()} disabled={working || !data.eligibleVoteCount}><IoGiftOutline /> 추첨하기</button>
        </div>
        {data.lastDraw ? (
          <div className="adminEvent__drawResult">
            <header><div><strong>최근 추첨 결과</strong><span>{formatDateTime(data.lastDraw.createdAt)} · {data.lastDraw.winners.length}명</span></div></header>
            {(data.lastDraw.prizes ?? [{ name: data.lastDraw.prizeName, winners: data.lastDraw.winners }]).map((prize, prizeIndex) => (
              <section className="adminEvent__prizeResult" key={`${prize.name}-${prizeIndex}`}>
                <h3>{prize.name}<span>{prize.winners.length}명</span></h3>
                <div className="adminEvent__winnerGrid">
                  {prize.winners.map((winner, index) => (
                    <article key={winner.id}><span className="adminEvent__winnerNumber">{index + 1}</span><div><strong>{winner.maskedIdentifier}</strong><small>{genreMap.get(winner.genreId)?.name ?? winner.genreId} · {winner.identifierType === "phone" ? "전화번호" : "카카오톡 ID"}</small></div><button type="button" onClick={() => void showVoteDetail(winner.id)} disabled={working || !winner.detailAvailable}><IoEyeOutline /> 상세보기</button></article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </section>

      <section className="adminEvent__panel">
        <div className="adminEvent__panelHead"><div><h2>장르별 투표 현황</h2><p>식별 정보 원문은 저장하거나 표시하지 않습니다.</p></div><button type="button" className="adminEvent__danger" onClick={() => void resetCollection("votes")} disabled={working || !data.totalVotes}><IoTrashOutline /> 투표 초기화</button></div>
        <div className="adminEvent__voteGrid">
          {EVENT_GENRES.map((genre) => {
            const count = data.votes[genre.id] ?? 0;
            const percentage = data.totalVotes ? Math.round((count / data.totalVotes) * 100) : 0;
            return (
              <article key={genre.id}>
                <img src={genre.gif} alt="" />
                <div><header><strong>{genre.name}</strong><span>{count}표 · {percentage}%</span></header><div className="adminEvent__bar"><span style={{ width: `${percentage}%` }} /></div></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="adminEvent__panel">
        <div className="adminEvent__panelHead"><div><h2>전체 댓글</h2><p>장르별 댓글을 최신순으로 확인할 수 있습니다.</p></div><button type="button" className="adminEvent__danger" onClick={() => void resetCollection("comments")} disabled={working || !data.comments.length}><IoTrashOutline /> 댓글 전체 삭제</button></div>
        <div className="adminEvent__tableWrap">
          <table className="adminEvent__table">
            <thead><tr><th>장르</th><th>댓글</th><th>작성 시각</th><th aria-label="관리" /></tr></thead>
            <tbody>
              {data.comments.length ? data.comments.map((comment) => (
                <tr key={comment.id}>
                  <td><span className="adminEvent__genre">{genreMap.get(comment.genreId)?.name ?? comment.genreId}</span></td>
                  <td>{comment.content}</td>
                  <td>{formatDateTime(comment.createdAt)}</td>
                  <td><button type="button" className="adminEvent__delete" onClick={() => void deleteComment(comment)} disabled={working}>삭제</button></td>
                </tr>
              )) : <tr><td colSpan="4" className="adminEvent__empty"><IoChatbubbleOutline /> 등록된 댓글이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adminEvent__panel">
        <div className="adminEvent__panelHead"><div><h2>최근 투표</h2><p>개인 식별 정보 없이 장르와 인증 유형만 표시합니다.</p></div></div>
        <div className="adminEvent__tableWrap adminEvent__tableWrap--compact">
          <table className="adminEvent__table">
            <thead><tr><th>장르</th><th>투표자</th><th>인증 유형</th><th>투표 시각</th><th aria-label="상세" /></tr></thead>
            <tbody>
              {data.recentVotes.length ? data.recentVotes.map((vote) => (
                <tr key={vote.id}><td><span className="adminEvent__genre">{genreMap.get(vote.genreId)?.name ?? vote.genreId}</span></td><td>{vote.maskedIdentifier}</td><td>{vote.identifierType === "phone" ? "전화번호" : "카카오톡 ID"}</td><td>{formatDateTime(vote.createdAt)}</td><td><button type="button" className="adminEvent__detail" onClick={() => void showVoteDetail(vote.id)} disabled={working || !vote.detailAvailable}>상세보기</button></td></tr>
              )) : <tr><td colSpan="5" className="adminEvent__empty">아직 투표가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {voteDetail ? (
        <div className="adminEvent__modal" role="dialog" aria-modal="true" aria-labelledby="admin-event-detail-title">
          <button type="button" className="adminEvent__modalBackdrop" aria-label="상세정보 닫기" onClick={() => setVoteDetail(null)} />
          <section className="adminEvent__modalCard">
            <header><h2 id="admin-event-detail-title">투표자 상세정보</h2><button type="button" aria-label="상세정보 닫기" onClick={() => setVoteDetail(null)}><IoClose /></button></header>
            <dl><div><dt>장르</dt><dd>{genreMap.get(voteDetail.genreId)?.name ?? voteDetail.genreId}</dd></div><div><dt>인증 유형</dt><dd>{voteDetail.identifierType === "phone" ? "전화번호" : "카카오톡 ID"}</dd></div><div><dt>{voteDetail.identifierType === "phone" ? "전화번호" : "카카오톡 ID"}</dt><dd className="adminEvent__identifier">{voteDetail.identifier}</dd></div><div><dt>투표 시각</dt><dd>{formatDateTime(voteDetail.createdAt)}</dd></div></dl>
            <p>당첨자 확인과 연락 목적에만 사용해주세요.</p>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default AdminEvent;
