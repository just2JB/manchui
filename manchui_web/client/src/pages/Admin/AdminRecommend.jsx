import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { tagsToTagLine } from "../ClubRoom/Recommend/hashtagUtils";
import "./AdminRecommend.css";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const authConfig = () => {
  const token = localStorage.getItem("token");
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

const emptyForm = () => ({
  title: "",
  videoUrl: "",
  body: "",
  tagLine: "",
});

const AdminRecommend = () => {
  const modal = useManchuiModal();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!serverUrl) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `${serverUrl}/api/recommendations`,
        authConfig(),
      );
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const tagHay = Array.isArray(it.tags) ? it.tags.join(" ") : "";
      const hay = [it.title, it.body, it.videoUrl, it.authorName, tagHay]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, searchQuery]);

  const openEdit = (it) => {
    setEditingId(it._id);
    setForm({
      title: it.title || "",
      videoUrl: it.videoUrl || "",
      body: it.body || "",
      tagLine: tagsToTagLine(it.tags),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serverUrl || !editingId) return;
    if (!form.title.trim() || !form.videoUrl.trim()) {
      await modal("제목과 영상 링크는 필수입니다.");
      return;
    }
    setSaving(true);
    try {
      await axios.patch(
        `${serverUrl}/api/recommendations/${editingId}`,
        form,
        authConfig(),
      );
      await modal("수정되었습니다.");
      closeForm();
      await load();
    } catch (err) {
      await modal(err?.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (it) => {
    if (!(await modal("이 추천을 삭제할까요?", "confirm"))) return;
    try {
      await axios.delete(
        `${serverUrl}/api/recommendations/${it._id}`,
        authConfig(),
      );
      await modal("삭제되었습니다.");
      await load();
    } catch (err) {
      await modal(err?.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  const formModal =
    formOpen &&
    createPortal(
      <div
        className="adminRecommend__overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-rec-modal-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeForm();
        }}
      >
        <div className="adminRecommend__modal">
          <h2 id="admin-rec-modal-title" className="adminRecommend__modalTitle">
            추천 수정 (관리)
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="adminRecommend__field">
              <label htmlFor="rec-title">제목 *</label>
              <input
                id="rec-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
              />
            </div>
            <div className="adminRecommend__field">
              <label htmlFor="rec-url">영상 링크 *</label>
              <input
                id="rec-url"
                type="text"
                value={form.videoUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, videoUrl: e.target.value }))
                }
                placeholder="https://…"
                required
              />
            </div>
            <div className="adminRecommend__field">
              <label htmlFor="rec-body">추천 설명</label>
              <textarea
                id="rec-body"
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
              />
            </div>
            <div className="adminRecommend__field">
              <label htmlFor="rec-tags">태그</label>
              <input
                id="rec-tags"
                type="text"
                value={form.tagLine}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tagLine: e.target.value }))
                }
                placeholder="#공연 #락킹 #힙합"
              />
            </div>
            <div className="adminRecommend__modalActions">
              <button
                type="button"
                className="adminRecommend__btn adminRecommend__btn--ghost"
                onClick={closeForm}
              >
                취소
              </button>
              <button
                type="submit"
                className="adminRecommend__btn"
                disabled={saving}
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="adminRecommend">
      <h1 className="adminRecommend__pageTitle">곡 추천 관리</h1>
      <p className="adminRecommend__lead">
        부원이 클럽룸에서 등록한 추천을 검색·수정·삭제합니다. 새 글은 동아리방
        &gt; 추천에서 누구나 등록할 수 있습니다.
      </p>

      <div className="adminRecommend__toolbar">
        <input
          type="search"
          className="adminRecommend__search"
          placeholder="제목·작성자·태그·설명 검색…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="adminRecommend__empty">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="adminRecommend__empty">표시할 항목이 없습니다.</p>
      ) : (
        <div className="adminRecommend__tableWrap">
          <table className="adminRecommend__table">
            <thead>
              <tr>
                <th>제목</th>
                <th>작성자</th>
                <th>태그 요약</th>
                <th>링크</th>
                <th>좋아요</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it._id}>
                  <td>{it.title}</td>
                  <td>{it.authorName || "—"}</td>
                  <td>
                    {Array.isArray(it.tags) && it.tags.length
                      ? it.tags
                          .map((t) => `#${String(t).replace(/^#+/, "")}`)
                          .join(" ")
                      : "—"}
                  </td>
                  <td>
                    <a
                      className="adminRecommend__link"
                      href={it.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      열기
                    </a>
                  </td>
                  <td>{it.likeCount ?? 0}</td>
                  <td>
                    <div className="adminRecommend__actions">
                      <button
                        type="button"
                        className="adminRecommend__mini"
                        onClick={() => openEdit(it)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="adminRecommend__mini adminRecommend__mini--danger"
                        onClick={() => handleDelete(it)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formModal}
    </div>
  );
};

export default AdminRecommend;
