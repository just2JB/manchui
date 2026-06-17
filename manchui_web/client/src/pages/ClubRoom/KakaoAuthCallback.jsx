import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { completeKakaoCallbackAuth } from "../../api/auth";
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
  const authStartedRef = useRef(false);

  useEffect(() => {
    if (authStartedRef.current) return;
    authStartedRef.current = true;

    const run = async () => {
      try {
        const data = await completeKakaoCallbackAuth();
        setUser(data.user);
        const from = safeInternalPath(searchParams.get("from"));
        navigate(resolveClubAllowedPath(from || "/club"), { replace: true });
      } catch (error) {
        await manchuiModal(
          error?.response?.data?.message ||
            "카카오 로그인 세션을 확인하지 못했습니다.",
        );
        navigate("/club/login", { replace: true });
      }
    };

    void run();
  }, [navigate, searchParams, setUser, manchuiModal]);

  return <Loading />;
};

export default KakaoAuthCallback;
