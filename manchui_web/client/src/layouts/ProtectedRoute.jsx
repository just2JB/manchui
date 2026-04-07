import { useEffect } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const ProtectedRoute = () => {
  const { setUser, user } = useOutletContext();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const responsse = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true },
        );
        setUser(responsse.data.user);
      } catch (error) {
        console.log("토큰 인증 실패", error);
        setUser(null);
      }
    };
    verifyToken();
  }, [user]);

  return <Outlet context={{ user }} />;
};

export default ProtectedRoute;
