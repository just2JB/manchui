import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import "./Mypage.css";
import "./EditUser.css";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading/Loading";
import { useAuth } from "../../../context/AuthContext";

const FORM_META = {
  username: {
    title: "이름 수정",
    label: "새 이름",
    hint: "만취 동아리방에서 사용될 이름입니다. 본명을 사용해 주세요.",
    currentLabel: "현재 이름",
  },
  Identification: {
    title: "아이디 수정",
    label: "새 아이디",
    hint: "만취 동아리방에서 사용될 아이디입니다. @로 시작합니다.",
    currentLabel: "현재 아이디",
  },
  password: {
    title: "비밀번호 수정",
    hint: "현재 비밀번호를 확인한 뒤 새 비밀번호를 설정해 주세요.",
    currentLabel: null,
  },
};

const EDIT_FIELDS = new Set(Object.keys(FORM_META));

function resolveEditField(pathname) {
  const segment = pathname.replace(/\/+$/, "").split("/").pop() ?? "";
  return EDIT_FIELDS.has(segment) ? segment : "";
}

const EditUser = () => {
  const manchuiModal = useManchuiModal();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    Identification: "",
    password: "",
    changePassword: "",
    checkPassword: "",
  });
  const location = useLocation();
  const nav = useNavigate();
  const selectedForm = resolveEditField(location.pathname);

  useEffect(() => {
    if (selectedForm === "password" && user?.authProvider === "kakao") {
      nav("/club/mypage/profile", { replace: true });
    }
  }, [selectedForm, user?.authProvider, nav]);

  const meta = FORM_META[selectedForm];
  const isValidForm = Boolean(meta);

  const currentValue = useMemo(() => {
    if (!isValidForm || selectedForm === "password" || !user) return null;
    return user[selectedForm] ?? null;
  }, [isValidForm, selectedForm, user]);

  const handleChange = (e) => {
    if (selectedForm === "Identification") {
      setFormData({
        ...formData,
        [e.target.name]: "@" + e.target.value.split("@").join(""),
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleBack = () => {
    nav("/club/mypage/profile");
  };

  const submitHandle = async (e) => {
    e.preventDefault();
    if (!isValidForm || !user?._id) return;
    setLoading(true);
    const reqData = {
      formData: formData,
      userId: user._id,
    };
    try {
      const response = await apiClient.post(
        `/api/auth/edit/${selectedForm}`,
        reqData,
        { withCredentials: true },
      );
      if (selectedForm === "username") {
        setUser({ ...user, username: formData[selectedForm] });
      }
      if (selectedForm === "Identification") {
        setUser({ ...user, Identification: formData[selectedForm] });
      }

      await manchuiModal(response.data.message);
      nav("/club/mypage/profile");
    } catch (error) {
      await manchuiModal(
        error.response?.data?.message ?? "저장에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isValidForm) {
    return (
      <div className="mypageHub mypageEdit">
        <button
          type="button"
          className="mypageSaved__back"
          onClick={handleBack}
        >
          ← 내정보 수정
        </button>
        <h1 className="mypageHub__pageTitle">잘못된 접근</h1>
        <p className="mypageEdit__status">
          요청하신 페이지를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mypageHub mypageEdit">
      <button type="button" className="mypageSaved__back" onClick={handleBack}>
        ← 내정보 수정
      </button>

      <h1 className="mypageHub__pageTitle">{meta.title}</h1>
      {meta.hint ? <p className="mypageEdit__desc">{meta.hint}</p> : null}

      {currentValue ? (
        <div className="mypageEdit__current" aria-live="polite">
          <span className="mypageEdit__currentLabel">{meta.currentLabel}</span>
          <span className="mypageEdit__currentValue">{currentValue}</span>
        </div>
      ) : null}

      <form
        className="mypageEdit__form"
        onSubmit={(e) => submitHandle(e)}
        noValidate
      >
        <div className="mypageEdit__card">
          {selectedForm === "password" ? (
            <>
              <div className="mypageEdit__group">
                <h2 className="mypageEdit__groupTitle">현재 비밀번호</h2>
                <div className="mypageEdit__field">
                  <label htmlFor="edit-password">비밀번호</label>
                  <input
                    id="edit-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    placeholder="현재 비밀번호 입력"
                    onChange={(e) => handleChange(e)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <div className="mypageEdit__divider" aria-hidden="true" />

              <div className="mypageEdit__group">
                <h2 className="mypageEdit__groupTitle">새 비밀번호</h2>
                <div className="mypageEdit__field">
                  <label htmlFor="edit-changePassword">새 비밀번호</label>
                  <input
                    id="edit-changePassword"
                    type="password"
                    name="changePassword"
                    value={formData.changePassword}
                    placeholder="새 비밀번호 입력"
                    onChange={(e) => handleChange(e)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="mypageEdit__field">
                  <label htmlFor="edit-checkPassword">비밀번호 확인</label>
                  <input
                    id="edit-checkPassword"
                    type="password"
                    name="checkPassword"
                    value={formData.checkPassword}
                    placeholder="새 비밀번호 다시 입력"
                    onChange={(e) => handleChange(e)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="mypageEdit__field">
              <label htmlFor={`edit-${selectedForm}`}>{meta.label}</label>
              {selectedForm === "Identification" ? (
                <div className="mypageEdit__inputWrap">
                  <span className="mypageEdit__inputPrefix" aria-hidden="true">
                    @
                  </span>
                  <input
                    id={`edit-${selectedForm}`}
                    type="text"
                    name={selectedForm}
                    className="mypageEdit__input--prefixed"
                    value={formData[selectedForm].replace(/^@/, "")}
                    placeholder={
                      currentValue?.replace(/^@/, "") || "아이디 입력"
                    }
                    onChange={(e) => handleChange(e)}
                    autoComplete="off"
                    required
                  />
                </div>
              ) : (
                <input
                  id={`edit-${selectedForm}`}
                  type="text"
                  name={selectedForm}
                  value={formData[selectedForm]}
                  placeholder={currentValue || "이름 입력"}
                  onChange={(e) => handleChange(e)}
                  autoComplete="name"
                  required
                />
              )}
            </div>
          )}
        </div>

        <div className="mypageEdit__actions">
          <button
            type="submit"
            className="mypageEdit__btn mypageEdit__btn--primary"
            disabled={loading}
          >
            {loading ? "저장 중…" : "저장하기"}
          </button>
          <button
            type="button"
            className="mypageEdit__btn mypageEdit__btn--ghost"
            onClick={handleBack}
            disabled={loading}
          >
            취소
          </button>
        </div>
      </form>

      {loading ? <Loading /> : null}
    </div>
  );
};

export default EditUser;
