import React, { useEffect, useRef, useState } from "react";
import "./JoinForm.css";
import { useNavigate } from "react-router-dom";
import { MdKeyboardArrowDown, MdLanguage } from "react-icons/md";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import Cup from "../../components/Cup/Cup";

const JoinForm = () => {
  const nav = useNavigate();
  const nameRef = useRef();
  const studentIdRef = useRef();
  const academicStateRef = useRef();
  const confirmButtonRef = useRef();
  const gradeRef = useRef();
  const collegeRef = useRef();
  const majorRef = useRef();
  const contactRef = useRef();

  const [majorList, setMajorList] = useState([]);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    academicState: "",
    college: "",
    major: "",
    grade: 0,
    studentId: "",
    contact: "",
    contactType: "phoneNumber",
    wish: "",
  });
  const [formNum, setFormNum] = useState(0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [swiperInstance, setSwiperInstance] = useState(null);
  const [optionIndex, setOptionIndex] = useState(0);
  const handleSwiper = (swiper) => {
    setSwiperInstance(swiper);
  };
  const handleSwipeMove = (e) => {
    if (swiperInstance) {
      setOptionIndex(swiperInstance.realIndex);
    }
    if (swiperInstance.realIndex === 1) {
      setFormData({ ...formData, academicState: "휴학" });
    } else if (swiperInstance.realIndex === 2) {
      setFormData({ ...formData, academicState: "졸업" });
    } else {
      setFormData({ ...formData, academicState: "재학" });
    }
  };

  const [swiperInstance1, setSwiperInstance1] = useState(null);
  const [optionIndex1, setOptionIndex1] = useState(0);
  const handleSwiper1 = (swiper) => {
    setSwiperInstance1(swiper);
  };
  const handleSwipeMove1 = (e) => {
    if (swiperInstance1) {
      setOptionIndex1(swiperInstance1.realIndex);
    }
    if (swiperInstance1.realIndex === 0) {
      setFormData({ ...formData, grade: 1 });
    } else if (swiperInstance1.realIndex === 1) {
      setFormData({ ...formData, grade: 2 });
    } else if (swiperInstance1.realIndex === 2) {
      setFormData({ ...formData, grade: 3 });
    } else if (swiperInstance1.realIndex === 3) {
      setFormData({ ...formData, grade: 4 });
    } else if (swiperInstance1.realIndex === 4) {
      setFormData({ ...formData, grade: 5 });
    }
  };

  const [swiperInstance2, setSwiperInstance2] = useState(null);
  const [optionIndex2, setOptionIndex2] = useState(0);
  const handleSwiper2 = (swiper) => {
    setSwiperInstance2(swiper);
  };
  const handleSwipeMove2 = (e) => {
    if (swiperInstance2) {
      setOptionIndex2(swiperInstance2.realIndex);
    }
  };

  const [swiperInstance3, setSwiperInstance3] = useState(null);
  const [optionIndex3, setOptionIndex3] = useState(0);
  const handleSwiper3 = (swiper) => {
    setSwiperInstance3(swiper);
  };
  const handleSwipeMove3 = (e) => {
    if (swiperInstance3) {
      setOptionIndex3(swiperInstance3.realIndex);
    }
  };

  const handleFocus = (num) => {
    studentIdRef.current.placeholder = "";
    contactRef.current.placeholder = "";
    setFormNum(num);
    if (num === 1) {
      nameRef.current.focus();
    } else if (num === 2) {
      studentIdRef.current.focus();
      studentIdRef.current.placeholder =
        String(new Date().getFullYear()) + "000000";
    } else if (num === 3) {
      setFormNum(4);
    } else if (num === 5) {
      setFormNum(6);
    } else if (num === 11) {
      contactRef.current.focus();
      contactRef.current.placeholder = "010-0000-0000";
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (formNum < 12) {
      setFormNum(formNum + 1);
    }
  };

  // 다음 버튼 위치 조정
  useEffect(() => {
    const nextButton = document.getElementsByClassName("nextButton")[0];
    const inputboxes = document.getElementsByClassName("inputbox");
    const confirmButton = document.getElementsByClassName("confirmButton");

    if (formNum < 2) {
      nameRef.current.focus();

      inputboxes[0].appendChild(nextButton);
      confirmButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setProgress(1);
    } else if (formNum === 2) {
      studentIdRef.current.focus();
      inputboxes[1].appendChild(nextButton);
      confirmButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setProgress(2);
    } else if (formNum > 2 && formNum < 5) {
      if (formNum === 4) {
        academicStateRef.current.focus();
      }
      confirmButton[0].appendChild(nextButton);
      window.scrollTo({
        top: 180,
        behavior: "smooth",
      });
      setProgress(3);
    } else if (formNum > 4 && formNum < 7) {
      if (formNum === 6) {
        gradeRef.current.focus();
      }
      confirmButton[1].appendChild(nextButton);
      window.scrollTo({
        top: 180,
        behavior: "smooth",
      });
      setProgress(3);
    } else if (formNum > 6 && formNum < 10) {
      if (formNum === 8) {
        collegeRef.current.focus();
      }
      confirmButton[2].appendChild(nextButton);
      window.scrollTo({
        top: 270,
        behavior: "smooth",
      });
      setProgress(4);
    } else if (formNum > 9 && formNum < 11) {
      if (formNum === 10) {
        majorRef.current.focus();
      }
      confirmButton[3].appendChild(nextButton);
      window.scrollTo({
        top: 270,
        behavior: "smooth",
      });
      setProgress(4);
    } else if (formNum === 11) {
      contactRef.current.focus();
      inputboxes[6].appendChild(nextButton);
      confirmButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setProgress(5);
    } else if (formNum === 12) {
      window.scrollTo({
        top: 50,
        behavior: "smooth",
      });
      confirmButtonRef.current.focus();
    }
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (formNum < 12) {
          setFormNum(formNum + 1);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (formNum > 0) {
          setFormNum(formNum - 1);
        }
      } else if (e.key === "ArrowDown") {
        console.log("Enter 키가 눌렸습니다!");
        e.preventDefault();
        if (formNum === 4) {
          swiperInstance.slideNext();
        } else if (formNum === 6) {
          swiperInstance1.slideNext();
        } else if (formNum === 8) {
          swiperInstance2.slideNext();
        } else if (formNum === 10) {
          swiperInstance3.slideNext();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (formNum === 4) {
          swiperInstance.slidePrev();
        } else if (formNum === 6) {
          swiperInstance1.slidePrev();
        } else if (formNum === 8) {
          swiperInstance2.slidePrev();
        } else if (formNum === 10) {
          swiperInstance3.slidePrev();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [formNum]);

  return (
    <div className="joinForm">
      <div className="stateBar">
        <div className="progressBar">
          <div
            className="progressFill"
            style={{ width: `${(progress - 1) * 25}%` }}
          ></div>
          <div className="cups">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="cup">
                <Cup fill={progress >= num} />
              </div>
            ))}
          </div>
        </div>
        <div className="text">
          {formNum === 1
            ? "이름을 입력해주세요"
            : formNum === 2
              ? "학번을 입력해주세요"
              : formNum === 3 || formNum === 4
                ? "학적상태를 선택해주세요"
                : formNum === 5 || formNum === 6
                  ? "학년을 선택해주세요"
                  : formNum === 7 || formNum === 8
                    ? "단과대학을 선택해주세요"
                    : formNum === 9 || formNum === 10
                      ? "전공을 선택해주세요"
                      : formNum === 11
                        ? "연락처를 입력해주세요"
                        : "정보를 확인하세요"}
        </div>
      </div>

      <form className="form">
        <div className="language">
          <MdLanguage />
          한국어
        </div>
        <button
          ref={confirmButtonRef}
          className="nextButton"
          onClick={handleNext}
        >
          다음
        </button>
        <div className="name inputbox">
          <label className={`label ${formNum === 1 ? "activeLabel" : ""}`}>
            이름
          </label>
          <input
            ref={nameRef}
            name="name"
            placeholder="김만취"
            onFocus={() => handleFocus(1)}
            onChange={handleChange}
            value={formData.name}
          />
        </div>
        <div
          className={`studentId inputbox ${formNum > 1 ? "visible" : "hidden"}`}
        >
          <label className={`label ${formNum === 2 ? "activeLabel" : ""}`}>
            학번
          </label>
          <input
            ref={studentIdRef}
            name="studentId"
            onFocus={() => handleFocus(2)}
            onChange={handleChange}
            value={formData.studentId}
          />
        </div>

        <div
          className="twoInputBox"
          style={{ visibility: `${formNum > 2 ? "visible" : "hidden"}` }}
        >
          <div
            className={`academicState inputbox ${formNum > 2 ? "visible" : "hidden"}`}
          >
            <label className={`label ${formNum === 4 ? "activeLabel" : ""}`}>
              학적상태
            </label>
            <div
              ref={academicStateRef}
              className="select"
              tabIndex="0"
              name="academicState"
              onClick={() => handleFocus(3)}
            >
              {formData.academicState}
              <div
                className={`academicStateArrow ${formNum === 4 ? "arrowUp activeLabel" : ""}`}
              >
                <MdKeyboardArrowDown />
              </div>
            </div>
            <div
              className={`optionsBox academicStateOption ${formNum === 4 ? "activeOptions" : ""}`}
            >
              <div className="blur" onClick={() => setFormNum(3)}></div>
              <div className="options">
                <div className="confirmButton"></div>
                <Swiper
                  className="swiper"
                  spaceBetween={10}
                  slidesPerView={5}
                  direction={"vertical"}
                  onSwiper={handleSwiper}
                  onRealIndexChange={handleSwipeMove}
                >
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                  {["재학", "휴학", "졸업"].map((state, index) => (
                    <SwiperSlide
                      className={`option ${optionIndex === index ? "selectedOption" : ""}`}
                      onClick={() => {
                        swiperInstance.slideTo(index);
                      }}
                    >
                      {state}
                    </SwiperSlide>
                  ))}
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                </Swiper>
              </div>
            </div>
          </div>
          <div
            className={`grade inputbox ${formNum > 4 ? "visible" : "hidden"}`}
            style={{ flex: `${formNum > 4 ? 1 : 0}` }}
          >
            <label className={`label ${formNum === 6 ? "activeLabel" : ""}`}>
              학년
            </label>
            <div
              ref={gradeRef}
              className="select"
              tabIndex="0"
              name="grade"
              onClick={() => handleFocus(5)}
            >
              {formData.grade}
              <div
                className={`academicStateArrow ${formNum === 6 ? "arrowUp activeLabel" : ""}`}
              >
                <MdKeyboardArrowDown />
              </div>
            </div>
            <div
              className={`optionsBox gradeOption ${formNum === 6 ? "activeOptions" : ""}`}
            >
              <div className="blur" onClick={() => setFormNum(5)}></div>
              <div className="options">
                <div className="confirmButton"></div>
                <Swiper
                  className="swiper"
                  spaceBetween={10}
                  slidesPerView={5}
                  direction={"vertical"}
                  onSwiper={handleSwiper1}
                  onRealIndexChange={handleSwipeMove1}
                >
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                  {[1, 2, 3, 4, 5].map((grade) => (
                    <SwiperSlide
                      key={grade}
                      className={`option ${optionIndex1 === grade - 1 ? "selectedOption" : ""}`}
                      onClick={() => {
                        swiperInstance1.slideTo(grade - 1);
                      }}
                    >
                      {grade}
                    </SwiperSlide>
                  ))}
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                </Swiper>
              </div>
            </div>
          </div>
        </div>

        <div
          className="twoInputBox"
          style={{ visibility: `${formNum > 6 ? "visible" : "hidden"}` }}
        >
          <div
            className={`college inputbox ${formNum > 6 ? "visible" : "hidden"}`}
          >
            <label className={`label ${formNum === 8 ? "activeLabel" : ""}`}>
              단과대학
            </label>
            <div
              ref={collegeRef}
              className="select"
              tabIndex="0"
              name="college"
              onClick={() => handleFocus(8)}
            >
              <div
                className={`academicStateArrow ${formNum === 8 ? "arrowUp activeLabel" : ""}`}
              >
                <MdKeyboardArrowDown />
              </div>
            </div>
            <div
              className={`optionsBox collegeOption ${formNum === 8 ? "activeOptions" : ""}`}
            >
              <div className="blur" onClick={() => setFormNum(7)}></div>
              <div className="options">
                <div className="confirmButton"></div>
                <Swiper
                  className="swiper"
                  spaceBetween={10}
                  slidesPerView={5}
                  direction={"vertical"}
                  onSwiper={handleSwiper2}
                  onRealIndexChange={handleSwipeMove2}
                >
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                  {[
                    "소프트웨어융합대학",
                    "라이언스칼리지",
                    "공학대학",
                    "경상대학",
                    "예술대학",
                  ].map((college, index) => (
                    <SwiperSlide
                      className={`option ${optionIndex2 === index ? "selectedOption" : ""}`}
                      onClick={() => {
                        swiperInstance2.slideTo(index);
                      }}
                    >
                      {college}
                    </SwiperSlide>
                  ))}
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                </Swiper>
              </div>
            </div>
          </div>
          <div
            className={`major inputbox ${formNum > 8 ? "visible" : "hidden"}`}
            style={{ flex: `${formNum > 8 ? 1 : 0}` }}
          >
            <label className={`label ${formNum === 10 ? "activeLabel" : ""}`}>
              전공
            </label>
            <div
              ref={majorRef}
              className="select"
              tabIndex="0"
              name="major"
              onClick={() => handleFocus(10)}
            >
              <div
                className={`academicStateArrow ${formNum === 10 ? "arrowUp activeLabel" : ""}`}
              >
                <MdKeyboardArrowDown />
              </div>
            </div>
            <div
              className={`optionsBox majorOption ${formNum === 10 ? "activeOptions" : ""}`}
            >
              <div className="blur" onClick={() => setFormNum(9)}></div>
              <div className="options">
                <div className="confirmButton"></div>
                <Swiper
                  className="swiper"
                  spaceBetween={10}
                  slidesPerView={5}
                  direction={"vertical"}
                  onSwiper={handleSwiper3}
                  onRealIndexChange={handleSwipeMove3}
                >
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                  {["ICT융합학부", "경영학부", "기계공학과"].map(
                    (major, index) => (
                      <SwiperSlide
                        key={major}
                        className={`option ${optionIndex3 === index ? "selectedOption" : ""}`}
                        onClick={() => {
                          swiperInstance3.slideTo(index);
                        }}
                      >
                        {major}
                      </SwiperSlide>
                    ),
                  )}
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                </Swiper>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`contact inputbox ${formNum > 9 ? "visible" : "hidden"}`}
          style={{ visibility: `${formNum > 9 ? "visible" : "hidden"}` }}
        >
          <label className={`label ${formNum === 11 ? "activeLabel" : ""}`}>
            연락처
          </label>
          <input
            ref={contactRef}
            name="contact"
            onFocus={() => handleFocus(11)}
            onChange={handleChange}
            value={formData.contact}
            placeholder=""
          />
        </div>
      </form>
    </div>
  );
};

export default JoinForm;
