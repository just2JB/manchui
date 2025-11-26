import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import axios from "axios";

import AuthWindow from "./AuthWindow/AuthWindow";
import "./ClubRoom.css";
import Loading from "../../components/Loading/Loading";
import Beams from "../../components/Beams/Beams";
import { RiMenuFoldFill, RiMenuFold2Fill } from "react-icons/ri";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const ClubRoom = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ username: "" });
  const { isLogin, setIsLogin, authIsOpen, setAuthIsOpen } = useOutletContext();
  const [profilSpeed, setProfilSpeed] = useState(4);

  useEffect(() => {
    setLoading(true);

    const verifyToken = async () => {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/verify-token`,
          {},
          { withCredentials: true }
        );
        if (response.data.isValid) {
          setUser(response.data.user);
          setIsLogin(true);

          return;
        }

        return;
      } catch (error) {
        console.log("토큰 인증 실패", error);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const handleLogout = async (e) => {
    if (confirm(`로그아웃 하시겠습니까?`)) {
      try {
        const response = await axios.post(
          `${serverUrl}/api/auth/logout`,
          {},
          { withCredentials: true }
        );
        alert(response.data.message);
        setIsLogin(false);
        setUser({ username: "" });
      } catch (error) {
        console.log("토큰인증 실패");
      }
    }
  };

  return (
    <div className="club-room">
      <div className="my-info">
        <div className="infoBack">
          <Beams
            beamWidth={3.2}
            beamHeight={40}
            beamNumber={10}
            lightColor="rgba(184, 184, 184, 1)"
            speed={profilSpeed}
            noiseIntensity={2}
            s
            scale={0.2}
            rotation={315}
          />
        </div>
        <div className="profil">
          <div className="profilCard">
            <div className="user">
              <div className="userImage">
                <img
                  src="/profilIcon.png"
                  alt="Logo"
                  className="defaultImage"
                />
              </div>
              <div className="userText">
                <div className="Identification">{user.Identification} </div>
                <div className="username">{user.username} </div>
                <div className="position">직책: {user.position}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}

      {authIsOpen ? (
        <AuthWindow
          setIsLogin={setIsLogin}
          setUser={setUser}
          setAuthIsOpen={setAuthIsOpen}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default ClubRoom;

/*

------------------------------------------------------------

1. 로그인 안하면 화면 안보이게 로그인 화면 띄우기 

------------------------------------------------------------


2. 메인 홈을 대시보드처럼 만들기
> 내 정보
> 다음 연습, 예정된 연습 개수
> 스케줄 요청된 개수 > 클릭 시 일정 작성으로 이동

------------------------------------------------------------

3. 일정 작성 페이지
> 달력으로 요청된 날짜 보기
> 클릭하여 수정 페이지로 이동
> 상단 메뉴에 요청 날짜순 나열
> 기회가 되면 프리셋 만들어보기(시간표 미리 입력해서 안되는 시간 제외)

------------------------------------------------------------

4. 연습 페이지 
> 내연습만 보기, 전체 보기 UI 완성
> 전체적 구성 및 디자인 수정

------------------------------------------------------------

5. 팀 페이지 
> 구분 아이디 볼 수 있게 업데이트
> 설명 수정하기 완성
> 리더 권한 설정
> 비리더 팀원 전용 UI구성
> 팀 정보 수정 페이지 만들기
> 디자인 수정
> 연습 생성, 편집 시 연습실 정보 열람 가능하도록

 -----------------------------------------------------------

6. 동방 예약 말고 연습실 예약 관련 페이지로 변경
> 주변 연습실 정보
> 주변 엽습실 예약 정보
> 동아리방 예약
> 동아리방 이용 안내 
> 동방 예약 공유 페이지 만들기

------------------------------------------------------------

- 임원진 기능 만들기 < 후순위
*/
