import React, { useEffect, useRef, useState } from "react";
import "./JoinForm.css";
import { useNavigate } from "react-router-dom";
import { MdKeyboardArrowDown, MdLanguage } from "react-icons/md";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.css";
import Cup, { CUP_TYPES } from "../../components/Cup/Cup";

// 단과대·학과 계층 데이터 (한국어)
const COLLEGES_KO = [
  "경상대학",
  "공학대학",
  "첨단융합대학",
  "글로벌문화통상대학",
  "디자인대학",
  "소프트웨어융합대학",
  "약학대학",
  "커뮤니케이션&컬처대학",
  "예체능대학",
  "LIONS칼리지",
];
const COLLEGE_MAJORS_KO = [
  ["경영학부", "경제학부", "보험계리학과", "회계세무학과"],
  [
    "건설환경공학과",
    "건축학부",
    "교통물류공학과",
    "에너지바이오학과",
    "기계공학과",
    "로봇공학과",
    "산업경영공학과",
    "해양융합공학과",
    "스마트융합공학부",
    "전자공학부",
    "배터리소재화학공학과",
  ],
  ["차세대반도체융합공학부", "바이오신약융합학부", "국방지능정보융합공학부"],
  ["글로벌문화통상학부"],
  ["디자인계열"],
  ["컴퓨터학부", "ICT융합학부", "인공지능학과", "수리데이터사이언스학과"],
  ["약학과"],
  ["광고홍보학과", "미디어학과", "문화인류학과", "문화콘텐츠학과"],
  ["무용예술학과", "스포츠과학부", "실용음악학과"],
  ["전계열", "자연계열", "인문사회계열"],
];

// 단과대·학과 계층 데이터 (영어)
const COLLEGES_EN = [
  "Business & Economics",
  "Engineering",
  "Advanced Convergence",
  "Global Culture & Commerce",
  "Design",
  "Software Convergence",
  "Pharmacy",
  "Communication & Culture",
  "Arts & Sports",
  "LIONS College",
];
const COLLEGE_MAJORS_EN = [
  ["Business Admin", "Economics", "Actuarial Science", "Accounting & Tax"],
  [
    "Civil & Env. Eng.",
    "Architecture",
    "Transport & Logistics Eng.",
    "Energy & Biotechnology",
    "Mechanical Eng.",
    "Robotics Eng.",
    "Industrial Mgmt Eng.",
    "Ocean Convergence Eng.",
    "Smart Convergence Eng.",
    "Electronic Eng.",
    "Battery Materials & Chem. Eng.",
  ],
  [
    "Next-gen Semiconductor",
    "Bio-Drug Convergence",
    "Defense Intelligence Info.",
  ],
  ["Global Culture & Commerce"],
  ["Design"],
  ["Computer Science", "ICT Convergence", "AI", "Math Data Science"],
  ["Pharmacy"],
  ["Advertising & PR", "Media", "Cultural Anthropology", "Cultural Contents"],
  ["Dance Arts", "Sports Science", "Applied Music"],
  ["All Majors", "Natural Sciences", "Humanities & Social Sciences"],
];

