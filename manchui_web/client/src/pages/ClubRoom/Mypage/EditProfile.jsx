import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Mypage.css";
import "./EditProfile.css";
import MypageProfileCard from "./MypageProfileCard";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import apiClient from "../../../api/apiClient";
import { startKakaoLink } from "../../../api/auth";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { useAuth } from "../../../context/AuthContext";

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

      <h1 className="mypageHub__pageTitle">내 정보 수정</h1>

      <MypageProfileCard user={user} isKakaoLinked={isKakaoLinked} />

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
              <span className="editProfile__label">이름</span>
              <span className="editProfile__value">{user?.username ?? "—"}</span>
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
              <span className="editProfile__label">아이디</span>
              <span className="editProfile__value">{user?.Identification ?? "—"}</span>
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
              <span className="editProfile__label">비밀번호</span>
              <span className="editProfile__value"><span aria-label="설정됨">••••••••</span></span>
              <MdOutlineKeyboardArrowRight
                className="mypageHub__menuRowArrow"
                aria-hidden
              />
            </button>
          </li>
          <li className="mypageHub__menuItem">
            {isKakaoLinked ? (
              <div className="mypageHub__menuRow editProfile__rowStatic">
                <span className="editProfile__label">카카오</span>
                <span className="editProfile__value">연동됨</span>
              </div>
            ) : canLinkKakao ? (
              <button
                type="button"
                className="mypageHub__menuRow"
                onClick={() => void handleKakaoLink()}
                disabled={kakaoLinkLoading}
              >
                <span className="editProfile__label">카카오</span>
                <span className="editProfile__value editProfile__value--action">
                  {kakaoLinkLoading ? "연동 중…" : "연동하기"}
                </span>
                <MdOutlineKeyboardArrowRight
                  className="mypageHub__menuRowArrow"
                  aria-hidden
                />
              </button>
            ) : null}
          </li>
        </ul>
      </section>

      <section className="mypageHub__section" aria-label="계정 관리">
        <div className="mypageHub__sectionTitle mypageHub__sectionTitle--ko">
          계정 관리
        </div>
        <ul className="mypageHub__menuList">
          <li className="mypageHub__menuItem">
            <button
              type="button"
              className="mypageHub__menuRow mypageHub__menuRow--danger editProfile__deleteRow"
              onClick={() => void deleteUserHandle()}
            >
              <span className="editProfile__deleteText">
                <span>계정 삭제</span>
                <small>삭제하면 되돌릴 수 없어요</small>
              </span>
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
