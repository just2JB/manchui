import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Join.css";
import { useNavigate, useOutletContext } from "react-router-dom";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const Join = () => {
  const nav = useNavigate();
  const { joinConfig, joinConfigLoading } = useOutletContext() ?? {};
  const [president, setPresident] = useState({
    name: "",
    contact: "",
    major: "",
  });

  useEffect(() => {
    if (!serverUrl) return;
    axios
      .get(`${serverUrl}/api/join/config`)
      .then((res) => {
        if (res.data.president) {
          setPresident({
            name: res.data.president.name ?? "",
            contact: res.data.president.contact ?? "",
            major: res.data.president.major ?? "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const formOpen = joinConfig?.formOpen !== false;
  const generation = joinConfig?.currentGeneration ?? null;
  const displayPresident = president.name || president.contact ? president : joinConfig?.president;

  return (
    <div className="join">
      <div className="joinInner">
        <h1 className="joinTitle">만취 가입하기</h1>
        <p className="joinDesc">
          {joinConfigLoading
            ? "설정을 불러오는 중…"
            : `${generation != null ? `${generation}기 ` : ""}가입 신청 또는 신청 내역을 확인하세요.`}
        </p>
        <div className="joinActions">
          {joinConfigLoading ? null : formOpen ? (
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
          <button
            type="button"
            className="joinBtn joinBtnSecondary"
            onClick={() => nav("/join/check")}
          >
            <span className="joinBtnLabel">가입 확인</span>
            <span className="joinBtnSub">학번으로 신청 내역 확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Join;
