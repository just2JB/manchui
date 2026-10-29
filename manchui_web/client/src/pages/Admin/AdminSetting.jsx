import React, { useState, useEffect } from "react";
import "./AdminSetting.css";
import apiClient, { serverUrl } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useAppSettings } from "../../context/AppSettingsContext";
import { LOADING_TEXT } from "../../constants/loadingText";

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
  }, [joinConfigLoading, joinConfig]);

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
    </div>
  );
};

export default AdminSetting;
