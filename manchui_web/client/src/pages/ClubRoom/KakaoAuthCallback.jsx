import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { establishSessionFromCookies } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { safeInternalPath } from "../../utils/safeInternalPath";
import { resolveClubAllowedPath } from "../../config/clubFeatureFlags";
import Loading from "../../components/Loading/Loading";

const KakaoAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const manchuiModal = useManchuiModal();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const data = await establishSessionFromCookies();
        if (cancelled) return;
        setUser(data.user);
        const from = safeInternalPath(searchParams.get("from"));
        navigate(resolveClubAllowedPath(from || "/club"), { replace: true });
      } catch (error) {
        if (cancelled) return;
        await manchuiModal(
          error?.response?.data?.message ||
            "카카오 로그인 세션을 확인하지 못했습니다.",
        );
        navigate("/club/login", { replace: true });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, setUser, manchuiModal]);

  return <Loading />;
};

export default KakaoAuthCallback;
