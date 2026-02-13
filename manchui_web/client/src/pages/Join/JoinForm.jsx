import React, { useEffect, useRef, useState } from "react";
import "./JoinForm.css";
import { useNavigate } from "react-router-dom";
import { MdKeyboardArrowDown } from "react-icons/md";
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
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    type: "",
    name: "",
    major: "",
    grade: 0,
    studentId: "",
    contact: "",
    contactType: "phoneNumber",
    wish: "",
  });
  const [formNum, setFormNum] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [optionIndex, setOptionIndex] = useState(0);
  const handleSwiper = (swiper) => {
    setSwiperInstance(swiper);
  };
  const handleSwipeMove = (e) => {
    if (swiperInstance) {
      setOptionIndex(swiperInstance.realIndex);
    }
  };
  const [swiperInstance1, setSwiperInstance1] = useState(null);
  const [optionIndex1, setOptionIndex1] = useState(0);
  const handleSwiper1 = (swiper) => {
    setSwiperInstance1(swiper);
  };

  const handleSwipeMove1 = (e) => {
    if (swiperInstance1) {
      setOptionIndex(swiperInstance1.realIndex);
    }
  };
  const handleFocus = (num) => {
    studentIdRef.current.placeholder = "";
    setFormNum(num);
    if (num === 1) {
    } else if (num === 2) {
      studentIdRef.current.focus();
      studentIdRef.current.placeholder =
        String(new Date().getFullYear()) + "000000";
    } else if (num === 3) {
      setFormNum(4);
    } else if (num === 5) {
      setFormNum(6);
    }
  };

  const handleNext = () => {
    if (formNum === 1) {
      studentIdRef.current.focus();
    } else if (formNum === 2) {
      setFormNum(3);
    } else if (formNum === 4) {
      setFormNum(5);
    } else if (formNum === 5) {
      setFormNum(6);
    } else if (formNum === 6) {
      setFormNum(7);
    }
  };

  // 다음 버튼 위치 조정
  useEffect(() => {
    const nextButton = document.getElementsByClassName("nextButton")[0];
    const inputboxes = document.getElementsByClassName("inputbox");
    const confirmButton0 = document.getElementsByClassName("confirmButton")[0];
    const confirmButton1 = document.getElementsByClassName("confirmButton")[1];

    if (formNum < 2) {
      inputboxes[0].appendChild(nextButton);
      confirmButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setProgress(1);
    } else if (formNum === 2) {
      inputboxes[1].appendChild(nextButton);
      confirmButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setProgress(2);
    } else if (formNum > 2 && formNum < 5) {
      confirmButton0.appendChild(nextButton);
      window.scrollTo({
        top: 180,
        behavior: "smooth",
      });
      setProgress(3);
    } else if (formNum > 5 && formNum < 7) {
      confirmButton1.appendChild(nextButton);
      window.scrollTo({
        top: 180,
        behavior: "smooth",
      });
      setProgress(3);
    }
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
                  : ""}
        </div>
      </div>

      <form className="form">
        <div ref={confirmButtonRef} className="nextButton" onClick={handleNext}>
          다음
        </div>
        <div className="name inputbox">
          <label className={`label ${formNum === 1 ? "activeLabel" : ""}`}>
            이름
          </label>
          <input
            ref={nameRef}
            name="name"
            placeholder="김만취"
            onFocus={() => handleFocus(1)}
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
          />
        </div>

        <div className="twoInputBox">
          <div
            className={`academicState inputbox ${formNum > 2 ? "visible" : "hidden"}`}
          >
            <label className={`label ${formNum === 4 ? "activeLabel" : ""}`}>
              학적상태
            </label>
            <div
              ref={academicStateRef}
              className="select"
              tabindex="0"
              name="academicState"
              onClick={() => handleFocus(3)}
            >
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
                  slidesPerView={3}
                  direction={"vertical"}
                  onSwiper={handleSwiper}
                  onRealIndexChange={handleSwipeMove}
                >
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide
                    className={`option ${optionIndex === 0 ? "selectedOption" : ""}`}
                    onClick={() => {
                      swiperInstance.slideTo(0);
                    }}
                  >
                    재학
                  </SwiperSlide>
                  <SwiperSlide
                    className={`option ${optionIndex === 1 ? "selectedOption" : ""}`}
                    onClick={() => {
                      swiperInstance.slideTo(1);
                    }}
                  >
                    휴학
                  </SwiperSlide>
                  <SwiperSlide
                    className={`option ${optionIndex === 2 ? "selectedOption" : ""}`}
                    onClick={() => {
                      swiperInstance.slideTo(2);
                    }}
                  >
                    졸업
                  </SwiperSlide>
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
              tabindex="0"
              name="grade"
              onClick={() => handleFocus(5)}
            >
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
                  slidesPerView={3}
                  direction={"vertical"}
                  onSwiper={handleSwiper1}
                  onRealIndexChange={handleSwipeMove1}
                >
                  <SwiperSlide className="option"></SwiperSlide>
                  <SwiperSlide
                    className={`option ${optionIndex === 0 ? "selectedOption" : ""}`}
                    onClick={() => {
                      swiperInstance1.slideTo(0);
                    }}
                  >
                    1
                  </SwiperSlide>
                  <SwiperSlide
                    className={`option ${optionIndex === 1 ? "selectedOption" : ""}`}
                    onClick={() => {
                      swiperInstance1.slideTo(1);
                    }}
                  >
                    2
                  </SwiperSlide>
                  <SwiperSlide
                    className={`option ${optionIndex === 2 ? "selectedOption" : ""}`}
                    onClick={() => {
                      swiperInstance1.slideTo(2);
                    }}
                  >
                    3
                  </SwiperSlide>
                  <SwiperSlide
                    className={`option ${optionIndex === 3 ? "selectedOption" : ""}`}
                    onClick={() => {
                      swiperInstance1.slideTo(3);
                    }}
                  >
                    4
                  </SwiperSlide>
                  <SwiperSlide
                    className={`option ${optionIndex === 4 ? "selectedOption" : ""}`}
                    onClick={() => {
                      swiperInstance1.slideTo(4);
                    }}
                  >
                    5
                  </SwiperSlide>
                  <SwiperSlide className="option"></SwiperSlide>
                </Swiper>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JoinForm;
