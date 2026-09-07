import { useCallback, useEffect, useMemo, useState } from "react";
import { IoChatbubbleOutline, IoRefreshOutline, IoTrashOutline } from "react-icons/io5";
import apiClient from "../../api/apiClient";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { EVENT_GENRES } from "../Event/eventData";
import "./AdminEvent.css";

const EMPTY_DATA = { votes: {}, totalVotes: 0, comments: [], recentVotes: [] };

const formatDateTime = (value) => value
  ? new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })
  : "-";

const AdminEvent = () => {
  const manchuiModal = useManchuiModal();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

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
        <article><span>전체 댓글</span><strong>{data.comments.length}</strong><small>개 등록</small></article>
        <article><span>현재 1위</span><strong>{EVENT_GENRES.reduce((top, genre) => (data.votes[genre.id] ?? 0) > (data.votes[top.id] ?? 0) ? genre : top, EVENT_GENRES[0]).name}</strong><small>실시간 기준</small></article>
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
            <thead><tr><th>장르</th><th>인증 유형</th><th>투표 시각</th></tr></thead>
            <tbody>
              {data.recentVotes.length ? data.recentVotes.map((vote) => (
                <tr key={vote.id}><td><span className="adminEvent__genre">{genreMap.get(vote.genreId)?.name ?? vote.genreId}</span></td><td>{vote.identifierType === "phone" ? "전화번호" : "카카오톡 ID"}</td><td>{formatDateTime(vote.createdAt)}</td></tr>
              )) : <tr><td colSpan="3" className="adminEvent__empty">아직 투표가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminEvent;
