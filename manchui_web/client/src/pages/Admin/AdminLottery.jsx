import React, { useCallback, useEffect, useMemo, useState } from "react";
import apiClient, { serverUrl } from "../../api/apiClient";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import "./AdminLottery.css";

const newPrizeRow = () => ({
  _id: `tmp-p-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  label: "",
  winnerCount: 1,
});

const newParticipantRow = () => ({
  _id: `tmp-u-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: "",
  entries: 1,
});

const sortResultsByNameKo = (results) =>
  [...results].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), "ko"),
  );

const formatDrawnAt = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const AdminLottery = () => {
  const manchuiModal = useManchuiModal();
  const [prizes, setPrizes] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [lastDraw, setLastDraw] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState("");

  const totalWinners = useMemo(
    () =>
      prizes.reduce(
        (sum, p) => sum + Math.max(0, Number(p.winnerCount) || 0),
        0,
      ),
    [prizes],
  );

  const sortedDrawResults = useMemo(() => {
    if (!lastDraw?.results?.length) return [];
    return sortResultsByNameKo(lastDraw.results);
  }, [lastDraw]);

  const fetchConfig = useCallback(async () => {
    if (!serverUrl) {
      setLoading(false);
      setError("서버 URL이 설정되지 않았습니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/api/lottery/config");
      setPrizes(res.data.prizes?.length ? res.data.prizes : [newPrizeRow()]);
      setParticipants(
        res.data.participants?.length
          ? res.data.participants
          : [newParticipantRow()],
      );
      const draw = res.data.lastDraw ?? null;
      setLastDraw(draw);
      setShowResults(Boolean(draw?.results?.length));
    } catch (err) {
      setError(err.response?.data?.message || "설정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const buildPayload = () => {
    const cleanPrizes = prizes
      .map((p) => ({
        label: String(p.label || "").trim(),
        winnerCount: Math.max(0, Number(p.winnerCount) || 0),
      }))
      .filter((p) => p.label);
    const cleanParticipants = participants
      .map((p) => ({
        name: String(p.name || "").trim(),
        entries: Math.max(1, Number(p.entries) || 1),
      }))
      .filter((p) => p.name);
    return { cleanPrizes, cleanParticipants };
  };

  const handleSave = async () => {
    const { cleanPrizes, cleanParticipants } = buildPayload();
    const winnerTotal = cleanPrizes.reduce(
      (sum, p) => sum + p.winnerCount,
      0,
    );

    if (!cleanPrizes.length) {
      await manchuiModal("상품 이름을 입력해 주세요.");
      return;
    }
    if (!cleanParticipants.length) {
      await manchuiModal("참여자 이름을 입력해 주세요.");
      return;
    }
    if (cleanParticipants.length < winnerTotal) {
      await manchuiModal(
        `참여자(${cleanParticipants.length}명)가 당첨 인원(${winnerTotal}명)보다 적습니다.`,
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await apiClient.put("/api/lottery/config", {
        prizes: cleanPrizes,
        participants: cleanParticipants,
      });
      setPrizes(res.data.prizes);
      setParticipants(res.data.participants);
      setLastDraw(res.data.lastDraw ?? null);
      await manchuiModal("저장되었습니다.");
    } catch (err) {
      const msg = err.response?.data?.message || "저장에 실패했습니다.";
      setError(msg);
      await manchuiModal(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDraw = async () => {
    const { cleanPrizes, cleanParticipants } = buildPayload();
    const winnerTotal = cleanPrizes.reduce(
      (sum, p) => sum + p.winnerCount,
      0,
    );
    if (!cleanPrizes.length || !cleanParticipants.length) {
      await manchuiModal("상품·참여자를 입력한 뒤 추첨해 주세요.");
      return;
    }
    if (cleanParticipants.length < winnerTotal) {
      await manchuiModal(
        `참여자(${cleanParticipants.length}명)가 당첨 인원(${winnerTotal}명)보다 적습니다.`,
      );
      return;
    }
    if (
      !(await manchuiModal(
        `가중치 추첨을 진행합니다.\n당첨 ${winnerTotal}명 · 1인 1상품\n\n진행할까요?`,
        "confirm",
      ))
    ) {
      return;
    }

    setDrawing(true);
    setError("");
    try {
      const res = await apiClient.post("/api/lottery/draw", {
        prizes: cleanPrizes,
        participants: cleanParticipants,
      });
      setLastDraw({
        drawnAt: res.data.drawnAt,
        results: res.data.results,
      });
      setShowResults(true);
    } catch (err) {
      const msg = err.response?.data?.message || "추첨에 실패했습니다.";
      setError(msg);
      await manchuiModal(msg);
    } finally {
      setDrawing(false);
    }
  };

  const updatePrize = (id, field, value) => {
    setPrizes((prev) =>
      prev.map((p) => (p._id === id ? { ...p, [field]: value } : p)),
    );
  };

  const updateParticipant = (id, field, value) => {
    setParticipants((prev) =>
      prev.map((p) => (p._id === id ? { ...p, [field]: value } : p)),
    );
  };

  if (loading) {
    return (
      <div className="adminLottery">
        <h1 className="admin-page-heading">상품 추첨</h1>
        <p className="adminLottery__loading">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="adminLottery">
      <h1 className="admin-page-heading">상품 추첨</h1>
      <div className="adminLottery__rules" role="note" aria-label="추첨 규칙 안내">
        <section className="adminLottery__ruleBlock">
          <h2 className="adminLottery__ruleTitle">
            <span className="adminLottery__ruleMark" aria-hidden>
              ❗
            </span>
            중복 참여 가능!
          </h2>
          <ul className="adminLottery__ruleList">
            <li>참여 횟수만큼 상품 당첨 확률이 올라갑니다.</li>
            <li>
              <em>최대 &lsquo;3번&rsquo;까지만 인정 가능합니다!</em>
            </li>
            <li>
              <em>같은 멤버로는 1곡만 가능합니다!</em>
            </li>
          </ul>
        </section>
        <section className="adminLottery__ruleBlock">
          <h2 className="adminLottery__ruleTitle">
            <span className="adminLottery__ruleMark" aria-hidden>
              ❗
            </span>
            당첨 상품은 1인 1개!
          </h2>
          <p className="adminLottery__ruleText">
            당첨 확률만 올라갈 뿐, 상품은 1인 1개입니다.
          </p>
        </section>
      </div>

      <p className="adminLottery__lead">
        가중치: 1회→1 · 2회→2 · 3회 이상→3. 당첨자 선정 후 상품은 무작위로
        1인 1개씩 배정합니다. 상품·참여자 목록은 &lsquo;목록 저장&rsquo;으로
        보관할 수 있습니다.
      </p>

      {error ? <p className="adminLottery__error">{error}</p> : null}

      <div className="adminLottery__stats">
        <span>
          당첨 인원: <strong>{totalWinners}명</strong>
        </span>
        <span>
          참여자: <strong>{participants.filter((p) => p.name?.trim()).length}명</strong>
        </span>
        <span>
          가중치: <strong>1회=1 · 2회=2 · 3회+=3</strong>
        </span>
      </div>

      <div className="adminLottery__toolbar">
        <button
          type="button"
          className="adminLottery__btn adminLottery__btn--primary"
          onClick={handleSave}
          disabled={saving || drawing}
        >
          {saving ? "저장 중…" : "목록 저장"}
        </button>
        <button
          type="button"
          className="adminLottery__btn adminLottery__btn--draw"
          onClick={handleDraw}
          disabled={saving || drawing || totalWinners < 1}
        >
          {drawing ? "추첨 중…" : "랜덤 추첨 실행"}
        </button>
        <button
          type="button"
          className="adminLottery__btn"
          onClick={() => void fetchConfig()}
          disabled={saving || drawing}
        >
          새로고침
        </button>
      </div>

      <div className="adminLottery__grid">
        <section className="adminLottery__panel">
          <h2 className="adminLottery__panelTitle">상품</h2>
          <p className="adminLottery__hint">상품명 · 당첨 인원(명)</p>
          <div className="adminLottery__tableWrap">
            <table className="adminLottery__table">
              <thead>
                <tr>
                  <th>상품</th>
                  <th>인원</th>
                  <th aria-label="삭제" />
                </tr>
              </thead>
              <tbody>
                {prizes.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <input
                        className="adminLottery__input"
                        value={p.label}
                        onChange={(e) =>
                          updatePrize(p._id, "label", e.target.value)
                        }
                        placeholder="상품명"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="adminLottery__input adminLottery__input--num"
                        value={p.winnerCount}
                        onChange={(e) =>
                          updatePrize(
                            p._id,
                            "winnerCount",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="adminLottery__rowDel"
                        onClick={() =>
                          setPrizes((prev) =>
                            prev.length > 1
                              ? prev.filter((x) => x._id !== p._id)
                              : prev,
                          )
                        }
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="adminLottery__addRow"
            onClick={() => setPrizes((prev) => [...prev, newPrizeRow()])}
          >
            + 상품 추가
          </button>
        </section>

        <section className="adminLottery__panel adminLottery__panel--participants">
          <h2 className="adminLottery__panelTitle">참여자</h2>
          <p className="adminLottery__hint">이름 · 참여 횟수</p>
          <div className="adminLottery__tableWrap adminLottery__tableWrap--scroll">
            <table className="adminLottery__table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>참여</th>
                  <th aria-label="삭제" />
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <input
                        className="adminLottery__input"
                        value={p.name}
                        onChange={(e) =>
                          updateParticipant(p._id, "name", e.target.value)
                        }
                        placeholder="이름"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className="adminLottery__input adminLottery__input--num"
                        value={p.entries}
                        onChange={(e) =>
                          updateParticipant(
                            p._id,
                            "entries",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="adminLottery__rowDel"
                        onClick={() =>
                          setParticipants((prev) =>
                            prev.length > 1
                              ? prev.filter((x) => x._id !== p._id)
                              : prev,
                          )
                        }
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="adminLottery__addRow"
            onClick={() =>
              setParticipants((prev) => [...prev, newParticipantRow()])
            }
          >
            + 참여자 추가
          </button>
        </section>
      </div>

      {sortedDrawResults.length && showResults ? (
        <section className="adminLottery__results">
          <div className="adminLottery__resultsHead">
            <div>
              <h2 className="adminLottery__resultsTitle">추첨 결과</h2>
              <p className="adminLottery__resultsMeta">
                {formatDrawnAt(lastDraw.drawnAt)} · 총{" "}
                {sortedDrawResults.length}명
              </p>
            </div>
            <button
              type="button"
              className="adminLottery__resultsClose"
              onClick={() => setShowResults(false)}
              aria-label="추첨 결과 닫기"
            >
              닫기
            </button>
          </div>
          <div className="adminLottery__tableWrap adminLottery__resultsTable">
            <table className="adminLottery__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>이름</th>
                  <th>상품</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrawResults.map((r, i) => (
                  <tr key={`${r.name}-${r.prize}-${i}`}>
                    <td>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.prize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {sortedDrawResults.length && !showResults ? (
        <button
          type="button"
          className="adminLottery__resultsReopen"
          onClick={() => setShowResults(true)}
        >
          추첨 결과 보기 ({sortedDrawResults.length}명)
        </button>
      ) : null}
    </div>
  );
};

export default AdminLottery;
