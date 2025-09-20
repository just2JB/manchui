import React, { useEffect, useState } from "react";
import Cup from "../../components/Cup/Cup";
import { IoIosArrowForward, IoIosArrowBack, IoMdOpen } from "react-icons/io";
import "./Join.css";
import axios from "axios";

const array = [false, false, false, false, false, false, false];
const Join = () => {
  const [formIndex, setFormIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    major: "",
    grade: "",
    studentId: "",
    contact: "",
    wish: "",
  });
  const fillCup = () => {
    formData.name.length > 0 ? (array[0] = true) : (array[0] = false);
    formData.major.length > 0 ? (array[1] = true) : (array[1] = false);
    formData.grade.length > 0 ? (array[2] = true) : (array[2] = false);
    formData.studentId.length > 0 ? (array[3] = true) : (array[3] = false);
    formData.contact.length > 0 ? (array[4] = true) : (array[4] = false);
    formData.wish.length > 0 ? (array[5] = true) : (array[5] = false);
  };
  const controlIndex = (e, num) => {
    e.preventDefault();
    setFormIndex(num);
    fillCup();
    if (num > 5) {
      if (formData.wish.length < 1) {
        setFormData({
          ...formData,
          wish: "...",
        });
      }
    }
  };
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    alert("hello");
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${serverUrl}/api/join`, formData, {
        withCredentials: true,
      });
      alert(response.data.message);
    } catch (error) {
      console.log(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join">
      <div className="screen">
        <form onSubmit={handleSubmit}>
          <div className={`control `}>
            <div>
              <button
                className={`left ${formIndex === 0 ? "hide" : "visible"}`}
                onClick={(e) => controlIndex(e, formIndex - 1)}
              >
                <IoIosArrowBack />
              </button>
            </div>
            <div>
              <div
                className={`index ${
                  formIndex < 1 || formIndex > 6 ? "index0" : "index1"
                } ${formIndex === 6 ? "index6" : ""} ${
                  formIndex === 7 ? "index7" : ""
                }`}
              >
                {array.map((item, index) => (
                  <button
                    key={index}
                    className={index + 1 === formIndex ? "onform" : ""}
                    onClick={(e) => controlIndex(e, index + 1)}
                  >
                    <Cup fill={item} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <button
                className={`right ${
                  formIndex === 0 || formIndex > 6 ? "hide" : "visible"
                }`}
                onClick={(e) => controlIndex(e, formIndex + 1)}
              >
                <IoIosArrowForward />
              </button>
            </div>
          </div>
          <div
            className={`start ${formIndex === 0 ? "visible" : "hide"} ${
              formIndex === 0 ? "onIndex" : ""
            }`}
          >
            <div className="text">만취 가입하기</div>
            <div
              className={`button ${formIndex === 0 ? "onIndex" : ""}`}
              onClick={() => setFormIndex(1)}
            >
              가입하기
            </div>
          </div>
          <div className={`name ${formIndex === 1 ? "visible" : "hide"}`}>
            <div className="text">이름을 입력해주세요</div>
            <input
              type="text"
              name="name"
              value={formData.name}
              required
              onChange={handleChange}
              className={`${formIndex === 1 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`major ${formIndex === 2 ? "visible" : "hide"}`}>
            <div className="text">학과를 입력해주세요</div>
            <input
              type="text"
              name="major"
              value={formData.major}
              required
              onChange={handleChange}
              className={`${formIndex === 2 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`grade ${formIndex === 3 ? "visible" : "hide"}`}>
            <div className="text">학년을 선택해주세요</div>
            <select
              name="grade"
              value={formData.grade}
              required
              onChange={handleChange}
              className={`${formIndex === 3 ? "onIndex" : ""}`}
            >
              <option>- - -</option>
              <option>1학년</option>
              <option>2학년</option>
              <option>3학년</option>
              <option>4학년</option>
              <option>5학년</option>
              <option>대학원</option>
            </select>
          </div>
          <div className={`studentId ${formIndex === 4 ? "visible" : "hide"}`}>
            <div className="text">학번을 입력해주세요</div>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              required
              onChange={handleChange}
              className={`${formIndex === 4 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`contact ${formIndex === 5 ? "visible" : "hide"}`}>
            <div className="text">연락처를 입력해주세요</div>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              required
              onChange={handleChange}
              className={`${formIndex === 5 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`wish ${formIndex === 6 ? "visible" : "hide"}`}>
            <div className="text">해보고 싶은 활동이 있나요?</div>
            <textarea
              style={{
                width: `${formIndex === 6 ? "54%" : ""}`,
                height: `${formIndex === 6 ? "100px" : "50px"}`,
                transitionDuration: `${formIndex === 6 ? "0.5s" : ""}`,
              }}
              type="text"
              name="wish"
              value={formData.wish}
              onChange={handleChange}
              className={`${formIndex === 6 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`check ${formIndex === 7 ? "visible" : "hide"}`}>
            <div className="text">아래 정보를 확인하세요</div>
            <div className={`checkInfo ${formIndex === 7 ? "onIndex" : ""}`}>
              <div>
                이름: {formData.name}{" "}
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 1)}
                />
              </div>
              <div>
                학과: {formData.major}{" "}
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 2)}
                />
              </div>
              <div>
                학년: {formData.grade}{" "}
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 2)}
                />
              </div>
              <div>
                학번: {formData.studentId}{" "}
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 4)}
                />
              </div>
              <div>
                연락처: {formData.contact}{" "}
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 4)}
                />
              </div>
            </div>
            <button
              className={`submit ${formIndex === 7 ? "onIndex" : ""}`}
              type="submit"
            >
              신청 완료
            </button>
          </div>
        </form>
      </div>
      {loading ? (
        <div>
          <Loading />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Join;
