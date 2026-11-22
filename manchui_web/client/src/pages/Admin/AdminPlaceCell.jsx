import React, { useEffect, useId, useRef, useState } from "react";
import { IoCheckmark, IoClose } from "react-icons/io5";

/**
 * 표 칸 안에서 바로 연습실 바꾸기.
 * 입력하면 아래로 추천(이 팀 지난번 연습실 → 자주 쓰는 연습실), Enter 저장, Esc 취소.
 * 빈 칸으로 저장하면 미정으로 되돌린다.
 */
export default function AdminPlaceCell({
  value = "",
  suggestions = [],
  busy = false,
  onSave,
  onCancel,
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = (next) => onSave(String(next ?? "").trim());

  return (
    <span className="aPlaceCell">
      <input
        ref={inputRef}
        type="text"
        className="aPlaceCell__input"
        value={draft}
        list={listId}
        maxLength={40}
        disabled={busy}
        placeholder="연습실 (비우면 미정)"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            save(draft);
          }
          if (event.key === "Escape") onCancel();
        }}
        aria-label="연습실"
      />
      <datalist id={listId}>
        {suggestions.map(({ place, hint }) => (
          <option key={place} value={place}>
            {hint || ""}
          </option>
        ))}
      </datalist>
      <button
        type="button"
        className="aPlaceCell__btn aPlaceCell__btn--ok"
        onClick={() => save(draft)}
        disabled={busy}
        aria-label="저장"
      >
        <IoCheckmark aria-hidden />
      </button>
      <button
        type="button"
        className="aPlaceCell__btn"
        onClick={onCancel}
        disabled={busy}
        aria-label="취소"
      >
        <IoClose aria-hidden />
      </button>
      {suggestions.length > 0 ? (
        <span className="aPlaceCell__chips">
          {suggestions.slice(0, 4).map(({ place, hint }) => (
            <button
              key={place}
              type="button"
              className="aPlaceCell__chip"
              onClick={() => save(place)}
              disabled={busy}
            >
              {place}
              {hint ? <small>{hint}</small> : null}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
