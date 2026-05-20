import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { IoChevronBack, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import Cup, { CUP_TYPES } from "../../components/Cup/Cup";
import "./ClubLogin.css";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { loginClubRoom, signupClubRoom } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { safeInternalPath } from "../../utils/safeInternalPath";

const LOGIN_STEP_COUNT = 2;
const SIGNUP_STEP_COUNT = 5;

const LOGIN_HEADLINES = [
  "이메일을 입력해 주세요.",
  "비밀번호를 입력해 주세요.",
];

const SIGNUP_HEADLINES = [
  "이름을 입력해 주세요.",
  "아이디를 입력해 주세요.",
  "이메일을 입력해 주세요.",
  "비밀번호를 입력해 주세요.",
  "비밀번호를 한 번 더 입력해 주세요.",
];

function isValidEmail(s) {
  const t = (s || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

const ClubLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, user, sessionReady } = useAuth();
  const manchuiModal = useManchuiModal();

  const redirectTo = useMemo(() => {
    const p = safeInternalPath(searchParams.get("from"));
    if (p === "/club/login") return "/club";
    return p;
  }, [searchParams]);

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const [inlineError, setInlineError] = useState(null);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [showSignUpPw2, setShowSignUpPw2] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [signUpForm, setSignUpForm] = useState({
    username: "",
    Identification: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const formRef = useRef(null);
  const nextBlockRef = useRef(null);
  const nextButtonRef = useRef(null);
  const wizardNavKeyRef = useRef(null);
  const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);
  const suNameRef = useRef(null);
  const suIdRef = useRef(null);
  const suEmailRef = useRef(null);
  const suPwRef = useRef(null);
  const suPw2Ref = useRef(null);

  const stepCount = isSignUpMode ? SIGNUP_STEP_COUNT : LOGIN_STEP_COUNT;
  const headline = isSignUpMode
    ? SIGNUP_HEADLINES[formStep]
    : LOGIN_HEADLINES[formStep];

  const progressWidthPercent = useMemo(() => {
    if (stepCount <= 1) return 100;
    return (formStep / (stepCount - 1)) * 100;
  }, [formStep, stepCount]);

  useEffect(() => {
    if (!sessionReady || !user) return;
    navigate(redirectTo, { replace: true });
  }, [sessionReady, user, navigate, redirectTo]);

  /* 자동완성이 이벤트 없이 늦게 들어오면 버튼 문구·state가 뒤처질 수 있어 짧게 동기화 */
  useEffect(() => {
    if (isSignUpMode || formStep !== 0) return;
    let cancelled = false;
    let n = 0;
    const sync = () => {
      if (cancelled || n++ > 24) return;
      const emailEl = loginEmailRef.current;
      const pwEl = loginPasswordRef.current;
      setLoginForm((prev) => {
        const email = emailEl ? emailEl.value : prev.email;
        const password = pwEl ? pwEl.value : prev.password;
        if (email === prev.email && password === prev.password) return prev;
        return { email, password };
      });
      window.setTimeout(sync, 100);
    };
    sync();
    return () => {
      cancelled = true;
    };
  }, [isSignUpMode, formStep]);

  const getInputRefs = useCallback(() => {
    if (!isSignUpMode) {
      return [loginEmailRef, loginPasswordRef];
    }
    return [suNameRef, suIdRef, suEmailRef, suPwRef, suPw2Ref];
  }, [isSignUpMode]);

  /** 크롬 자동완성은 DOM에만 채우고 React state는 뒤늦게 갱신되는 경우가 있어 ref 우선 */
  const getLoginFieldValues = useCallback(() => {
    const email = (loginEmailRef.current?.value ?? loginForm.email).trim();
    const password = loginPasswordRef.current?.value ?? loginForm.password;
    return { email, password };
  }, [loginForm.email, loginForm.password]);

  const blurActiveInput = () => {
    const ae = document.activeElement;
    if (ae && ae.tagName === "INPUT") {
      ae.blur();
    }
  };

  const validateCurrentStep = () => {
    setFieldError(null);
    setInlineError(null);
    if (!isSignUpMode) {
      const { email, password } = getLoginFieldValues();
      if (formStep === 0) {
        if (!isValidEmail(email)) {
          setFieldError("email");
          setInlineError("올바른 이메일 주소를 입력해 주세요.");
          loginEmailRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 1) {
        if (!(password || "").trim()) {
          setFieldError("password");
          setInlineError("비밀번호를 입력해 주세요.");
          loginPasswordRef.current?.focus();
          return false;
        }
        return true;
      }
    } else {
      if (formStep === 0) {
        if (!(signUpForm.username || "").trim()) {
          setFieldError("username");
          setInlineError("이름을 입력해 주세요.");
          suNameRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 1) {
        if (!(signUpForm.Identification || "").trim()) {
          setFieldError("id");
          setInlineError("아이디를 입력해 주세요.");
          suIdRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 2) {
        if (!isValidEmail(signUpForm.email)) {
          setFieldError("email");
          setInlineError("올바른 이메일 주소를 입력해 주세요.");
          suEmailRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 3) {
        if (!(signUpForm.password || "").trim()) {
          setFieldError("password");
          setInlineError("비밀번호를 입력해 주세요.");
          suPwRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 4) {
        if (signUpForm.password !== signUpForm.confirmPassword) {
          setFieldError("confirm");
          setInlineError("비밀번호 확인이 일치하지 않습니다.");
          suPw2Ref.current?.focus();
          return false;
        }
        return true;
      }
    }
    return true;
  };

  const runLogin = async () => {
    try {
      setLoading(true);
      const { email, password } = getLoginFieldValues();
      const data = await loginClubRoom({ email, password });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      manchuiModal(error?.response?.data?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const runSignup = async () => {
    try {
      setLoading(true);
      await signupClubRoom({
        username: signUpForm.username.trim(),
        Identification: signUpForm.Identification.trim(),
        email: signUpForm.email.trim(),
        password: signUpForm.password,
      });
      manchuiModal("회원가입이 완료되었습니다. 로그인 해주세요.");
      setIsSignUpMode(false);
      setFormStep(0);
      setLoginForm((prev) => ({ ...prev, email: signUpForm.email.trim() }));
      setSignUpForm({
        username: "",
        Identification: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      manchuiModal(
        error?.response?.data?.message || "회원가입에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    if (!validateCurrentStep()) return;

    const lastIndex = stepCount - 1;
    if (formStep < lastIndex) {
      // 로그인 1단계: 브라우저 자동완성으로 비밀번호까지 채워지면 바로 로그인
      if (
        !isSignUpMode &&
        formStep === 0 &&
        getLoginFieldValues().password.trim()
      ) {
        blurActiveInput();
        setInlineError(null);
        await runLogin();
        return;
      }
      blurActiveInput();
      setInlineError(null);
      setFormStep((s) => s + 1);
      return;
    }

    if (!isSignUpMode) {
      await runLogin();
    } else {
      await runSignup();
    }
  };

  const toggleSignUpMode = () => {
    setIsSignUpMode((p) => !p);
    setFormStep(0);
    setFieldError(null);
    setInlineError(null);
    setShowLoginPw(false);
    setShowSignUpPw(false);
    setShowSignUpPw2(false);
  };

  const goToFormStep = useCallback((step) => {
    setFormStep(step);
    setFieldError(null);
    setInlineError(null);
  }, []);

  useEffect(() => {
    const form = formRef.current;
    const block = nextBlockRef.current;
    if (!form || !block) return;
    const boxes = form.querySelectorAll(".clubLoginForm__inputbox");
    let idx = Math.min(formStep, Math.max(0, boxes.length - 1));
    /* 로그인 1단계+자동완성: 이메일 → 비밀번호 → 버튼 순으로 보이게 버튼 블록을 비밀번호 칸 아래로 */
    if (!isSignUpMode && boxes.length >= 2) {
      const email = (loginEmailRef.current?.value ?? loginForm.email).trim();
      const password =
        loginPasswordRef.current?.value ?? loginForm.password;
      if (formStep === 0 && isValidEmail(email) && password.trim()) {
        idx = 1;
      }
    }
    if (boxes[idx]) {
      boxes[idx].appendChild(block);
    }
    const refs = getInputRefs();
    const navKey = `${isSignUpMode}:${formStep}`;
    const navChanged = wizardNavKeyRef.current !== navKey;
    wizardNavKeyRef.current = navKey;
    requestAnimationFrame(() => {
      if (navChanged) {
        refs[formStep]?.current?.focus();
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [formStep, isSignUpMode, getInputRefs, loginForm.email, loginForm.password]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Backspace") return;
      if (e.key === "Enter") {
        if (e.isComposing) return;
        e.preventDefault();
        nextButtonRef.current?.click();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (formStep > 0) {
          setFormStep((s) => s - 1);
          setFieldError(null);
          setInlineError(null);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [formStep]);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setInlineError(null);
    setFieldError(null);
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setInlineError(null);
    setFieldError(null);
    setSignUpForm((prev) => ({ ...prev, [name]: value }));
  };

  const nextButtonLabel = (() => {
    if (loading) return "처리 중…";
    const { email: loginEmailNow, password: loginPwNow } =
      !isSignUpMode && formStep === 0 ? getLoginFieldValues() : { email: "", password: "" };
    if (
      !isSignUpMode &&
      formStep === 0 &&
      isValidEmail(loginEmailNow) &&
      loginPwNow.trim()
    ) {
      return "로그인";
    }
    const last = formStep >= stepCount - 1;
    if (!last) return "다음";
    return isSignUpMode ? "회원가입" : "로그인";
  })();

  const loginUiFields = !isSignUpMode ? getLoginFieldValues() : null;
  const loginEarlyPasswordRow = Boolean(
    loginUiFields &&
      formStep === 0 &&
      isValidEmail(loginUiFields.email) &&
      loginUiFields.password.trim(),
  );

  const inputboxClass = (index, errKey) => {
    let vis;
    if (!isSignUpMode && index === 1) {
      vis = formStep > 0 || loginEarlyPasswordRow ? "visible" : "hidden";
    } else {
      vis = formStep > index - 1 ? "visible" : "hidden";
    }
    const shake =
      fieldError === errKey ? "clubLoginForm__inputbox--shake" : "";
    const first = index === 0 ? "clubLoginForm__inputbox--first" : "";
    return `clubLoginForm__inputbox ${first} ${vis} ${shake}`.trim();
  };

  const inputboxNavClass = (index) => {
    const canNavBack =
      (isSignUpMode && formStep > index) ||
      (!isSignUpMode && formStep === 1 && index === 0);
    return canNavBack ? "clubLoginForm__inputbox--navBack" : "";
  };

  const inputboxNavClick = (index) => (e) => {
    if (e.target.closest(".clubLoginForm__pwToggle")) return;
    if (isSignUpMode) {
      if (formStep > index) goToFormStep(index);
      return;
    }
    if (formStep === 1 && index === 0) goToFormStep(0);
  };

  if (!sessionReady) {
    return (
      <div className="clubLoginForm clubLoginForm--loading" aria-busy="true">
        <p className="clubLoginForm__loadingText">확인 중…</p>
      </div>
    );
  }

  return (
    <div className="clubLoginForm">
      <div className="clubLoginForm__stateBar">
        <Link
          to="/"
          className="clubLoginForm__topLink"
          aria-label="홈페이지로"
        >
          <IoChevronBack className="clubLoginForm__topLinkIcon" aria-hidden />
          <span>홈</span>
        </Link>
        <div className="clubLoginForm__progressSection">
          <div className="clubLoginForm__progressBar">
            <div
              className="clubLoginForm__progressFill"
              style={{ width: `${progressWidthPercent}%` }}
            />
            {isSignUpMode ? (
              <div className="clubLoginForm__cups">
                {Array.from({ length: stepCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`clubLoginForm__cup ${formStep >= i ? "clubLoginForm__cup--filled" : ""}`}
                    onClick={() => {
                      goToFormStep(i);
                    }}
                    aria-label={`${i + 1}단계로 이동`}
                  >
                    <Cup
                      fill={formStep >= i}
                      type={CUP_TYPES[i % CUP_TYPES.length]}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="clubLoginForm__stateBarRow">
          <p
            className="clubLoginForm__windowTag"
            aria-label={isSignUpMode ? "회원가입 화면" : "로그인 화면"}
          >
            {isSignUpMode ? "회원가입" : "로그인"}
          </p>
          <div className="clubLoginForm__headline">{headline}</div>
          {inlineError ? (
            <div className="clubLoginForm__fieldError">{inlineError}</div>
          ) : null}
          <p className="clubLoginForm__prompt">
            {isSignUpMode
              ? "한 항목씩 입력하면 다음으로 넘어갑니다."
              : "이메일과 비밀번호를 차례로 입력해 주세요."}
          </p>
        </div>
      </div>

      <form
        ref={formRef}
        className="clubLoginForm__form"
        onSubmit={(e) => {
          e.preventDefault();
          handleNext(e);
        }}
      >
        <div ref={nextBlockRef} className="clubLoginForm__nextBlock">
          <button
            ref={nextButtonRef}
            type="button"
            className="clubLoginForm__nextButton"
            onClick={handleNext}
            disabled={loading}
          >
            {nextButtonLabel}
          </button>
          <button
            type="button"
            className="clubLoginForm__modeSwitch"
            onClick={toggleSignUpMode}
          >
            {isSignUpMode
              ? "이미 계정이 있나요? 로그인"
              : "계정이 없나요? 회원가입"}
          </button>
        </div>

        {!isSignUpMode ? (
          <>
            <div
              className={`${inputboxClass(0, "email")} ${inputboxNavClass(0)}`.trim()}
              onClick={inputboxNavClick(0)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 0 ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-login-email"
              >
                이메일
              </label>
              <input
                id="club-login-email"
                ref={loginEmailRef}
                className="clubLoginForm__input"
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                onInput={handleLoginChange}
                autoComplete="email"
                required
                disabled={formStep !== 0}
              />
            </div>
            <div
              className={`${inputboxClass(1, "password")} ${inputboxNavClass(1)}`.trim()}
              onClick={inputboxNavClick(1)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 1 || loginEarlyPasswordRow ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-login-password"
              >
                비밀번호
              </label>
              <div className="clubLoginForm__pwRow">
                <input
                  id="club-login-password"
                  ref={loginPasswordRef}
                  className="clubLoginForm__input clubLoginForm__input--inPwRow"
                  type={showLoginPw ? "text" : "password"}
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  onInput={handleLoginChange}
                  autoComplete="current-password"
                  required
                  tabIndex={formStep === 1 || loginEarlyPasswordRow ? 0 : -1}
                />
                <button
                  type="button"
                  className="clubLoginForm__pwToggle"
                  tabIndex={formStep === 1 || loginEarlyPasswordRow ? 0 : -1}
                  aria-label={showLoginPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                  aria-pressed={showLoginPw}
                  onClick={() => setShowLoginPw((v) => !v)}
                >
                  {showLoginPw ? (
                    <IoEyeOffOutline size={22} aria-hidden />
                  ) : (
                    <IoEyeOutline size={22} aria-hidden />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className={`${inputboxClass(0, "username")} ${inputboxNavClass(0)}`.trim()}
              onClick={inputboxNavClick(0)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 0 ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-su-name"
              >
                이름
              </label>
              <input
                id="club-su-name"
                ref={suNameRef}
                className="clubLoginForm__input"
                name="username"
                value={signUpForm.username}
                onChange={handleSignUpChange}
                autoComplete="name"
                required
                disabled={formStep !== 0}
              />
            </div>
            <div
              className={`${inputboxClass(1, "id")} ${inputboxNavClass(1)}`.trim()}
              onClick={inputboxNavClick(1)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 1 ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-su-id"
              >
                아이디
              </label>
              <input
                id="club-su-id"
                ref={suIdRef}
                className="clubLoginForm__input"
                name="Identification"
                value={signUpForm.Identification}
                onChange={handleSignUpChange}
                autoComplete="username"
                required
                disabled={formStep !== 1}
              />
            </div>
            <div
              className={`${inputboxClass(2, "email")} ${inputboxNavClass(2)}`.trim()}
              onClick={inputboxNavClick(2)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 2 ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-su-email"
              >
                이메일
              </label>
              <input
                id="club-su-email"
                ref={suEmailRef}
                className="clubLoginForm__input"
                type="email"
                name="email"
                value={signUpForm.email}
                onChange={handleSignUpChange}
                autoComplete="email"
                required
                disabled={formStep !== 2}
              />
            </div>
            <div
              className={`${inputboxClass(3, "password")} ${inputboxNavClass(3)}`.trim()}
              onClick={inputboxNavClick(3)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 3 ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-su-pw"
              >
                비밀번호
              </label>
              <div className="clubLoginForm__pwRow">
                <input
                  id="club-su-pw"
                  ref={suPwRef}
                  className="clubLoginForm__input clubLoginForm__input--inPwRow"
                  type={showSignUpPw ? "text" : "password"}
                  name="password"
                  value={signUpForm.password}
                  onChange={handleSignUpChange}
                  autoComplete="new-password"
                  required
                  disabled={formStep !== 3}
                />
                <button
                  type="button"
                  className="clubLoginForm__pwToggle"
                  disabled={formStep !== 3}
                  aria-label={showSignUpPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                  aria-pressed={showSignUpPw}
                  onClick={() => setShowSignUpPw((v) => !v)}
                >
                  {showSignUpPw ? (
                    <IoEyeOffOutline size={22} aria-hidden />
                  ) : (
                    <IoEyeOutline size={22} aria-hidden />
                  )}
                </button>
              </div>
            </div>
            <div
              className={`${inputboxClass(4, "confirm")} ${inputboxNavClass(4)}`.trim()}
              onClick={inputboxNavClick(4)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 4 ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-su-pw2"
              >
                비밀번호 확인
              </label>
              <div className="clubLoginForm__pwRow">
                <input
                  id="club-su-pw2"
                  ref={suPw2Ref}
                  className="clubLoginForm__input clubLoginForm__input--inPwRow"
                  type={showSignUpPw2 ? "text" : "password"}
                  name="confirmPassword"
                  value={signUpForm.confirmPassword}
                  onChange={handleSignUpChange}
                  autoComplete="new-password"
                  required
                  disabled={formStep !== 4}
                />
                <button
                  type="button"
                  className="clubLoginForm__pwToggle"
                  disabled={formStep !== 4}
                  aria-label={showSignUpPw2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                  aria-pressed={showSignUpPw2}
                  onClick={() => setShowSignUpPw2((v) => !v)}
                >
                  {showSignUpPw2 ? (
                    <IoEyeOffOutline size={22} aria-hidden />
                  ) : (
                    <IoEyeOutline size={22} aria-hidden />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default ClubLogin;
