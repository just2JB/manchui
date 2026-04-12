import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import AuthWindow from "../pages/ClubRoom/AuthWindow/AuthWindow";
import { useManchuiModal } from "../hooks/ManchuiModal";
import "./AdminRoute.css";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const AdminRoute = () => {
  const manchuiModal = useManchuiModal();
  const nav = useNavigate();
  /** 로그인 성공 직후 AuthWindow가 닫힐 때 /club 으로 보내지 않기 위함 */
  const skipCloseNavigateRef = useRef(false);

  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const verifySession = async () => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/verify-token`,
        {},
        { withCredentials: true },
      );
      const u = res.data?.user;
      if (!u) {
        setStatus("unauthenticated");
        setAuthOpen(true);
        return;
      }
      if (u.position !== "임원진") {
        setUser(u);
        setStatus("forbidden");
        return;
      }
      setUser(u);
      setStatus("ready");
    } catch {
      setStatus("unauthenticated");
      setAuthOpen(true);
    }
  };

  useEffect(() => {
    void verifySession();
  }, []);

  useEffect(() => {
    if (status !== "forbidden") return;
    let cancelled = false;
    (async () => {
      await manchuiModal("임원진만 관리자 페이지에 접근할 수 있습니다.");
      if (!cancelled) nav("/club");
    })();
    return () => {
      cancelled = true;
    };
  }, [status, manchuiModal, nav]);

  const handleUserAfterLogin = (u) => {
    setUser(u);
    if (u?.position === "임원진") {
      skipCloseNavigateRef.current = true;
      setStatus("ready");
      setAuthOpen(false);
    } else {
      void (async () => {
        await manchuiModal("임원진만 관리자 페이지에 접근할 수 있습니다.");
        nav("/club");
      })();
    }
  };

  const setOpenAuthWindow = (open) => {
    if (open) {
      setAuthOpen(true);
      return;
    }
    setAuthOpen(false);
    if (skipCloseNavigateRef.current) {
      skipCloseNavigateRef.current = false;
      return;
    }
    nav("/club");
  };

  if (status === "loading") {
    return (
      <div className="admin-route-loading" aria-busy="true" aria-live="polite">
        확인 중…
      </div>
    );
  }

  if (status === "forbidden") {
    return null;
  }

  if (status === "unauthenticated") {
    return (
      <>
        {authOpen ? (
          <AuthWindow
            setUser={handleUserAfterLogin}
            setOpenAuthWindow={setOpenAuthWindow}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <ScrollToTopOnRoute />
      <Outlet context={{ user }} />
    </>
  );
};

export default AdminRoute;
