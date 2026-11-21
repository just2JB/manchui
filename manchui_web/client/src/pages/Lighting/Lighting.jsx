import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createLightingTeam,
  deleteLightingTeam,
  fetchLightingTeams,
} from "../../api/lightingApi";
import TeamListCard from "../ClubRoom/Team/TeamListCard";
import "../ClubRoom/Team/TeamListCard.css";
import { CHANNEL_COLORS, DEFAULT_CHANNEL } from "./lightingPresets";
import { EXAMPLE_ID, EXAMPLE_TEAM } from "./lightingExample";
import { useLightingI18n } from "./lightingI18n";
import LangSwitch from "./LangSwitch";
import "./Lighting.css";

/** 공연 순서(없으면 뒤로) → 만든 순 */
function sortTeams(list) {
  const o = (t) => (t.order === null || t.order === "" ? 9999 : Number(t.order));
  return [...list].sort(
    (a, b) => o(a) - o(b) || String(a.createdAt).localeCompare(String(b.createdAt)),
  );
}

/** /lighting — 팀 목록 */
export default function Lighting() {
  const nav = useNavigate();
  const { t } = useLightingI18n();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    document.title = t("title");
  }, [t]);

  useEffect(() => {
    fetchLightingTeams()
      .then((list) => setTeams(sortTeams(list)))
      .catch((e) => {
        console.error(e);
        setError("loadFail");
      })
      .finally(() => setLoading(false));
  }, []);

  const addTeam = async (e) => {
    e.preventDefault();
    if (!name.trim() || adding) return;
    setAdding(true);
    try {
      const maxOrder = Math.max(0, ...teams.map((x) => Number(x.order) || 0));
      const team = await createLightingTeam({ name: name.trim(), order: maxOrder + 1 });
      nav(`/lighting/${team._id}?tour=1`); // 처음 만들면 사용법 안내부터
    } catch (err) {
      console.error(err);
      setError("addFail");
      setAdding(false);
    }
  };

  const removeTeam = async (team) => {
    if (!window.confirm(t("confirmDeleteTeam", { name: team.name || t("thisTeam") }))) return;
    setDeletingId(team._id);
    try {
      await deleteLightingTeam(team._id);
      setTeams((list) => {
        const next = list.filter((x) => x._id !== team._id);
        if (!next.length) setEditing(false);
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("deleteFail");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="ltPage ltPage--narrow">
      {/* 번역이 있다는 걸 들어오자마자 알 수 있게 맨 위에 */}
      <LangSwitch />

      <header className="ltHeader ltHeader--row">
        <div>
          <h1>{t("title")}</h1>
          <p className="ltHint">
            {editing
              ? t("listHintEditing")
              : teams.length
                ? t("listHintCount", { n: teams.length })
                : t("listHintEmpty")}
          </p>
        </div>
        {teams.length ? (
          <button
            type="button"
            className={`ltBtn ltBtn--sm${editing ? " ltBtn--primary" : ""}`}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? t("done") : t("edit")}
          </button>
        ) : null}
      </header>

      {error ? <p className="ltError">{t(error)}</p> : null}
      {loading ? <p className="ltEmpty">{t("loading")}</p> : null}

      <div className="ltTiles">
        {!loading && !editing ? (
          <TeamListCard
            className="ltTile ltTile--example"
            team={{ name: t("exampleTile"), teamColor: CHANNEL_COLORS[EXAMPLE_TEAM.channel] }}
            meta={t("exampleTileMeta")}
            ariaLabel={t("exampleTileAria")}
            onClick={() => nav(`/lighting/${EXAMPLE_ID}`)}
          />
        ) : null}
        {teams.map((team) => (
          <div key={team._id} className={`ltTileWrap${editing ? " is-editing" : ""}`}>
            <TeamListCard
              className="ltTile"
              team={{
                name: team.name,
                teamColor: CHANNEL_COLORS[team.channel] || CHANNEL_COLORS[DEFAULT_CHANNEL],
              }}
              meta={[
                team.order ? t("metaOrder", { n: team.order }) : null,
                t("metaChannel", { n: team.channel }),
                team.rowCount ? t("metaCues", { n: team.rowCount }) : t("metaNoCues"),
              ]
                .filter(Boolean)
                .join(" · ")}
              ariaLabel={t("openTeamAria", { name: team.name })}
              onClick={() => (editing ? removeTeam(team) : nav(`/lighting/${team._id}`))}
            />
            {editing ? (
              <button
                type="button"
                className="ltTileDel"
                aria-label={t("deleteTeamAria", { name: team.name })}
                disabled={deletingId === team._id}
                onClick={() => removeTeam(team)}
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}

        {!loading && !editing ? (
          formOpen ? (
            <form className="ltAddTile is-open" onSubmit={addTeam}>
              <input
                className="ltAddTile__input"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setFormOpen(false)}
                placeholder={t("teamNamePh")}
                maxLength={60}
              />
              <div className="ltAddTile__row">
                <button
                  type="button"
                  className="ltLinkBtn ltLinkBtn--dim"
                  onClick={() => setFormOpen(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="ltBtn ltBtn--primary ltBtn--sm"
                  disabled={!name.trim() || adding}
                >
                  {t("create")}
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="ltAddTile" onClick={() => setFormOpen(true)}>
              {t("addTeam")}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
