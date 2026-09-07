import React from "react";
import "./Join.css";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "../../context/AppSettingsContext";
import { LOADING_TEXT } from "../../constants/loadingText";

const Join = () => {
  const nav = useNavigate();
  const { joinConfig, joinConfigLoading } = useAppSettings();
  const [showEventPopup, setShowEventPopup] = React.useState(
    () => Date.now() < new Date("2026-09-12T00:00:00+09:00").getTime(),
  );

  const formOpen = joinConfig?.formOpen !== false;
  const generation = joinConfig?.currentGeneration ?? null;
  const displayPresident = joinConfig?.president;

  return (
    <div className="join">
      <div className="joinInner">
        <h1 className="joinTitle">만취 가입하기</h1>
        <p className="joinDesc">
          {joinConfigLoading
            ? LOADING_TEXT
            : `${generation != null ? `${generation}기 ` : ""}가입 신청 또는 신청 내역을 확인하세요.`}
        </p>
        <div className="joinActions">
          {joinConfigLoading ? (
            <p className="joinLoading" aria-live="polite">
              {LOADING_TEXT}
            </p>
          ) : formOpen ? (
            <button
              type="button"
              className="joinBtn joinBtnPrimary"
              onClick={() => nav("/join/form")}
            >
              <span className="joinBtnLabel">가입 하기</span>
              <span className="joinBtnSub">새로 가입 신청하기</span>
            </button>
          ) : (
            <div className="joinClosed">
              <p className="joinClosedMessage">
                현재 가입 신청은 아래 연락처로 연락 부탁드립니다.
              </p>
              <div className="joinClosedContact">
                <div className="joinClosedContactRow joinClosedContactHeader">
                  <span>직책</span>
                  <span>이름</span>
                  <span>연락처</span>
                </div>
                <div className="joinClosedContactRow">
                  <span>회장</span>
                  <span>{displayPresident?.name || "-"}</span>
                  <span>{displayPresident?.contact || "-"}</span>
                </div>
              </div>
            </div>
          )}
          {!joinConfigLoading ? (
            <button
              type="button"
              className="joinBtn joinBtnSecondary"
              onClick={() => nav("/join/check")}
            >
              <span className="joinBtnLabel">가입 확인</span>
              <span className="joinBtnSub">학번으로 신청 내역 확인</span>
            </button>
          ) : null}
        </div>
      </div>
      {showEventPopup ? (
        <div className="joinEventPopup" role="region" aria-labelledby="join-event-title">
          <section className="joinEventPopupCard">
            <button type="button" className="joinEventPopupClose" aria-label="이벤트 팝업 닫기" onClick={() => setShowEventPopup(false)}>×</button>
            <span className="joinEventPopupBadge">D-DAY EVENT</span>
            <img src="/logos/longLogo_red.png" alt="만취" />
            <p className="joinEventPopupDate">2026. 09. 11까지</p>
            <h2 id="join-event-title">가두모집 장르 투표</h2>
            <p className="joinEventPopupDesc">보고 싶은 셋로그 장르를<br />직접 선택해주세요.</p>
            <button type="button" className="joinEventPopupCta" onClick={() => nav("/event")}>투표하러 가기</button>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default Join;
