import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import axios from "axios";
import "./AdminJoin.css";
import { useManchuiModal } from "../../hooks/ManchuiModal";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const AdminJoin = () => {
  const { user } = useOutletContext();
  const manchuiModal = useManchuiModal();

  const [joinData, setJoinData] = useState([]);

  const fetchJoin = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/join/${user._id}`, {
        withCredentials: true,
      });
      manchuiModal(response.data.message);
      setJoinData(response.data.joinData);
    } catch (error) {
      manchuiModal(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchJoin();
  }, []);

  return (
    <div className="adminJoin">
      <div className="topMenu">
        <div className="menu">
          <Link to="../">돌아가기</Link>
          <div className="title">{14}기 가입 신청</div>
          <div className="">정렬 기준</div>
        </div>
        <div className="search">
          <div>이름</div>
          <input />
          <button>검색</button>
        </div>
      </div>
      <div className="joinDatas">
        {joinData.map((data) => (
          <div key={data._id} className="data">
            {data.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminJoin;

/*
필요한 기능
1. 관리자 확인
2. 가입 신청 목록
3. 신청자 검색, 기간 필터링
4. 신청자 가입금 납부 여부 관리
5. 신청자 톡방 초대 여부 관리
6. 신청 기록 삭제
7. 기수 별로 나누기
8. 엑셀 다운로드
9. 가입 기능 온 오프
*/
