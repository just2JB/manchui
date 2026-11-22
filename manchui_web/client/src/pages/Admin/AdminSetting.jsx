import React, { useEffect, useState } from "react";
import "./AdminSetting.css";
import apiClient, { serverUrl } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useAppSettings } from "../../context/AppSettingsContext";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { LOADING_TEXT } from "../../constants/loadingText";
import { CLUB_ROOM_RULES_ITEMS } from "../ClubRoom/Reservation/clubRoomRulesContent";

const EMPTY_PRESIDENT = { name: "", contact: "", major: "" };

const sameList = (a, b) => a.length === b.length && a.every((item, i) => item === b[i]);

/** 왼쪽 제목·설명, 오른쪽 설정 (모바일은 위아래) */
function SettingSection({ title, desc, children }) {
  return (
    <section className="aSet__section">
      <div className="aSet__about">
        <h2 className="aSet__title">{title}</h2>
        {desc ? <p className="aSet__desc">{desc}</p> : null}
      </div>
      <div className="aSet__body">{children}</div>
    </section>
  );
}

const AdminSetting = () => {
  const { user } = useAuth();
  const modal = useManchuiModal();
  const { joinConfig, joinConfigLoading, refreshJoinConfig, ensureJoinConfigLoaded } =
    useAppSettings();

  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const [savingAssistant, setSavingAssistant] = useState(false);
  const [president, setPresident] = useState(EMPTY_PRESIDENT);
  const [savingPresident, setSavingPresident] = useState(false);
  /** 동아리방 이용 수칙 (한 칸 = 한 항목) */
  const [rules, setRules] = useState(CLUB_ROOM_RULES_ITEMS);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    void ensureJoinConfigLoaded();
  }, [ensureJoinConfigLoaded]);

  const savedPresident = {
    name: joinConfig.president?.name ?? "",
    contact: joinConfig.president?.contact ?? "",
    major: joinConfig.president?.major ?? "",
  };
  const savedRules =
    Array.isArray(joinConfig.clubRoomRules) && joinConfig.clubRoomRules.length > 0
      ? joinConfig.clubRoomRules
      : CLUB_ROOM_RULES_ITEMS;

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

  const presidentChanged =
    president.name !== savedPresident.name ||
    president.contact !== savedPresident.contact ||
    president.major !== savedPresident.major;
  const cleanedRules = rules.map((item) => item.trim()).filter(Boolean);
  const rulesChanged = !sameList(cleanedRules, savedRules) || cleanedRules.length !== rules.length;

  const putConfig = (payload) =>
    apiClient.put("/api/join/config", { userId: user._id, ...payload });

  // 어시스턴트: 스위치를 누르면 바로 저장 (끌 때는 한 번 확인)
  const toggleAssistant = async () => {
    if (!serverUrl || !user?._id || savingAssistant) return;
    const next = !assistantEnabled;
    if (
      !next &&
      !(await modal(
        "동아리방을 끄면 부원들이 로그인·동아리방에 들어올 수 없어요. 끌까요?",
        "confirm",
      ))
    ) {
      return;
    }
    setAssistantEnabled(next);
    setSavingAssistant(true);
    try {
      await putConfig({ assistantEnabled: next });
      void refreshJoinConfig();
    } catch (err) {
      setAssistantEnabled(!next);
      await modal(err.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSavingAssistant(false);
    }
  };

  const savePresident = async () => {
    if (!serverUrl || !user?._id) return;
    setSavingPresident(true);
    try {
      await putConfig({ president });
      await modal("회장 정보를 저장했어요.");
      void refreshJoinConfig();
    } catch (err) {
      await modal(err.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSavingPresident(false);
    }
  };

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
    if (cleanedRules.length === 0) {
      await modal("수칙을 한 개 이상 적어 주세요.");
      return;
    }
    setSavingRules(true);
    try {
      await putConfig({ clubRoomRules: cleanedRules });
      await modal("동아리방 이용 수칙을 저장했어요.");
      void refreshJoinConfig();
    } catch (err) {
      await modal(err.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSavingRules(false);
    }
  };

  if (joinConfigLoading) {
    return (
      <div className="aSet">
        <h1 className="admin-page-heading">웹페이지 설정</h1>
        <p className="aSet__desc">{LOADING_TEXT}</p>
      </div>
    );
  }

  return (
    <div className="aSet">
      <h1 className="admin-page-heading">웹페이지 설정</h1>

      <SettingSection
        title="동아리방"
        desc="끄면 메인 사이트에서 동아리방(어시스턴트)과 로그인으로 들어갈 수 없어요. 예약 공유 링크는 계속 열려요."
      >
        <button
          type="button"
          role="switch"
          aria-checked={assistantEnabled}
          className="aSet__switchRow"
          onClick={() => void toggleAssistant()}
          disabled={savingAssistant}
        >
          <span className="aSet__switchText">
            <strong>{assistantEnabled ? "켜져 있어요" : "꺼져 있어요"}</strong>
            <small>
              {savingAssistant
                ? "저장 중…"
                : assistantEnabled
                  ? "부원이 동아리방을 쓸 수 있어요"
                  : "동아리방·로그인 진입이 막혀 있어요"}
            </small>
          </span>
          <span className="aSet__switch" data-on={assistantEnabled || undefined} aria-hidden />
        </button>
      </SettingSection>

      <SettingSection
        title="회장 정보"
        desc="가입 안내와 개인정보 처리방침의 책임자 칸에 보여요."
      >
        <div className="aSet__fields">
          {[
            ["name", "이름", "회장 이름"],
            ["contact", "연락처", "010-0000-0000 또는 이메일"],
            ["major", "학과", "학과명"],
          ].map(([key, label, placeholder]) => (
            <label key={key} className="aSet__field">
              <span className="aSet__label">{label}</span>
              <input
                type="text"
                className="aSet__input"
                value={president[key]}
                onChange={(e) => setPresident((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </label>
          ))}
        </div>
        <div className="aSet__actions">
          {presidentChanged ? (
            <button type="button" className="aSet__ghost" onClick={() => setPresident(savedPresident)}>
              되돌리기
            </button>
          ) : null}
          <button
            type="button"
            className="aSet__save"
            onClick={() => void savePresident()}
            disabled={savingPresident || !presidentChanged}
          >
            {savingPresident ? "저장 중…" : "저장"}
          </button>
        </div>
      </SettingSection>

      <SettingSection
        title="동아리방 이용 수칙"
        desc="예약 화면의 이용 수칙, 예약 완료 창, 예약 공유 페이지에 보여요. 한 칸에 하나씩 적어 주세요."
      >
        <ol className="aSet__rules">
          {rules.map((rule, index) => (
            <li key={index} className="aSet__rule">
              <span className="aSet__ruleNum">{index + 1}</span>
              <textarea
                className="aSet__input aSet__ruleText"
                value={rule}
                onChange={(event) => updateRule(index, event.target.value)}
                rows={2}
                maxLength={300}
                placeholder="예: 사용 후 불을 꺼 주세요."
                aria-label={`수칙 ${index + 1}`}
              />
              <div className="aSet__ruleTools">
                <button type="button" onClick={() => moveRule(index, -1)} disabled={index === 0}
                  aria-label={`수칙 ${index + 1} 위로`}>↑</button>
                <button type="button" onClick={() => moveRule(index, 1)} disabled={index === rules.length - 1}
                  aria-label={`수칙 ${index + 1} 아래로`}>↓</button>
                <button type="button" onClick={() => removeRule(index)} aria-label={`수칙 ${index + 1} 지우기`}>✕</button>
              </div>
            </li>
          ))}
        </ol>
        <div className="aSet__actions aSet__actions--split">
          <div className="aSet__actionsLeft">
            <button type="button" className="aSet__add" onClick={() => setRules((prev) => [...prev, ""])}
              disabled={rules.length >= 20}>
              + 수칙 추가
            </button>
            <button type="button" className="aSet__ghost" onClick={() => setRules(CLUB_ROOM_RULES_ITEMS)}>
              기본 문구로
            </button>
          </div>
          <button
            type="button"
            className="aSet__save"
            onClick={() => void saveRules()}
            disabled={savingRules || !rulesChanged}
          >
            {savingRules ? "저장 중…" : "저장"}
          </button>
        </div>
      </SettingSection>
    </div>
  );
};

export default AdminSetting;
