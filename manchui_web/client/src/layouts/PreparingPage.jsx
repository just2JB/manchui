import { Link, useLocation } from "react-router-dom";
import { IoHourglassOutline, IoPauseCircleOutline } from "react-icons/io5";
import { scrollWindowTopAfterNav } from "../utils/navScroll";
import "./PreparingPage.css";

/**
 * @param {{ variant?: "main" | "club", reason?: "siteRestricted" | "assistantDisabled" }} props
 */
const PreparingPage = ({
  variant = "main",
  reason = "siteRestricted",
}) => {
  const location = useLocation();

  if (variant === "club") {
    const isAssistant = reason === "assistantDisabled";
    const Icon = isAssistant ? IoPauseCircleOutline : IoHourglassOutline;
    return (
      <div className="preparingPage preparingPage--club">
        <div className="preparingCard" role="status" aria-live="polite">
          <div className="preparingCard__ambient" aria-hidden="true" />
          <div className="preparingCard__iconRing">
            <Icon className="preparingCard__icon" aria-hidden />
          </div>
          <p className="preparingCard__eyebrow">MANCHUI 동아리방</p>
          <h1 className="preparingCard__title">
            {isAssistant
              ? "동아리방이 잠시 닫혀 있어요"
              : "동아리방을 준비하고 있어요"}
          </h1>
          <p className="preparingCard__desc">
            {isAssistant
              ? "임원진 설정으로 동아리방 기능이 꺼져 있어요. 메인 페이지에서 공지를 확인하거나, 받으신 예약 공유 링크는 그대로 열 수 있어요."
              : "사이트가 준비되는 동안에는 이 화면만 보여요. 공개되면 다시 찾아와 주세요."}
          </p>
          <div className="preparingCard__actions">
            <Link
              to="/"
              className="preparingCard__btn preparingCard__btn--primary"
              onClick={() => scrollWindowTopAfterNav("/", location)}
            >
              메인으로
            </Link>
            {!isAssistant ? (
              <Link
                to="/join"
                className="preparingCard__btn preparingCard__btn--ghost"
                onClick={() => scrollWindowTopAfterNav("/join", location)}
              >
                가입 안내
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="preparingPage preparingPage--main">
      <div className="preparingCard preparingCard--compact" role="status">
        <div className="preparingCard__ambient preparingCard__ambient--soft" aria-hidden="true" />
        <div className="preparingCard__iconRing preparingCard__iconRing--small">
          <IoHourglassOutline className="preparingCard__icon" aria-hidden />
        </div>
        <h1 className="preparingCard__title preparingCard__title--main">
          지금은 준비 중이에요
        </h1>
        <p className="preparingCard__desc">
          곧 더 나은 모습으로 찾아뵐게요. 가입이 열려 있으면 아래에서 이어갈 수
          있어요.
        </p>
        <div className="preparingCard__actions preparingCard__actions--single">
          <Link
            to="/join"
            className="preparingCard__btn preparingCard__btn--primary"
            onClick={() => scrollWindowTopAfterNav("/join", location)}
          >
            가입하러 가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PreparingPage;
