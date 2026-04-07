import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import "./AdminSetting.css";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const AdminSetting = () => {
  const { user } = useOutletContext();
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
        <h1 className="admin-page-heading">웹페이지 설정</h1>
        <p>설정을 불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="adminSetting">
      <h1 className="admin-page-heading">웹페이지 설정</h1>
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
