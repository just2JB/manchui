import React, { useState, useEffect } from "react";
import "./AdminSetting.css";
import apiClient, { serverUrl } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useAppSettings } from "../../context/AppSettingsContext";
import { LOADING_TEXT } from "../../constants/loadingText";
import { CLUB_ROOM_RULES_ITEMS } from "../ClubRoom/Reservation/clubRoomRulesContent";

const AdminSetting = () => {
  const { user } = useAuth();
  const { joinConfig, joinConfigLoading, refreshJoinConfig, ensureJoinConfigLoaded } =
    useAppSettings();
  const [president, setPresident] = useState({
    name: "",
    contact: "",
    major: "",
  });
  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const [savingAssistant, setSavingAssistant] = useState(false);
  const [savingPresident, setSavingPresident] = useState(false);
  /** 동아리방 이용 수칙 (한 줄 = 한 항목) */
  const [rules, setRules] = useState(CLUB_ROOM_RULES_ITEMS);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    void ensureJoinConfigLoaded();
  }, [ensureJoinConfigLoaded]);

  useEffect(() => {
    if (joinConfigLoading) return;
    setAssistantEnabled(joinConfig.assistantEnabled !== false);
    setPresident({
      name: joinConfig.president?.name ?? "",
      contact: joinConfig.president?.contact ?? "",
      major: joinConfig.president?.major ?? "",
    });
    setRules(
      Array.isArray(joinConfig.clubRoomRules) && joinConfig.clubRoomRules.length > 0
        ? joinConfig.clubRoomRules
        : CLUB_ROOM_RULES_ITEMS,
    );
  }, [joinConfigLoading, joinConfig]);

  const updateRule = (index, value) =>
    setRules((prev) => prev.map((item, i) => (i === index ? value : item)));
  const moveRule = (index, delta) =>
    setRules((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const removeRule = (index) => setRules((prev) => prev.filter((_, i) => i !== index));

  const saveRules = async () => {
    if (!serverUrl || !user?._id) return;
    const cleaned = rules.map((item) => item.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      alert("수칙을 한 개 이상 적어 주세요.");
      return;
    }
    setSavingRules(true);
    try {
      await apiClient.put("/api/join/config", {
        userId: user._id,
        clubRoomRules: cleaned,
      });
      alert("동아리방 이용 수칙이 저장되었습니다.");
      void refreshJoinConfig();
    } catch (err) {
      alert(err.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSavingRules(false);
    }
  };

  const saveAssistant = async () => {
    if (!serverUrl || !user?._id) return;
    setSavingAssistant(true);
    try {
      await apiClient.put("/api/join/config", {
        userId: user._id,
        assistantEnabled,
      });
      alert("어시스턴트 설정이 저장되었습니다.");
      void refreshJoinConfig();
    } catch (err) {
      alert(err.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSavingAssistant(false);
    }
  };

  const savePresident = async () => {
    if (!serverUrl || !user?._id) return;
    setSavingPresident(true);
    try {
      await apiClient.put("/api/join/config", {
        userId: user._id,
        president,
      });
      alert("회장 정보가 저장되었습니다.");
      void refreshJoinConfig();
    } catch (err) {
      alert(err.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSavingPresident(false);
    }
  };

  if (joinConfigLoading) {
    return (
      <div className="adminSetting">
        <h1 className="admin-page-heading">웹페이지 설정</h1>
        <p>{LOADING_TEXT}</p>
      </div>
    );
  }

  return (
    <div className="adminSetting">
      <h1 className="admin-page-heading">웹페이지 설정</h1>
      <div className="joinSetting joinSetting--assistant">
        <h3 className="configTitle">동아리방 (어시스턴트)</h3>
        <p className="configHint">
          끄면 메인 사이트 네비게이션의 어시스턴트를 누를 수 없고, 동아리방
          진입도 제한됩니다. (예약 공유 링크 열람은 가능)
        </p>
        <div
          className="assistantToggle"
          role="radiogroup"
          aria-label="어시스턴트 사용 여부"
        >
          <div
            className={`assistantStatus assistantStatus--${assistantEnabled ? "on" : "off"}`}
            aria-live="polite"
          >
            <span className="assistantStatus__dot" aria-hidden />
            <span className="assistantStatus__text">
              {assistantEnabled ? "켜짐" : "꺼짐"}
            </span>
            <span className="assistantStatus__sub">
              {assistantEnabled
                ? "회원이 동아리방을 이용할 수 있습니다."
                : "동아리방·로그인 진입이 막힙니다."}
            </span>
          </div>
          <div className="assistantToggle__btns">
            <button
              type="button"
              className={`assistantToggle__btn assistantToggle__btn--on${assistantEnabled ? " assistantToggle__btn--selected" : ""}`}
              onClick={() => setAssistantEnabled(true)}
              aria-checked={assistantEnabled}
              role="radio"
            >
              켜기
            </button>
            <button
              type="button"
              className={`assistantToggle__btn assistantToggle__btn--off${!assistantEnabled ? " assistantToggle__btn--selected" : ""}`}
              onClick={() => setAssistantEnabled(false)}
              aria-checked={!assistantEnabled}
              role="radio"
            >
              끄기
            </button>
          </div>
        </div>
        <button
          type="button"
          className="configSave configSave--block"
          onClick={saveAssistant}
          disabled={savingAssistant}
        >
          {savingAssistant ? "저장 중…" : "설정 저장"}
        </button>
      </div>
      <div className="joinSetting">
        <h3 className="configTitle">회장 정보</h3>
        <div className="configRow">
          <span className="configLabel">이름</span>
          <input
            type="text"
            className="configInput"
            value={president.name}
            onChange={(e) =>
              setPresident((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="회장 이름"
          />
        </div>
        <div className="configRow">
          <span className="configLabel">연락처</span>
          <input
            type="text"
            className="configInput"
            value={president.contact}
            onChange={(e) =>
              setPresident((p) => ({ ...p, contact: e.target.value }))
            }
            placeholder="전화번호 또는 카카오ID"
          />
        </div>
        <div className="configRow">
          <span className="configLabel">학과</span>
          <input
            type="text"
            className="configInput"
            value={president.major}
            onChange={(e) =>
              setPresident((p) => ({ ...p, major: e.target.value }))
            }
            placeholder="학과명"
          />
        </div>
        <button
          type="button"
          className="configSave configSave--block"
          onClick={savePresident}
          disabled={savingPresident}
        >
          {savingPresident ? "저장 중…" : "설정 저장"}
        </button>
      </div>

      <div className="joinSetting">
        <h3 className="configTitle">동아리방 이용 수칙</h3>
        <p className="configHint">
          예약 화면의 &lsquo;이용 수칙&rsquo;과 예약 완료 창에 보여요. 한 칸에 수칙 하나씩 적어 주세요.
        </p>
        <ol className="rulesEditor">
          {rules.map((rule, index) => (
            <li key={index} className="rulesEditor__item">
              <span className="rulesEditor__num">{index + 1}</span>
              <textarea
                className="configInput rulesEditor__text"
                value={rule}
                onChange={(event) => updateRule(index, event.target.value)}
                rows={2}
                maxLength={300}
                placeholder="예: 사용 후 불을 꺼 주세요."
                aria-label={`수칙 ${index + 1}`}
              />
              <div className="rulesEditor__tools">
                <button type="button" onClick={() => moveRule(index, -1)} disabled={index === 0}
                  aria-label={`수칙 ${index + 1} 위로`}>↑</button>
                <button type="button" onClick={() => moveRule(index, 1)} disabled={index === rules.length - 1}
                  aria-label={`수칙 ${index + 1} 아래로`}>↓</button>
                <button type="button" onClick={() => removeRule(index)} aria-label={`수칙 ${index + 1} 지우기`}>✕</button>
              </div>
            </li>
          ))}
        </ol>
        <div className="rulesEditor__actions">
          <button type="button" className="rulesEditor__add" onClick={() => setRules((prev) => [...prev, ""])}
            disabled={rules.length >= 20}>
            + 수칙 추가
          </button>
          <button type="button" className="rulesEditor__reset" onClick={() => setRules(CLUB_ROOM_RULES_ITEMS)}>
            기본 문구로
          </button>
        </div>
        <button
          type="button"
          className="configSave configSave--block"
          onClick={saveRules}
          disabled={savingRules}
        >
          {savingRules ? "저장 중…" : "수칙 저장"}
        </button>
      </div>
    </div>
  );
};

export default AdminSetting;
