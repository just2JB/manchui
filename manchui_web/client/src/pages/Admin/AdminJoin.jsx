import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import "./AdminJoin.css";
import Table from "../../components/Table/Table";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const AdminJoin = () => {
  const { user } = useOutletContext();
  const [joinData, setJoinData] = useState([]);
  const [messages, setMessages] = useState("");
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [searchData, setSearchData] = useState([]);
  const [sortType, setSortType] = useState("name");
  const [sortedData, setSortedData] = useState([]);

  const fetchJoin = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/join/${user._id}`, {
        withCredentials: true,
      });
      setMessages(response.data.message);
      setJoinData(response.data.joinData);
    } catch (error) {
      setMessages(error.response.data.message);
    }
  };
  useEffect(() => {
    fetchJoin();
  }, []);

  const columns = useMemo(
    () => [
      {
        accessor: "name",
        Header: "이름",
      },
      {
        accessor: "major",
        Header: "학과",
      },
      {
        accessor: "grade",
        Header: "학년",
      },
      {
        accessor: "studentId",
        Header: "학번",
      },
      {
        accessor: "contact",
        Header: "연락처",
      },
      {
        accessor: "wish",
        Header: "하고싶은것",
      },
      {
        accessor: "applyAt",
        Header: "신청한 시각",
      },
    ],
    []
  );
  const data = useMemo(() => {
    if (!joinData || joinData.length === 0) {
      return [];
    }
    return joinData.map((item) => ({
      name: item.name,
      major: item.major,
      grade: item.grade,
      studentId: item.studentId,
      contact: item.contact,
      wish: item.wish,
      applyAt: `${new Date(item.applyAt).toLocaleString()} `,
    }));
  }, [joinData]);

  return (
    <div className="adminJome">
      <div>메시지: {messages}</div>
      <div className="joinTable">
        <Table columns={columns} data={data} setSortType={setSortType} />
      </div>
    </div>
  );
};

export default AdminJoin;
