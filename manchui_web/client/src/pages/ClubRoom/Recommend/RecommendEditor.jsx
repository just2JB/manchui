import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient, { serverUrl } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { IoChevronBack } from "react-icons/io5";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useInvalidateClubRecommendations } from "../../../queries/useClubQueries";
import {
  normalizeEditorDraftTag,
  tagLineFromEditorState,
  tagListHasTag,
  toggleTagInList,
} from "./hashtagUtils";
import { RECOMMEND_SUGGESTED_TAGS } from "./recommendSuggestedTags";
import "./RecommendEditor.css";

const emptyForm = () => ({
  title: "",
  videoUrl: "",
  body: "",
});

const RecommendEditor = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const { user } = useAuth();
  const modal = useManchuiModal();
  const invalidateRecommendations = useInvalidateClubRecommendations();

  const [form, setForm] = useState(emptyForm);
  const [committedTags, setCommittedTags] = useState([]);
  const [tagDraft, setTagDraft] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadItem = useCallback(async () => {
    if (!isEdit || !serverUrl) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setForbidden(false);
    try {
      const res = await apiClient.get(`/api/recommendations/${id}`, {
        withCredentials: true,
      });
      const item = res.data?.item;
      if (!item) {
        setLoadError("불러올 수 없습니다.");
        return;
      }
      if (!item.canEdit) {
        setForbidden(true);
        return;
      }
      setForm({
        title: item.title || "",
        videoUrl: item.videoUrl || "",
        body: item.body || "",
      });
      setCommittedTags(Array.isArray(item.tags) ? item.tags : []);
      setTagDraft("");
    } catch (e) {
      setLoadError(e?.response?.data?.message || "추천을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isEdit, id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serverUrl || !user?._id) {
      await modal("로그인 후 이용할 수 있습니다.");
      return;
    }
    if (!form.title.trim() || !form.videoUrl.trim()) {
      await modal("제목과 링크는 필수입니다.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      tagLine: tagLineFromEditorState(committedTags, tagDraft),
    };
    try {
      if (isEdit) {
        await apiClient.patch(`/api/recommendations/${id}`, payload, {
          withCredentials: true,
        });
        await modal("수정되었습니다.");
      } else {
        await apiClient.post("/api/recommendations", payload, {
          withCredentials: true,
        });
        await modal("등록되었습니다.");
      }
      invalidateRecommendations();
      nav("/club/recommend");
    } catch (err) {
      await modal(err?.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    nav("/club/recommend");
  };

  const commitTag = useCallback((rawTag) => {
    const normalized = String(rawTag ?? "")
      .replace(/^#+/, "")
      .trim();
    if (!normalized) return;
    setCommittedTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === normalized.toLowerCase())) {
        return prev;
      }
      return [...prev, normalized];
    });
  }, []);

  const tryCommitDraft = useCallback(
    (raw) => {
      const tag = normalizeEditorDraftTag(raw);
      if (!tag) return false;
      commitTag(tag);
      setTagDraft("");
      return true;
    },
    [commitTag],
  );

  const handleTagDraftChange = useCallback(
    (e) => {
      const next = e.target.value;
      if (/\s$/.test(next)) {
        if (tryCommitDraft(next.trimEnd())) return;
      }
      setTagDraft(next);
    },
    [tryCommitDraft],
  );

  const handleTagKeyDown = useCallback(
    (e) => {
      if (e.key === "Backspace") {
        if (e.nativeEvent?.isComposing) return;
        const el = e.currentTarget;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        if (start === 0 && end === 0 && !tagDraft && committedTags.length > 0) {
          e.preventDefault();
          setCommittedTags((prev) => prev.slice(0, -1));
        }
        return;
      }

      if (e.key === "Enter" && e.nativeEvent?.isComposing) return;

      const isSpace =
        e.code === "Space" ||
        e.key === " " ||
        e.key === "Spacebar" ||
        (e.key === "" && (e.keyCode === 32 || e.which === 32));
      const isEnter = e.key === "Enter";
      if (!isSpace && !isEnter) return;

      if (isSpace && e.nativeEvent?.isComposing) return;

      const draft = e.currentTarget.value;
      if (!normalizeEditorDraftTag(draft)) return;
      e.preventDefault();
      tryCommitDraft(draft);
    },
    [tryCommitDraft, tagDraft, committedTags.length],
  );

  const handleTagKeyUp = useCallback(
    (e) => {
      if (e.nativeEvent?.isComposing) return;
      const isSpace =
        e.code === "Space" ||
        e.key === " " ||
        e.key === "Spacebar" ||
        (e.key === "" && (e.keyCode === 32 || e.which === 32));
      if (!isSpace) return;
      const el = e.currentTarget;
      const v = el.value;
      const sel = el.selectionStart ?? v.length;
      const before = v.slice(0, sel);
      if (!/\s$/.test(before)) return;
      const tag = normalizeEditorDraftTag(before.trimEnd());
      if (!tag) return;
      commitTag(tag);
      setTagDraft(v.slice(sel));
    },
    [commitTag],
  );

  const removeCommittedTag = useCallback((label) => {
    setCommittedTags((prev) =>
      prev.filter((t) => t.toLowerCase() !== label.toLowerCase()),
    );
  }, []);

  if (forbidden) {
    return (
      <div className="recommendEditor">
        <div className="recommendEditor__error">
          수정할 권한이 없습니다.
          <br />
          <button
            type="button"
            className="recommendEditor__errorLink"
            onClick={() => nav("/club/recommend")}
          >
            추천 목록으로
          </button>
        </div>
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="recommendEditor">
        <div className="recommendEditor__error">{loadError}</div>
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            className="recommendEditor__errorLink"
            onClick={() => nav("/club/recommend")}
          >
            추천 목록으로
          </button>
        </div>
      </div>
    );
  }

  if (isEdit && loading) {
    return (
      <div className="recommendEditor">
        <div className="recommendEditor__loading">불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="recommendEditor">
      <header className="recommendEditor__header">
        <button
          type="button"
          className="recommendEditor__back"
          onClick={handleBack}
          aria-label="뒤로"
        >
          <IoChevronBack size={22} aria-hidden />
        </button>
        <h1 className="recommendEditor__headTitle">
          {isEdit ? "추천 수정" : "추천 등록"}
        </h1>
      </header>

      <form className="recommendEditor__form" onSubmit={handleSubmit}>
        <section
          className="recommendEditor__section"
          aria-labelledby="sec-basic"
        >
          <h2 id="sec-basic" className="recommendEditor__sectionTitle">
            기본 정보
          </h2>
          <div className="recommendEditor__field">
            <label htmlFor="re-title">제목 *</label>
            <input
              id="re-title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="어떤 곡인지 짧게"
              required
            />
          </div>
          <div className="recommendEditor__field">
            <label htmlFor="re-url">영상·음원 링크 *</label>
            <input
              id="re-url"
              type="text"
              value={form.videoUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, videoUrl: e.target.value }))
              }
              placeholder="YouTube, Instagram, Spotify, 멜론 등"
              required
            />
            <p className="recommendEditor__hint">
              저장 시 가능한 서비스는 썸네일·제목을 자동으로 가져옵니다.
            </p>
          </div>
        </section>

        <section
          className="recommendEditor__section"
          aria-labelledby="sec-tags"
        >
          <h2 id="sec-tags" className="recommendEditor__sectionTitle">
            태그
          </h2>
          <div className="recommendEditor__field">
            {committedTags.length > 0 ? (
              <div
                className="recommendEditor__tagChips"
                aria-label="확정된 태그"
              >
                {committedTags.map((t) => (
                  <button
                    key={t.toLowerCase()}
                    type="button"
                    className="recommendEditor__tagCommitChip"
                    onClick={() => removeCommittedTag(t)}
                    aria-label={`태그 ${t} 제거`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            ) : null}
            <input
              id="re-tags"
              type="text"
              className="recommendEditor__tagInputField"
              value={tagDraft}
              onChange={handleTagDraftChange}
              onKeyDown={handleTagKeyDown}
              onKeyUp={handleTagKeyUp}
              placeholder="코레오, k-pop … 입력 후 스페이스·엔터"
              autoComplete="off"
            />
            <p className="recommendEditor__suggestLabel">추천 태그</p>
            <div
              className="recommendEditor__suggestedTags"
              role="group"
              aria-label="추천 태그"
            >
              {RECOMMEND_SUGGESTED_TAGS.map((tag) => {
                const active = tagListHasTag(committedTags, tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`recommendEditor__tagChip${active ? " recommendEditor__tagChip--active" : ""}`}
                    aria-pressed={active}
                    onClick={() =>
                      setCommittedTags((prev) => toggleTagInList(prev, tag))
                    }
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
            <p className="recommendEditor__hint">
              태그 입력 후 스페이스·엔터로 확정하거나 추천 태그를 눌러
              추가하세요. # 없이 입력해도 됩니다.
            </p>
          </div>
        </section>

        <section
          className="recommendEditor__section"
          aria-labelledby="sec-body"
        >
          <h2 id="sec-body" className="recommendEditor__sectionTitle">
            추천 설명
          </h2>
          <div className="recommendEditor__field">
            <label htmlFor="re-body">내용</label>
            <textarea
              id="re-body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="왜 이 곡을 추천하는지, 무드나 상황 등을 적어 보세요."
            />
          </div>
        </section>

        <div className="recommendEditor__actions recommendEditor__actions--inForm">
          <button
            type="submit"
            className="recommendEditor__btn recommendEditor__btn--primary"
            disabled={saving || !user?._id}
          >
            {saving ? "저장 중…" : isEdit ? "저장하기" : "등록하기"}
          </button>
          <button
            type="button"
            className="recommendEditor__btn recommendEditor__btn--ghost"
            onClick={handleBack}
            disabled={saving}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecommendEditor;
