import React, { useEffect, useRef, useState } from "react";
import Cup from "../../components/Cup/Cup";
import Loading from "../../components/Loading/Loading";
import { IoIosArrowForward, IoIosArrowBack, IoMdOpen } from "react-icons/io";
import { IoAlertCircleOutline, IoCheckmark } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import "./Join.css";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL;

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
  const [formError, setFormError] = useState({
    name: "",
    major: "",
    grade: "",
    studentId: "",
    contact: "",
    error: false,
  });

  const checkError = () => {
    const message = {
      name: "",
      major: "",
      grade: "",
      studentId: "",
      contact: "",
      error: false,
    };
    if (formData.name.length < 1) {
      message.name = "*이름은 필수 항목입니다!";
      message.error = true;
    }
    if (formData.major.length < 1) {
      message.major = "*학과는 필수 항목입니다!";
      message.error = true;
    }
    if (formData.grade === "- - -" || !formData.grade) {
      message.grade = "*학년은 필수 항목입니다!";
      message.error = true;
    }
    if (formData.studentId.length !== 10) {
      message.studentId = "*숫자 10자리를 입력해주세요!";
      message.error = true;
    }
    const regex = /^[\w-]*$/;
    if (formData.contact.length < 1) {
      message.contact = "*연락처는 필수 항목입니다!";
      message.error = true;
    } else if (!regex.test(formData.contact)) {
      message.contact = "*영어, 숫자, (-), (_)만 입력 가능합니다!";
      message.error = true;
    }
    setFormError(message);
  };

  const nav = useNavigate();

  const nameRef = useRef();
  const majorRef = useRef();
  const gradeRef = useRef();
  const studentIdRef = useRef();
  const contactRef = useRef();
  const wishRef = useRef();

  const fillCup = (num) => {
    formData.name.length > 0 ? (array[0] = true) : (array[0] = false);
    formData.major.length > 0 ? (array[1] = true) : (array[1] = false);
    formData.grade.length > 0 ? (array[2] = true) : (array[2] = false);
    formData.studentId.length > 0 ? (array[3] = true) : (array[3] = false);
    formData.contact.length > 0 ? (array[4] = true) : (array[4] = false);
    num > 5 || formData.wish.length > 0
      ? (array[5] = true)
      : (array[5] = false);
  };
  const controlIndex = (e, num) => {
    num === 7 ? (array[6] = true) : (array[6] = false);
    e.preventDefault();
    if (num > 7) {
      return;
    }
    if (num > 6) {
      if (formData.wish.length < 1) {
        setFormData({
          ...formData,
          wish: "",
        });
      }
      checkError();
    }
    setFormIndex(num);
    fillCup(num);

    switch (num) {
      case 0:
        setFormError({
          name: "",
          major: "",
          grade: "",
          studentId: "",
          contact: "",
          error: false,
        });
        break;
      case 1:
        nameRef.current.focus();
        break;
      case 2:
        majorRef.current.focus();
        break;
      case 3:
        gradeRef.current.focus();
        break;
      case 4:
        studentIdRef.current.focus();
        break;
      case 5:
        contactRef.current.focus();
        break;
      case 6:
        wishRef.current.focus();
        break;
    }
  };
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setFormError({
      ...formError,
      [e.target.name]: "",
    });
  };
  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const response = await axios.post(
        `${serverUrl}/api/join/apply`,
        formData,
        {
          withCredentials: true,
        }
      );
      alert(response.data.message);
      controlIndex(e, 0);
      //동일한거 있어도 그냥 하기
    } catch (error) {
      alert(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      controlIndex(e, formIndex + 1);
    }
  };

  return (
    <div className="join" onKeyDown={handleKeyPress}>
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
            <div className="text"></div>

            <div
              className={`button ${formIndex === 0 ? "onIndex" : ""}`}
              onClick={(e) => controlIndex(e, 1)}
            >
              가입 신청
            </div>
            <div
              className={`button ${formIndex === 0 ? "onIndex" : ""}`}
              onClick={() => nav("/join/check")}
            >
              신청 확인
            </div>
          </div>
          <div className={`formdiv ${formIndex === 1 ? "visible" : "hide"}`}>
            <div className="text">이름을 입력해주세요</div>
            {formError.name !== "" ? (
              <span className="subText errorText">{formError.name}</span>
            ) : (
              <span className="subText">ex) 홍길동</span>
            )}

            <input
              type="text"
              inputmode="search"
              name="name"
              value={formData.name}
              required
              onChange={handleChange}
              ref={nameRef}
              className={`${formIndex === 1 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`formdiv ${formIndex === 2 ? "visible" : "hide"}`}>
            <div className="text">학과를 입력해주세요</div>
            {formError.major !== "" ? (
              <span className="subText errorText">{formError.major}</span>
            ) : (
              <span className="subText">ex) ICT융합학부</span>
            )}

            <input
              type="text"
              inputmode="search"
              name="major"
              value={formData.major}
              required
              onChange={handleChange}
              ref={majorRef}
              className={`${formIndex === 2 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`formdiv ${formIndex === 3 ? "visible" : "hide"}`}>
            <div className="text">학년을 선택해주세요</div>

            {formError.grade !== "" ? (
              <span className="subText errorText">{formError.grade}</span>
            ) : (
              <span className="subText">*해당사항 없을 시 기타 선택</span>
            )}
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              ref={gradeRef}
              className={`${formIndex === 3 ? "onIndex" : ""}`}
            >
              <option>- - -</option>
              <option>1학년</option>
              <option>2학년</option>
              <option>3학년</option>
              <option>4학년</option>
              <option>5학년</option>
              <option>대학원</option>
              <option>기타</option>
            </select>
          </div>
          <div className={`formdiv ${formIndex === 4 ? "visible" : "hide"}`}>
            <div className="text">학번(10자리)을 입력해주세요</div>

            {formError.studentId !== "" ? (
              <span className="subText errorText">{formError.studentId}</span>
            ) : (
              <span className="subText">
                ex) {new Date().getFullYear()}123456
              </span>
            )}
            <input
              type="number"
              inputmode="search"
              name="studentId"
              value={formData.studentId}
              required
              onChange={handleChange}
              ref={studentIdRef}
              className={`${formIndex === 4 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`formdiv ${formIndex === 5 ? "visible" : "hide"}`}>
            <div className="text">연락처를 입력해주세요</div>
            {formError.contact !== "" ? (
              <span className="subText errorText">{formError.contact}</span>
            ) : (
              <span className="subText">전화번호 or 카카오톡ID</span>
            )}

            <input
              type="text"
              inputmode="search"
              name="contact"
              value={formData.contact}
              required
              onChange={handleChange}
              ref={contactRef}
              className={`${formIndex === 5 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`formdiv ${formIndex === 6 ? "visible" : "hide"}`}>
            <div className="text">해보고 싶은 활동이 있나요?</div>
            <span className="subText">없을 시 공란</span>
            <textarea
              style={{
                width: `${formIndex === 6 ? "54%" : ""}`,
                height: `${formIndex === 6 ? "100px" : "50px"}`,
                transitionDuration: `${formIndex === 6 ? "0.5s" : ""}`,
              }}
              type="text"
              inputmode="search"
              name="wish"
              value={formData.wish}
              onChange={handleChange}
              ref={wishRef}
              className={`${formIndex === 6 ? "onIndex" : ""}`}
            />
          </div>
          <div className={`formdiv ${formIndex === 7 ? "visible" : "hide"}`}>
            <div className="text">아래 정보를 확인해주세요</div>
            <span className="subText">
              추후 공지를 위한 카카오톡 초대 및 가입절차를 위해 정확히
              입력해주세요.
            </span>
            <div className={`checkInfo ${formIndex === 7 ? "onIndex" : ""}`}>
              <div>
                {formError.name.length > 0 ? (
                  <IoAlertCircleOutline
                    className="errorIcon"
                    onClick={(e) => controlIndex(e, 1)}
                  />
                ) : (
                  <IoCheckmark className="checkIcon" />
                )}
                <div className="label">이름: {formData.name} </div>
                <div className="hor"></div>
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 1)}
                />
              </div>

              <div>
                {formError.major.length > 0 ? (
                  <IoAlertCircleOutline
                    className="errorIcon"
                    onClick={(e) => controlIndex(e, 2)}
                  />
                ) : (
                  <IoCheckmark className="checkIcon" />
                )}
                <div className="label">학과: {formData.major} </div>{" "}
                <div className="hor"></div>
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 2)}
                />
              </div>

              <div className="label">
                {formError.grade.length > 0 ? (
                  <IoAlertCircleOutline
                    className="errorIcon"
                    onClick={(e) => controlIndex(e, 3)}
                  />
                ) : (
                  <IoCheckmark className="checkIcon" />
                )}
                <div>학년: {formData.grade}</div> <div className="hor"></div>
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 3)}
                />
              </div>

              <div>
                {formError.studentId.length > 0 ? (
                  <IoAlertCircleOutline
                    className="errorIcon"
                    onClick={(e) => controlIndex(e, 4)}
                  />
                ) : (
                  <IoCheckmark className="checkIcon" />
                )}
                <div className="label">학번: {formData.studentId} </div>{" "}
                <div className="hor"></div>
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 4)}
                />
              </div>
              <div>
                {formError.contact.length > 0 ? (
                  <IoAlertCircleOutline
                    className="errorIcon"
                    onClick={(e) => controlIndex(e, 5)}
                  />
                ) : (
                  <IoCheckmark className="checkIcon" />
                )}
                <div className="label">연락처: {formData.contact}</div>{" "}
                <div className="hor"></div>
                <IoMdOpen
                  className="mdOpen"
                  onClick={(e) => controlIndex(e, 5)}
                />
              </div>
            </div>
            <div className={`${formIndex === 7 ? "onIndex" : ""}`}>
              {formError.error ? (
                <div className="submitError">
                  <span className="errorText">
                    정보를 형식에 맞게 입력해 주세요!
                  </span>
                </div>
              ) : (
                <button className="submit" type="submit">
                  신청 완료
                </button>
              )}
            </div>
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
