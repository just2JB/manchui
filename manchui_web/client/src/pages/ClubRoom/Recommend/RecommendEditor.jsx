import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient, { serverUrl } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { IoChevronBack, IoLinkOutline } from "react-icons/io5";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useInvalidateClubRecommendations } from "../../../queries/useClubQueries";
import {
  normalizeEditorDraftTag,
  tagLineFromEditorState,
  tagListHasTag,
  toggleTagInList,
} from "./hashtagUtils";
import { RECOMMEND_SUGGESTED_TAGS } from "./recommendSuggestedTags";
import { getLinkThumbnailUrl } from "./linkThumbnailUrl";
import "./RecommendEditor.css";

const emptyForm = () => ({
  title: "",
  videoUrl: "",
  body: "",
});

/** 링크 주소 → 어떤 서비스인지 (미리보기 문구용) */
const LINK_SERVICES = [
  [/youtu\.?be/i, "YouTube"],
  [/instagram\.com/i, "Instagram"],
  [/spotify\.com/i, "Spotify"],
  [/melon\.com/i, "멜론"],
  [/soundcloud\.com/i, "SoundCloud"],
  [/vimeo\.com/i, "Vimeo"],
  [/tiktok\.com/i, "TikTok"],
  [/music\.apple\.com/i, "Apple Music"],
  [/genie\.co\.kr/i, "지니"],
  [/vibe\.naver\.com/i, "VIBE"],
];

function describeLink(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return { known: false, label: "" };
  let host = "";
  try {
    host = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname;
  } catch {
    return { known: false, label: "링크 형식이 아닌 것 같아요" };
  }
  const hit = LINK_SERVICES.find(([pattern]) => pattern.test(host));
  return hit ? { known: true, label: `${hit[1]} 링크` } : { known: false, label: host.replace(/^www\./, "") };
}

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

  const linkInfo = describeLink(form.videoUrl);
  const thumb = getLinkThumbnailUrl(form.videoUrl);

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
          {isEdit ? "추천 수정" : "곡 추천하기"}
        </h1>
      </header>

      <form className="recommendEditor__form" onSubmit={handleSubmit}>
        {/* 1. 링크: 먼저 붙여 넣으면 미리보기가 뜬다 */}
        <div className="recommendEditor__field">
          <label htmlFor="re-url" className="recommendEditor__label">
            영상·음원 링크 <span className="recommendEditor__req">필수</span>
          </label>
          <div className="recommendEditor__urlWrap">
            <IoLinkOutline className="recommendEditor__urlIcon" aria-hidden />
            <input
              id="re-url"
              type="url"
              inputMode="url"
              className="recommendEditor__input recommendEditor__input--url"
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              placeholder="https:// 링크 붙여 넣기"
              autoComplete="off"
              required
            />
          </div>
          {form.videoUrl.trim() ? (
            <div className="recommendEditor__preview" data-known={linkInfo.known || undefined}>
              {thumb ? (
                <img src={thumb} alt="" className="recommendEditor__previewImg" loading="lazy" />
              ) : (
                <span className="recommendEditor__previewIcon" aria-hidden>
                  ♪
                </span>
              )}
              <span className="recommendEditor__previewText">
                <strong>{linkInfo.label}</strong>
                <small>
                  {linkInfo.known
                    ? "저장하면 썸네일·제목을 가져와요"
                    : "링크가 맞는지 한 번 확인해 주세요"}
                </small>
              </span>
            </div>
          ) : (
            <p className="recommendEditor__hint">YouTube, Instagram, Spotify, 멜론 등 어디든 괜찮아요.</p>
          )}
        </div>

        {/* 2. 제목 */}
        <div className="recommendEditor__field">
          <label htmlFor="re-title" className="recommendEditor__label">
            제목 <span className="recommendEditor__req">필수</span>
            <span className="recommendEditor__count">{form.title.length}/60</span>
          </label>
          <input
            id="re-title"
            className="recommendEditor__input recommendEditor__input--title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 60) }))}
            placeholder="곡 이름 - 아티스트"
            required
          />
        </div>

        {/* 3. 설명 */}
        <div className="recommendEditor__field">
          <label htmlFor="re-body" className="recommendEditor__label">
            추천하는 이유 <span className="recommendEditor__opt">선택</span>
          </label>
          <textarea
            id="re-body"
            className="recommendEditor__input recommendEditor__textarea"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="무드, 어울리는 무대, 안무 포인트 등을 적어 보세요."
            rows={5}
          />
        </div>

        {/* 4. 태그 */}
        <div className="recommendEditor__field">
          <label htmlFor="re-tags" className="recommendEditor__label">
            태그 <span className="recommendEditor__opt">선택</span>
          </label>
          <div className="recommendEditor__tagBox">
            {committedTags.map((t) => (
              <button
                key={t.toLowerCase()}
                type="button"
                className="recommendEditor__tagCommitChip"
                onClick={() => removeCommittedTag(t)}
                aria-label={`태그 ${t} 빼기`}
              >
                #{t} <span aria-hidden>×</span>
              </button>
            ))}
            <input
              id="re-tags"
              type="text"
              className="recommendEditor__tagInputField"
              value={tagDraft}
              onChange={handleTagDraftChange}
              onKeyDown={handleTagKeyDown}
              onKeyUp={handleTagKeyUp}
              placeholder={committedTags.length ? "" : "입력 후 스페이스·엔터"}
              autoComplete="off"
            />
          </div>
          <div className="recommendEditor__suggestedTags" role="group" aria-label="추천 태그">
            {RECOMMEND_SUGGESTED_TAGS.map((tag) => {
              const active = tagListHasTag(committedTags, tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`recommendEditor__tagChip${active ? " recommendEditor__tagChip--active" : ""}`}
                  aria-pressed={active}
                  onClick={() => setCommittedTags((prev) => toggleTagInList(prev, tag))}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="recommendEditor__actions">
          <button
            type="button"
            className="recommendEditor__btn recommendEditor__btn--ghost"
            onClick={handleBack}
            disabled={saving}
          >
            취소
          </button>
          <button
            type="submit"
            className="recommendEditor__btn recommendEditor__btn--primary"
            disabled={saving || !user?._id || !form.title.trim() || !form.videoUrl.trim()}
          >
            {saving ? "저장 중…" : isEdit ? "저장하기" : "추천 올리기"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecommendEditor;
