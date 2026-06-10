import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ModalProvider } from "./hooks/ManchuiModal";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { AuthProvider } from "./context/AuthContext";

import MainPage from "./pages/MainPage/MainPage";
import Goods from "./pages/Goods/Goods";
import ClubRoom from "./pages/ClubRoom/ClubRoom";
import ClubLogin from "./pages/ClubRoom/ClubLogin";
import KakaoAuthCallback from "./pages/ClubRoom/KakaoAuthCallback";
import Join from "./pages/Join/Join";
import Contact from "./pages/Contact/Contact";
import Privacy from "./pages/Privacy/Privacy";
import Terms from "./pages/Terms/Terms";
import Mypage from "./pages/ClubRoom/Mypage/Mypage";
import EditProfile from "./pages/ClubRoom/Mypage/EditProfile";
import EditUser from "./pages/ClubRoom/Mypage/EditUser";
import Reservation from "./pages/ClubRoom/Reservation/Reservation";
import ReservationShare from "./pages/ClubRoom/Reservation/ReservationShare";
import Recommend from "./pages/ClubRoom/Recommend/Recommend";
import RecommendDetail from "./pages/ClubRoom/Recommend/RecommendDetail";
import RecommendEditor from "./pages/ClubRoom/Recommend/RecommendEditor";
import MypageSavedRecommendations from "./pages/ClubRoom/Mypage/MypageSavedRecommendations";
import MypageReservations from "./pages/ClubRoom/Mypage/MypageReservations";
import AdminHome from "./pages/Admin/AdminHome";
import AdminJoin from "./pages/Admin/AdminJoin";
import AdminSetting from "./pages/Admin/AdminSetting";
import AdminMember from "./pages/Admin/AdminMember";
import AdminTeam from "./pages/Admin/AdminTeam";
import AdminReservation from "./pages/Admin/AdminReservation";
import AdminReservationLayout from "./pages/Admin/AdminReservationLayout";
import AdminReservationLimitsPage from "./pages/Admin/AdminReservationLimitsPage";
import AdminRecommend from "./pages/Admin/AdminRecommend";
import AdminLottery from "./pages/Admin/AdminLottery";
import AdminLayout from "./pages/Admin/AdminLayout";
import JoinForm from "./pages/Join/JoinForm";
import JoinCheck from "./pages/Join/JoinCheck";
import NotFound from "./pages/NotFound/NotFound";
import MainLayout from "./layouts/MainLayout";
import ClubRoomLayout from "./layouts/ClubRoomLayout";
import ProtectedRoute from "./layouts/ProtectedRoute";
import ClubReservationOnlyGuard from "./layouts/ClubReservationOnlyGuard";
import AdminRoute from "./layouts/AdminRoute";
import TeamList from "./pages/ClubRoom/Team/TeamList";
import TeamCreate from "./pages/ClubRoom/Team/TeamCreate";
import TeamDetail from "./pages/ClubRoom/Team/TeamDetail";
import TeamSettings from "./pages/ClubRoom/Team/TeamSettings";
import TeamJoin from "./pages/ClubRoom/Team/TeamJoin";
import TeamPracticeCreate from "./pages/ClubRoom/Team/TeamPracticeCreate";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <MainPage /> },
      { path: "/contact", element: <Contact /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/terms", element: <Terms /> },
      { path: "/goods", element: <Goods /> },
      { path: "/join", element: <Join /> },
      { path: "/join/check", element: <JoinCheck /> },
      { path: "/join/form", element: <JoinForm /> },
    ],
  },
  {
    path: "/club",
    element: <ClubRoomLayout />,
    children: [
      { path: "login", element: <ClubLogin /> },
      { path: "auth/kakao/callback", element: <KakaoAuthCallback /> },
      {
        path: "reservation/share/:id",
        element: <ReservationShare />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <ClubReservationOnlyGuard />,
            children: [
              { index: true, element: <ClubRoom /> },
              { path: "reservation", element: <Reservation /> },
              { path: "recommend/new", element: <RecommendEditor /> },
              { path: "recommend/:id/edit", element: <RecommendEditor /> },
              { path: "recommend/:id", element: <RecommendDetail /> },
              { path: "recommend", element: <Recommend /> },
              {
                path: "mypage/recommendations/:kind",
                element: <MypageSavedRecommendations />,
              },
              { path: "mypage/reservations", element: <MypageReservations /> },
              { path: "mypage/profile", element: <EditProfile /> },
              { path: "mypage/username", element: <EditUser /> },
              { path: "mypage/Identification", element: <EditUser /> },
              { path: "mypage/password", element: <EditUser /> },
              { path: "mypage", element: <Mypage /> },
              { path: "team/join/:teamId", element: <TeamJoin /> },
              { path: "team/:teamId/practice/new", element: <TeamPracticeCreate /> },
              { path: "team/new", element: <TeamCreate /> },
              { path: "team/:teamId/settings", element: <TeamSettings /> },
              { path: "team/:teamId", element: <TeamDetail /> },
              { path: "team", element: <TeamList /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHome /> },
          { path: "join", element: <AdminJoin /> },
          { path: "member", element: <AdminMember /> },
          { path: "team", element: <AdminTeam /> },
          {
            path: "reservation",
            element: <AdminReservationLayout />,
            children: [
              { index: true, element: <AdminReservation /> },
              { path: "limits", element: <AdminReservationLimitsPage /> },
            ],
          },
          { path: "recommendation", element: <AdminRecommend /> },
          { path: "lottery", element: <AdminLottery /> },
          { path: "setting", element: <AdminSetting /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

function App() {
  return (
    <ModalProvider>
      <AppSettingsProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AppSettingsProvider>
    </ModalProvider>
  );
}

export default App;
