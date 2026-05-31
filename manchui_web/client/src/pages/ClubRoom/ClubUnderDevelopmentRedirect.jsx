import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useManchuiModal } from "../hooks/ManchuiModal";
import {
  CLUB_RESERVATION_HOME,
  CLUB_UNDER_DEVELOPMENT_MESSAGE,
} from "../config/clubFeatureFlags";

/** 모달 확인 후 예약 페이지로 이동 */
export function ClubUnderDevelopmentRedirect() {
  const modal = useManchuiModal();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await modal(CLUB_UNDER_DEVELOPMENT_MESSAGE, "alert");
      if (!cancelled) {
        navigate(CLUB_RESERVATION_HOME, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modal, navigate]);

  return null;
}
