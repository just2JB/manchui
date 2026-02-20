import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Joincheck.css";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const JoinCheck = () => {
  const [studentId, setStudentId] = useState("");
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const submitButtonRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = studentId.replace(/\D/g, "");
    if (trimmed.length !== 10) {
      setError("학번을 10자리 숫자로 입력해주세요.");
      setList(null);
      return;
    }
    setError(null);
    setLoading(true);
    setList(null);
    if (!serverUrl) {
      setError("연결 설정을 확인해주세요.");
      setLoading(false);
      return;
    }
    axios
      .get(`${serverUrl}/api/join/check/${trimmed}`)
      .then((res) => {
        setList(res.data.list || []);
        setLoading(false);
      })
      .catch((err) => {
        setList(null);
        setError(
          err.response?.data?.message ||
            "확인에 실패했습니다. 학번을 확인해주세요.",
        );
        setLoading(false);
      });
  };

  return (
    <div className="joinCheck">
      <div className="joinCheckInner">
        <h1 className="joinCheckTitle">가입 확인</h1>
        <p className="joinCheckDesc">
          학번을 입력하면 해당 학번으로 신청한 가입 내역을 확인할 수 있습니다.
        </p>

        <form className="joinCheckForm" onSubmit={handleSubmit}>
          <label htmlFor="joincheck-studentid" className="joinCheckLabel">
            학번
          </label>
          <input
            id="joincheck-studentid"
            type="text"
            inputMode="numeric"
            placeholder="10자리 학번 입력"
            value={studentId}
            onChange={(e) =>
              setStudentId(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            maxLength={10}
            className="joinCheckInput"
            onFocus={() =>
              submitButtonRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
          />
          <button
            ref={submitButtonRef}
            type="submit"
            className="joinCheckSubmit"
            disabled={loading}
          >
            {loading ? "확인 중…" : "확인"}
          </button>
        </form>

        {error && <p className="joinCheckError">{error}</p>}

        {list && list.length > 0 && (
          <div className="joinCheckResult">
            <h2 className="joinCheckResultTitle">
              신청 내역 ({list.length}건)
            </h2>
            <ul className="joinCheckList">
              {list.map((item, index) => (
                <li key={index} className="joinCheckCard">
                  <div className="joinCheckCardRow joinCheckCardDate">
                    <span className="joinCheckCardLabel">신청일</span>
                    <span>{formatDate(item.applyAt)}</span>
                  </div>
                  <div className="joinCheckCardRow">
                    <span className="joinCheckCardLabel">이름</span>
                    <span>{item.name || "-"}</span>
                  </div>
                  <div className="joinCheckCardRow">
                    <span className="joinCheckCardLabel">전공</span>
                    <span>{item.major || "-"}</span>
                  </div>
                  <div className="joinCheckCardRow">
                    <span className="joinCheckCardLabel">기수</span>
                    <span>{item.generation ?? "-"}기</span>
                  </div>
                  <div className="joinCheckCardRow">
                    <span className="joinCheckCardLabel">상태</span>
                    <span
                      className={`joinCheckStatus status-${(item.status || "신청").replace(/ /g, "")}`}
                    >
                      {item.status || "신청"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {list && list.length === 0 && !error && (
          <p className="joinCheckNoResult">신청 내역이 없습니다.</p>
        )}

        <div className="joinCheckFooter">
          <Link to="/join" className="joinCheckBack">
            ← 가입하기로 돌아가기
          </Link>
        </div>

        <Link
          to="/login"
          state={{ redirectTo: "/admin" }}
          className="joinCheckAdminLink"
        >
          관리자
        </Link>
      </div>
    </div>
  );
};

export default JoinCheck;
