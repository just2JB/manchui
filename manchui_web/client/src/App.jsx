import "./App.css";
import { useEffect, useState } from "react";
import {
  createBrowserRouter,
  useNavigate,
  Outlet,
  RouterProvider,
  useOutletContext,
} from "react-router-dom";
import { ModalProvider } from "./hooks/ManchuiModal";

import axios from "axios";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import MainPage from "./pages/MainPage/MainPage";
import About from "./pages/About/About";
import Goods from "./pages/Goods/Goods";
import ClubRoom from "./pages/ClubRoom/ClubRoom";
import Join from "./pages/Join/Join";
import ClubRoomNavbar from "./pages/ClubRoom/ClubRoomNavbar";
import Reservation from "./pages/ClubRoom/Reservation/Reservation";
import Mypage from "./pages/ClubRoom/Mypage/Mypage";
import EditUser from "./pages/ClubRoom/Mypage/EditUser";
import Practice from "./pages/ClubRoom/Practice/Practice";
import CreateTeam from "./pages/ClubRoom/Team/CreateTeam";
import TeamMain from "./pages/ClubRoom/Team/TeamMain";
import TeamJoin from "./pages/ClubRoom/Team/TeamJoin";
import EditTeam from "./pages/ClubRoom/Team/EditTeam";
import Team from "./pages/ClubRoom/Team/Team";
import AdminHome from "./pages/Admin/AdminHome";
import AdminJoin from "./pages/Admin/AdminJoin";
import AdminSetting from "./pages/Admin/AdminSetting";
import EditSchedule from "./pages/ClubRoom/Schedule/EditSchedule";
import BottomBar from "./pages/ClubRoom/BottomBar";
import Schedule from "./pages/ClubRoom/Schedule/Schedule";
import AuthWindow from "./pages/ClubRoom/AuthWindow/AuthWindow";
import LoginFormEmail from "./pages/ClubRoom/AuthWindow/LoginFormEmail";
import SignUpEmail from "./pages/ClubRoom/AuthWindow/SignUpEmail";
import JoinForm from "./pages/Join/JoinForm";

const serverUrl = import.meta.env.VITE_SERVER_URL;

function ProtectedRoute() {
  const [isAuthenticated, setIsauthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const { setIsLogin } = useOutletContext();
  const nav = useNavigate();
  const notAuth = () => {
    nav("/login");
    alert("로그인 해야 사용할 수 있습니다.");
  };

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const responsse = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true },
        );
        setIsauthenticated(responsse.data.isValid);
        setUser(responsse.data.user);
        setIsLogin(true);
      } catch (error) {
        console.log("토큰 인증 실패", error);
        setIsauthenticated(false);
        setIsLogin(false);
        setUser(null);
      }
    };
    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }
  return isAuthenticated ? (
    <Outlet context={{ user, setUser, setIsLogin }} />
  ) : (
    notAuth()
  );
}

function AdminRoute() {
  const [isAuthenticated, setIsauthenticated] = useState(null);
  const [user, setUser] = useState(null);

  const nav = useNavigate();
  const notAuth = () => {
    nav("/login");
    alert("임원진이 아닙니다.");
  };

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const responsse = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true },
        );
        setIsauthenticated(responsse.data.isValid);
        setUser(responsse.data.user);
        if (responsse.data.user.position !== "임원진") {
          notAuth();
        }
      } catch (error) {
        console.log("토큰 인증 실패", error);
        setIsauthenticated(false);
        setUser(null);
      }
    };
    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }
  return isAuthenticated ? <Outlet context={{ user }} /> : notAuth();
}

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function ClubRoomLayout() {
  const [isLogin, setIsLogin] = useState(false);
  return (
    <>
      <div className="clubRoomLayout">
        <ClubRoomNavbar isLogin={isLogin} setIsLogin={setIsLogin} />
        <div className="clubRoombody">
          <Outlet
            context={{
              isLogin,
              setIsLogin,
            }}
          />
        </div>
        <BottomBar />
      </div>
    </>
  );
}

function LoginRoute() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordCheck: "",
    username: "",
    clubcode: "",
    Identification: "",
  });
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const nav = useNavigate();
  const loginHandle = async (e) => {
    e.preventDefault();
    setFormData({ email: formData.email, password: formData.password });
    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/login`,
        formData,
        {
          withCredentials: true,
        },
      );

      if (response.data.user) {
        nav("/club");
        return;
      } else {
        return alert(response.data.message);
      }
    } catch (error) {
    } finally {
    }
  };
  const signUpHandle = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.passwordCheck) {
      return;
    }
    if (formData.clubcode != 10007) {
      return;
    }
    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/signup`,
        formData,
      );
      if (response.status === 201) {
        alert("계정 생성이 성공 되었습니다.");
        setFormData({ email: formData.email, password: "" });
        nav("/login/login-email");
      }
    } catch (error) {
    } finally {
    }
  };
  return (
    <div className="loginPage">
      <Outlet
        context={{
          formData,
          loginHandle,
          handleChange,
          signUpHandle,
          nav,
        }}
      />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <MainPage /> },
      { path: "/about", element: <About /> },
      { path: "/goods", element: <Goods /> },
      { path: "/join", element: <Join /> },
      { path: "/join/form", element: <JoinForm /> },
    ],
  },
  {
    path: "/login",
    element: <LoginRoute />,
    children: [
      { index: true, element: <AuthWindow /> },
      { path: "login-email", element: <LoginFormEmail /> },
      { path: "signup-email", element: <SignUpEmail /> },
    ],
  },
  {
    path: "/club",
    element: <ClubRoomLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <ClubRoom /> },
          { path: "team/join/:id", element: <TeamJoin /> },
          { path: "practice", element: <Practice /> },
          { path: "team", element: <Team /> },
          { path: "team/create-team", element: <CreateTeam /> },
          { path: "team/edit-team/:id", element: <EditTeam /> },
          { path: "team/team-main/:id", element: <TeamMain /> },
          { path: "reservation", element: <Reservation /> },
          { path: "schedule", element: <Schedule /> },
          { path: "schedule/list", element: <Schedule /> },
          { path: "mypage", element: <Mypage /> },
          { path: "mypage/:data", element: <EditUser /> },
          { path: "edit-schedule/:date", element: <EditSchedule /> },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      { index: true, element: <AdminHome /> },
      { path: "join", element: <AdminJoin /> },
      { path: "setting", element: <AdminSetting /> },
    ],
  },
]);

function App() {
  return (
    <ModalProvider>
      <RouterProvider router={router} />
    </ModalProvider>
  );
}

export default App;
