import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Mypage.css";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { IoPersonOutline } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { startKakaoLink } from "../../../api/auth";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useAuth } from "../../../context/AuthContext";

function KakaoIcon() {
  return (
    <svg
      className="editProfile__kakaoIcon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 3C7.03 3 3 6.36 3 10.35c0 2.55 1.68 4.79 4.21 6.06-.19.68-.69 2.47-.79 2.86-.12.47.17.46.36.33.15-.1 2.37-1.61 3.33-2.26.29.04.58.06.89.06 4.97 0 9-3.36 9-7.35S16.97 3 12 3z"
      />
    </svg>
  );
}

const EditProfile = () => {
  const { user, logout, verifySession } = useAuth();
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [kakaoLinkLoading, setKakaoLinkLoading] = useState(false);

  const isKakaoLinked = Boolean(user?.kakaoId);
  const canLinkKakao =
    user && !user.kakaoId && user.authProvider !== "kakao";

  useEffect(() => {
    const linkResult = searchParams.get("kakaoLink");
    const linkError = searchParams.get("kakaoLinkError");
    if (!linkResult && !linkError) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("kakaoLink");
    nextParams.delete("kakaoLinkError");
    setSearchParams(nextParams, { replace: true });

    const run = async () => {
      if (
        linkResult === "success" ||
        linkResult === "success-email-updated"
      ) {
        await verifySession();
        await manchuiModal(
          linkResult === "success-email-updated"
            ? "카카오 계정이 연동되었습니다. 로그인 이메일이 카카오 이메일로 변경되었습니다."
            : "카카오 계정이 연동되었습니다.",
        );
        return;
      }
      if (linkError) {
        await manchuiModal(linkError);
      }
    };

    void run();
  }, [searchParams, setSearchParams, verifySession, manchuiModal]);

  const handleKakaoLink = async () => {
    if (kakaoLinkLoading || !canLinkKakao) return;

    const ok = await manchuiModal(
      "등록된 이메일과 카카오 이메일이 다를 경우, 연동 후 로그인 이메일이 카카오 이메일로 변경됩니다. 계속하시겠습니까?",
      "confirm",
    );
    if (!ok) return;

    setKakaoLinkLoading(true);
    try {
      await startKakaoLink("/club/mypage/profile");
    } catch (error) {
      setKakaoLinkLoading(false);
      await manchuiModal(
        error.response?.data?.message ?? "카카오 연동을 시작하지 못했습니다.",
      );
    }
  };

  const deleteUserHandle = async () => {
    const ok = await manchuiModal("정말로 삭제하시겠습니까", "confirm");
    if (!ok) return;
    try {
      const response = await apiClient.post(
        `/api/auth/delete/${user._id}`,
        {},
        { withCredentials: true },
      );
      logout();
      await manchuiModal(response.data.message);
      nav("/club");
    } catch (error) {
      await manchuiModal(
        error.response?.data?.message ?? "삭제에 실패했습니다.",
      );
    }
  };

  return (
    <div className="mypageHub editProfile">
      <button
        type="button"
        className="mypageSaved__back"
        onClick={() => nav("/club/mypage")}
      >
        ← 마이페이지
      </button>

      <h1 className="mypageHub__pageTitle">내정보 수정</h1>

      <div className="editProfile__hero">
        <div className="editProfile__avatar" aria-hidden="true">
          <IoPersonOutline className="editProfile__avatarIcon" />
        </div>
        <h2 className="editProfile__name">
          {user?.username ?? "이름 없음"}
        </h2>
        <p className="editProfile__meta">
          <span className="editProfile__metaItem">
            {user?.Identification ?? "—"}
          </span>
          <span className="editProfile__metaDot" aria-hidden="true">
            ·
          </span>
          <span className="editProfile__metaItem">
            {user?.position ? `만취 ${user.position}` : "—"}
          </span>
        </p>
      </div>

      <section className="mypageHub__section" aria-label="계정 정보">
        <div className="mypageHub__sectionTitle mypageHub__sectionTitle--ko">
          계정
        </div>
        <ul className="mypageHub__menuList">
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow"
              onClick={() => nav("/club/mypage/username")}
            >
              <span>이름</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow"
              onClick={() => nav("/club/mypage/Identification")}
            >
              <span>아이디</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow"
              onClick={() => nav("/club/mypage/password")}
              hidden={user?.authProvider === "kakao"}
            >
              <span>비밀번호</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
          <li className="mypageHub__menuItem mypageHub__menuItem--kakao">
            {isKakaoLinked ? (
              <div className="mypageHub__menuRow editProfile__kakaoStatus">
                <span>카카오 연동</span>
                <span className="editProfile__kakaoBadge">연동됨</span>
              </div>
            ) : canLinkKakao ? (
              <button
                type="button"
                className="editProfile__kakaoLinkBtn"
                onClick={() => void handleKakaoLink()}
                disabled={kakaoLinkLoading}
              >
                <KakaoIcon />
                {kakaoLinkLoading ? "연동 중…" : "카카오 연동하기"}
              </button>
            ) : null}
          </li>
        </ul>
      </section>

      <section className="mypageHub__section" aria-label="계정 삭제">
        <div className="mypageHub__sectionTitle mypageHub__sectionTitle--ko">
          위험 구역
        </div>
        <ul className="mypageHub__menuList">
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow mypageHub__menuRow--danger"
              onClick={() => void deleteUserHandle()}
            >
              <span>계정 삭제</span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default EditProfile;