const TRANSLATIONS = {
  ko: {
    promptName: "이름을 입력해주세요",
    promptStudentId: "학번을 입력해주세요",
    promptAcademicState: "학적상태를 선택해주세요",
    promptGrade: "학년을 선택해주세요",
    promptCollege: "단과대학을 선택해주세요",
    promptMajor: "전공을 선택해주세요",
    promptContact: "연락처를 입력해주세요",
    promptWish: "동아리에서 하고싶은 활동이 있다면?",
    promptConfirm: "정보를 확인하세요",
    labelName: "이름",
    labelStudentId: "학번",
    labelAcademicState: "학적상태",
    labelGrade: "학년",
    labelCollege: "단과대학",
    labelMajor: "전공",
    labelContact: "연락처",
    placeholderName: "김만취",
    next: "다음",
    academicStates: ["재학", "휴학", "졸업"],
    wishQuestion: "동아리에서 하고싶은 활동이 있다면?",
    wishPlaceholder: "하고 싶은 활동을 자유롭게 적어주세요",
    prev: "이전",
    confirm: "확인",
    colleges: COLLEGES_KO,
    collegeMajors: COLLEGE_MAJORS_KO,
    langLabel: "한국어",
  },
  en: {
    promptName: "Please enter your name",
    promptStudentId: "Please enter your student ID",
    promptAcademicState: "Select your academic status",
    promptGrade: "Select your grade",
    promptCollege: "Select your college",
    promptMajor: "Select your major",
    promptContact: "Please enter your contact",
    promptWish: "Any activities you want to do in the club?",
    promptConfirm: "Please check your information",
    labelName: "Name",
    labelStudentId: "Student ID",
    labelAcademicState: "Academic status",
    labelGrade: "Grade",
    labelCollege: "College",
    labelMajor: "Major",
    labelContact: "Contact",
    placeholderName: "e.g. John Smith",
    next: "Next",
    academicStates: ["Enrolled", "Leave of absence", "Graduated"],
    wishQuestion: "Any activities you want to do in the club?",
    wishPlaceholder: "Write any activities you'd like to do",
    prev: "Previous",
    confirm: "Confirm",
    colleges: COLLEGES_EN,
    collegeMajors: COLLEGE_MAJORS_EN,
    langLabel: "English",
  },
};

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

  const [lang, setLang] = useState("ko");
  const [majorList, setMajorList] = useState([]);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    academicState: TRANSLATIONS.ko.academicStates[0],
    college: COLLEGES_KO[0],
    major: COLLEGE_MAJORS_KO[0][0],
    grade: 1,
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
    const koStates = TRANSLATIONS.ko.academicStates;
    setFormData({
      ...formData,
      academicState: koStates[swiperInstance.realIndex] ?? koStates[0],
    });
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
      const idx = swiperInstance2.realIndex;
      setOptionIndex2(idx);
      const majors = COLLEGE_MAJORS_KO[idx];
      const firstMajor = majors && majors[0] ? majors[0] : "";
      setOptionIndex3(0);
      setFormData((prev) => ({
        ...prev,
        college: COLLEGES_KO[idx] ?? COLLEGES_KO[0],
        major: firstMajor,
      }));
    }
  };

  useEffect(() => {
    if (swiperInstance3) {
      swiperInstance3.slideTo(0, 0);
    }
  }, [optionIndex2]);

  const [swiperInstance3, setSwiperInstance3] = useState(null);
  const [optionIndex3, setOptionIndex3] = useState(0);
  const handleSwiper3 = (swiper) => {
    setSwiperInstance3(swiper);
  };
  const handleSwipeMove3 = (e) => {
    if (swiperInstance3) {
      const idx = swiperInstance3.realIndex;
      setOptionIndex3(idx);
      const majors = COLLEGE_MAJORS_KO[optionIndex2];
      setFormData((prev) => ({
        ...prev,
        major: (majors && majors[idx]) ?? (majors && majors[0]) ?? "",
      }));
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

  const t = TRANSLATIONS[lang];
  const toggleLang = () => setLang((prev) => (prev === "ko" ? "en" : "ko"));

  const handleNext = (e) => {
    e.preventDefault();
    if (formNum < 13) {
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
        top: 100,
        behavior: "smooth",
      });
      confirmButtonRef.current.focus();
    } else if (formNum === 13) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (formNum < 13) {
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

    const handleWheel = (e) => {
      if (formNum !== 4 && formNum !== 6 && formNum !== 8 && formNum !== 10)
        return;
      e.preventDefault();
      if (e.deltaY > 0) {
        if (formNum === 4 && swiperInstance) swiperInstance.slideNext();
        else if (formNum === 6 && swiperInstance1) swiperInstance1.slideNext();
        else if (formNum === 8 && swiperInstance2) swiperInstance2.slideNext();
        else if (formNum === 10 && swiperInstance3) swiperInstance3.slideNext();
      } else {
        if (formNum === 4 && swiperInstance) swiperInstance.slidePrev();
        else if (formNum === 6 && swiperInstance1) swiperInstance1.slidePrev();
        else if (formNum === 8 && swiperInstance2) swiperInstance2.slidePrev();
        else if (formNum === 10 && swiperInstance3) swiperInstance3.slidePrev();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("wheel", handleWheel);
    };
  }, [formNum]);

  const academicStateDisplay = (() => {
    const idx = TRANSLATIONS.ko.academicStates.indexOf(formData.academicState);
    return idx >= 0 ? t.academicStates[idx] : formData.academicState;
  })();

  const currentCollegeMajors = t.collegeMajors[optionIndex2] ?? [];
  const majorDisplay =
    currentCollegeMajors.length > 0
      ? currentCollegeMajors[
          Math.min(optionIndex3, currentCollegeMajors.length - 1)
        ]
      : formData.major;

  return (
    <div className="joinForm">
      <div className="stateBar">
        <button
          type="button"
          className="languageToggle"
          onClick={toggleLang}
          aria-label={lang === "ko" ? "Switch to English" : "한국어로 전환"}
        >
          <MdLanguage />
          <span>{t.langLabel}</span>
        </button>
        <div className="progressSection">
          <div className="progressBar">
            <div
              className="progressFill"
              style={{ width: `${Math.max(0, (progress - 1) * 25)}%` }}
            ></div>
            <div className="cups">
              {[1, 2, 5, 9, 11].map((num, index) => (
                <div
                  key={num}
                  className={`cup ${progress >= index + 1 ? "cupFilled" : ""}`}
                  onClick={() => setFormNum(num)}
                >
                  <Cup fill={progress >= index + 1} type={CUP_TYPES[index]} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="stateBarRow">
          <div className="text">
            {formNum === 1
              ? t.promptName
              : formNum === 2
                ? t.promptStudentId
                : formNum === 3 || formNum === 4
                  ? t.promptAcademicState
                  : formNum === 5 || formNum === 6
                    ? t.promptGrade
                    : formNum === 7 || formNum === 8
                      ? t.promptCollege
                      : formNum === 9 || formNum === 10
                        ? t.promptMajor
                        : formNum === 11
                          ? t.promptContact
                          : formNum === 13
                            ? t.promptWish
                            : t.promptConfirm}
          </div>
        </div>
      </div>

      <form className="form">
        <button
          ref={confirmButtonRef}
          className="nextButton"
          onClick={handleNext}
        >
          {t.next}
        </button>
        <div className="name inputbox">
          <label className={`label ${formNum === 1 ? "activeLabel" : ""}`}>
            {t.labelName}
          </label>
          <input
            ref={nameRef}
            name="name"
            placeholder={t.placeholderName}
            onFocus={() => handleFocus(1)}
            onChange={handleChange}
            value={formData.name}
          />
        </div>
        <div
          className={`studentId inputbox ${formNum > 1 ? "visible" : "hidden"}`}
        >
          <label className={`label ${formNum === 2 ? "activeLabel" : ""}`}>
            {t.labelStudentId}
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
              {t.labelAcademicState}
            </label>
            <div
              ref={academicStateRef}
              className="select"
              tabIndex="0"
              name="academicState"
              onClick={() => handleFocus(3)}
            >
              {academicStateDisplay}
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
                  {t.academicStates.map((label, index) => (
                    <SwiperSlide
                      key={label}
                      className={`option ${optionIndex === index ? "selectedOption" : ""}`}
                      onClick={() => {
                        swiperInstance.slideTo(index);
                      }}
                    >
                      {label}
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
              {t.labelGrade}
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
              {t.labelCollege}
            </label>
            <div
              ref={collegeRef}
              className="select"
              tabIndex="0"
              name="college"
              onClick={() => handleFocus(8)}
            >
              {t.colleges[optionIndex2]}
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
                  {t.colleges.map((college, index) => (
                    <SwiperSlide
                      key={college}
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
              {t.labelMajor}
            </label>
            <div
              ref={majorRef}
              className="select"
              tabIndex="0"
              name="major"
              onClick={() => handleFocus(10)}
            >
              {majorDisplay}
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
                  {currentCollegeMajors.map((major, index) => (
                    <SwiperSlide
                      key={major}
                      className={`option ${optionIndex3 === index ? "selectedOption" : ""}`}
                      onClick={() => {
                        swiperInstance3.slideTo(index);
                      }}
                    >
                      {major}
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
          className={`contact inputbox ${formNum > 9 ? "visible" : "hidden"}`}
          style={{ visibility: `${formNum > 9 ? "visible" : "hidden"}` }}
        >
          <label className={`label ${formNum === 11 ? "activeLabel" : ""}`}>
            {t.labelContact}
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

      {/* formNum 13: 동아리 활동 희망 팝업 */}
      {formNum === 13 && (
        <div
          className="wishPopupOverlay"
          onClick={(e) => {
            if (e.target.classList.contains("wishPopupOverlay")) {
              setFormNum(12);
            }
          }}
        >
          <div className="wishPopup">
            <p className="wishPopupQuestion">{t.wishQuestion}</p>
            <textarea
              name="wish"
              className="wishPopupInput"
              placeholder={t.wishPlaceholder}
              value={formData.wish}
              onChange={handleChange}
              rows={4}
            />
            <div className="wishPopupButtons">
              <button
                type="button"
                className="wishPopupCancel"
                onClick={() => setFormNum(12)}
              >
                {t.prev}
              </button>
              <button
                type="button"
                className="wishPopupConfirm"
                onClick={() => setFormNum(14)}
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinForm;
