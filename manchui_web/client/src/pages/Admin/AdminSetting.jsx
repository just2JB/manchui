import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import "./AdminSetting.css";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const AdminSetting = () => {
  const { user } = useOutletContext();
  const [siteRestricted, setSiteRestricted] = useState(false);
  const [president, setPresident] = useState({
    name: "",
    contact: "",
    major: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!serverUrl) {
      setLoading(false);
      return;
    }
    axios
      .get(`${serverUrl}/api/join/config`)
      .then((res) => {
        setSiteRestricted(Boolean(res.data.siteRestricted));
        if (res.data.president) {
          setPresident({
            name: res.data.president.name ?? "",
            contact: res.data.president.contact ?? "",
            major: res.data.president.major ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!serverUrl || !user?._id) return;
    setSaving(true);
    try {
      await axios.put(`${serverUrl}/api/join/config`, {
        userId: user._id,
        siteRestricted,
        president,
      });
      alert("설정이 저장되었습니다.");
    } catch (err) {
      alert(err.response?.data?.message || "설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="adminSetting">
        <p>설정을 불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="adminSetting">
      <div className="joinSetting">
        <h3 className="configTitle">사이트 공개 설정</h3>
        <div className="configRow">
          <span className="configLabel">가입 외 페이지 비활성화</span>
          <button
            type="button"
            className={`configToggle ${siteRestricted ? "on" : "off"}`}
            onClick={() => setSiteRestricted((v) => !v)}
            aria-pressed={siteRestricted}
          >
            {siteRestricted ? "켜짐" : "꺼짐"}
          </button>
        </div>
        <p className="configHint">
          켜면 메인·소개·굿즈 등 가입(/join) 제외 페이지에 "현재 준비중입니다" 메시지가 표시됩니다.
        </p>
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
          className="configSave"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "저장 중…" : "설정 저장"}
        </button>
      </div>
    </div>
  );
};

export default AdminSetting;
