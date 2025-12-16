import React, { useEffect, useRef, useState } from "react";
import Cup from "../../components/Cup/Cup";
import Loading from "../../components/Loading/Loading";
import { IoIosArrowForward, IoIosArrowBack, IoMdOpen } from "react-icons/io";
import { IoAlertCircleOutline, IoCheckmark } from "react-icons/io5";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./Join.css";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL;

const array = [false, false, false, false, false, false, false];
const ExJoin = () => {
  const [formIndex, setFormIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const { formData, setFormData, formError, setFormError } = useOutletContext();

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
    const numTest = /^\d+$/;
    if (formData.studentId.length !== 10 || !numTest.test(formData.studentId)) {
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
              type="text"
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

export default ExJoin;

//학번 중복 있을 시 그냥 진행되도록
//중복 학번 조회시 모두 표시해주게 변경(JoinCheck.jsx 수정 필요)
//route 형태로 변경할 것
/**.join {
  height: 100vh;
}
.join > .screen {
  height: 90vh;
  color: var(--text-primary);
  align-items: center;
  align-content: center;
}
.join form {
  width: 100vw;
  padding-bottom: 100px;
}
.join .text {
  font-size: 20px;
  font-weight: 200;
}
.join .subText {
  font-size: 14px;
  font-weight: 100;
}
.join .control {
  flex-direction: row;
  justify-content: space-around;
}
.join .control > div {
  margin-top: 30px;
  z-index: 300;
  cursor: pointer;
}
.join .control > div > button {
  border: 1px solid var(--primary-200);
  border-radius: 10px;
  background-color: #00000000;
  height: 50px;
  width: 10vw;
  color: var(--text-primary);
  cursor: pointer;
}

.join .index0 {
  transform: translateY(50vh);
}

.join .index1 {
  transform: translateY(45px);
}
.join .index6 {
  transform: translateY(105px);
}
.join .index7 {
  transform: translateY(190px);
}

.join .control > div .index {
  height: 0px;
  transition-duration: 0.5s;
}

.join .control .index {
  cursor: auto;
  display: flex;
  gap: 5px;
}

.join .index > button {
  transition-duration: 0.3s;
  border: none;
}
.onform {
  transform: translateY(-6px);
}
.onIndex {
  animation: onIndex;
  animation-duration: 1s;
}
.visible {
  visibility: visible;
}
.hide {
  transform: rotateY(90deg);
}
.join form > div {
  position: absolute;
  width: 100vw;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 10px;
}
.join .formdiv {
  margin-top: -30px;
}
.join .start > .button {
  text-align: center;
  align-content: center;
  height: 60px;
  width: 200px;
  background-color: var(--backgournd-dark);
  color: var(--text-primary);
  border: 1px solid var(--primary-300);
  font-size: 20px;
  border-radius: 20px;
  font-weight: 200;
  cursor: pointer;
  user-select: none;
}
.join .start > .button:hover {
  transition-duration: 0.3s;
  border-color: var(--box-2);
  outline: none;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px #8080808f;
}

.join input {
  background-color: var(--backgournd-dark);
  border: 1px solid var(--primary-200);
  border-radius: 10px;
  height: 50px;
  width: 30%;
  z-index: 0;
  color: var(--text-primary);
  text-align: center;
  font-size: medium;
}
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.join input:focus {
  border-color: var(--brand-red);
  outline: none;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px var(--brand-red);
  transition-duration: 0.5s;
}
.join select {
  background-color: var(--backgournd-dark);
  border: 1px solid var(--primary-200);
  border-radius: 10px;
  height: 50px;
  width: 30%;
  color: var(--text-primary);
  text-align: center;
  font-size: medium;
}
.join select:focus {
  transition-duration: 0.5s;
  border-color: var(--brand-red);
  outline: none;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px var(--brand-red);
}
.join textarea {
  background-color: var(--backgournd-dark);
  border: 1px solid var(--primary-200);
  border-radius: 10px;
  height: 100px;
  width: 30%;
  color: var(--text-primary);
  padding: 4px;
  resize: none;
  z-index: 1;
}
.join textarea:focus {
  border-color: var(--brand-red);
  outline: none;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px var(--brand-red);
}

.join .mdOpen {
  height: 10px;
  height: 14px;
  cursor: pointer;
}

.join .checkInfo {
  position: relative;
  background-color: var(--backgournd-dark);
  border: 1px solid var(--primary-200);
  border-radius: 10px;
  width: 400px;
  height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  color: var(--text-primary);
  padding: 4px;
  resize: none;
  overflow: hidden;
  z-index: 0;
}
.join .checkInfo > div {
  width: 100%;
  font-weight: 50;
  align-content: center;
  display: flex;
  justify-content: space-around;
  flex-direction: row;
}
.join .hor {
  flex: 0.9;
  margin-top: 10px;
  border-top: 1px dotted var(--primary-200);
}
.join .checkInfo > div > .checkIcon {
  color: rgb(16, 206, 80);
  width: 15px;
}
.join .checkInfo > div > .errorIcon {
  color: var(--brand-red);
  width: 15px;
  visibility: visible;
  cursor: pointer;
}

.join .submit {
  background-color: var(--box-1);
  border: 1px solid var(--text-primary);
  border-radius: 10px;
  width: 200px;
  height: 50px;
  color: var(--text-primary);
  font-size: medium;
  z-index: 0;
  animation-duration: 2s;
  font-weight: 200;
}
.join .submit:hover {
  border-color: var(--brand-red);
  outline: none;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px var(--brand-red);
}
.join .submitError {
  height: 50px;
  align-content: center;
  font-size: 17px;
}
.join .errorText {
  color: var(--brand-red);
  font-weight: 300;
}

@keyframes onIndex {
  0% {
    color: #f5f5f500;
    border-color: #f5f5f500;
  }
  100% {
  }
}

@media screen and (max-width: 767px) {
  .join textarea {
    width: 200px;
  }
  .join .checkInfo {
    width: 54%;
  }
  .join select {
    width: 200px;
  }
  .join input {
    width: 200px;
  }
  .join .submit {
    width: 130px;
  }
  .join .subText {
    font-size: 11px;
  }
  .join .formdiv {
    margin-top: -25px;
  }
  .join .checkInfo > div {
    flex-direction: row;
    justify-content: start;
    gap: 5px;
  }
  .join .hor {
    position: fixed;
  }
  .join .mdOpen {
    position: absolute;
    height: 14px;
    right: 10px;
  }
}
 */
