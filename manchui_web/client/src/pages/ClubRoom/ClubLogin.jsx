import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { IoChevronBack, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import Cup, { CUP_TYPES } from "../../components/Cup/Cup";
import "./ClubLogin.css";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import {
  loginClubRoom,
  signupClubRoom,
  sendSignupEmailCode,
  verifySignupEmailCode,
  completeKakaoSignup,
  getKakaoLoginUrl,
  parseKakaoSignupToken,
  saveKakaoSignupSession,
  clearKakaoSignupSession,
  resolveKakaoSignupPayload,
  loadKakaoSignupSession,
} from "../../api/auth";
import { setAccessToken } from "../../api/tokenStorage";
import { useAuth } from "../../context/AuthContext";
import { safeInternalPath } from "../../utils/safeInternalPath";
import { resolveClubAllowedPath } from "../../config/clubFeatureFlags";
const LOGIN_STEP_COUNT = 2;
const SIGNUP_STEP_COUNT = 6;
const KAKAO_SIGNUP_STEP_COUNT = 2;

const LOGIN_HEADLINES = [
  "이메일을 입력해 주세요.",
  "비밀번호를 입력해 주세요.",
];

const SIGNUP_HEADLINES = [
  "이름을 입력해 주세요.",
  "아이디를 입력해 주세요.",
  "이메일을 입력해 주세요.",
  "이메일 인증번호를 입력해 주세요.",
  "비밀번호를 입력해 주세요.",
  "비밀번호를 한 번 더 입력해 주세요.",
];

const KAKAO_SIGNUP_HEADLINES = [
  "닉네임을 입력해 주세요.",
  "아이디를 입력해 주세요.",
];

function isValidEmail(s) {
  const t = (s || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function KakaoIcon() {
  return (
    <svg
      className="clubLoginForm__kakaoIcon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 3C7.03 3 3 6.36 3 10.35c0 2.55 1.68 4.79 4.21 6.06-.19.68-.69 2.47-.79 2.86-.12.47.17.46.36.33.15-.1 2.37-1.61 3.33-2.26.29.04.58.06.89.06 4.97 0 9-3.36 9-7.35S16.97 3 12 3z"
      />
    </svg>
  );
}

const ClubLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, user, sessionReady } = useAuth();
  const manchuiModal = useManchuiModal();

  const redirectTo = useMemo(() => {
    const p = safeInternalPath(searchParams.get("from"));
    if (p === "/club/login") return resolveClubAllowedPath("/club");
    return resolveClubAllowedPath(p);
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
  const [emailCode, setEmailCode] = useState("");
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [resendCooldownSec, setResendCooldownSec] = useState(0);
  const [isKakaoSignupMode, setIsKakaoSignupMode] = useState(false);
  const [kakaoSignupToken, setKakaoSignupToken] = useState("");
  const [kakaoEmail, setKakaoEmail] = useState("");
  const [kakaoSignupForm, setKakaoSignupForm] = useState({
    nickname: "",
    Identification: "",
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
  const suVerifyRef = useRef(null);
  const suPwRef = useRef(null);
  const suPw2Ref = useRef(null);

  const stepCount = isKakaoSignupMode
    ? KAKAO_SIGNUP_STEP_COUNT
    : isSignUpMode
      ? SIGNUP_STEP_COUNT
      : LOGIN_STEP_COUNT;
  const headline = isKakaoSignupMode
    ? KAKAO_SIGNUP_HEADLINES[formStep]
    : isSignUpMode
      ? SIGNUP_HEADLINES[formStep]
      : LOGIN_HEADLINES[formStep];

  const progressWidthPercent = useMemo(() => {
    if (stepCount <= 1) return 100;
    return (formStep / (stepCount - 1)) * 100;
  }, [formStep, stepCount]);

  const getSignUpEmailValue = useCallback(() => {
    return (suEmailRef.current?.value ?? signUpForm.email).trim();
  }, [signUpForm.email]);

  const getSignUpEmail = useCallback(
    () => getSignUpEmailValue().toLowerCase(),
    [getSignUpEmailValue],
  );

  const isCurrentEmailVerified = useCallback(() => {
    const current = getSignUpEmail();
    return Boolean(
      emailVerificationToken &&
        verifiedEmail &&
        current &&
        current === verifiedEmail,
    );
  }, [emailVerificationToken, verifiedEmail, getSignUpEmail]);

  useEffect(() => {
    if (resendCooldownSec <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldownSec((sec) => (sec > 0 ? sec - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldownSec]);

  useEffect(() => {
    if (!sessionReady || !user || isKakaoSignupMode) return;
    navigate(redirectTo, { replace: true });
  }, [sessionReady, user, navigate, redirectTo, isKakaoSignupMode]);

  useEffect(() => {
    const kakaoSignup = searchParams.get("kakaoSignup");
    const signupToken = searchParams.get("signupToken");
    const error = searchParams.get("error");

    if (error) {
      void manchuiModal(decodeURIComponent(error));
    }

    if (kakaoSignup === "1" && signupToken) {
      const payload = parseKakaoSignupToken(signupToken);
      if (payload?.purpose === "kakao_signup") {
        saveKakaoSignupSession({
          signupToken,
          email: payload.email || "",
          nickname: payload.nickname || "",
        });
        setIsKakaoSignupMode(true);
        setKakaoSignupToken(signupToken);
        setKakaoEmail(payload.email || "");
        setKakaoSignupForm({
          nickname: payload.nickname || "",
          Identification: "",
        });
        setFormStep(0);
      }
    } else {
      const stored = loadKakaoSignupSession();
      if (stored.signupToken) {
        const payload = parseKakaoSignupToken(stored.signupToken);
        if (payload?.purpose === "kakao_signup") {
          setIsKakaoSignupMode(true);
          setKakaoSignupToken(stored.signupToken);
          setKakaoEmail(stored.email || payload.email || "");
          setKakaoSignupForm({
            nickname: stored.nickname || payload.nickname || "",
            Identification: "",
          });
        }
      }
    }
  }, [searchParams, manchuiModal]);

  /* 자동완성이 이벤트 없이 늦게 들어오면 버튼 문구·state가 뒤처질 수 있어 짧게 동기화 */
  useEffect(() => {
    if (isSignUpMode || isKakaoSignupMode || formStep !== 0) return;
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
  }, [isSignUpMode, isKakaoSignupMode, formStep]);

  /* 회원가입 이메일: 자동완성이 state 없이 DOM만 채우는 경우 동기화 */
  useEffect(() => {
    if (!isSignUpMode || formStep !== 2) return undefined;
    let cancelled = false;
    let n = 0;
    const sync = () => {
      if (cancelled || n++ > 24) return;
      const emailEl = suEmailRef.current;
      setSignUpForm((prev) => {
        const email = emailEl ? emailEl.value : prev.email;
        if (email === prev.email) return prev;
        return { ...prev, email };
      });
      window.setTimeout(sync, 100);
    };
    sync();
    return () => {
      cancelled = true;
    };
  }, [isSignUpMode, formStep]);

  const getInputRefs = useCallback(() => {
    if (isKakaoSignupMode) {
      return [suNameRef, suIdRef];
    }
    if (!isSignUpMode) {
      return [loginEmailRef, loginPasswordRef];
    }
    return [suNameRef, suIdRef, suEmailRef, suVerifyRef, suPwRef, suPw2Ref];
  }, [isSignUpMode, isKakaoSignupMode]);

  /** 크롬 자동완성은 DOM에만 채우고 React state는 뒤늦게 갱신되는 경우가 있어 ref 우선 */
  const getLoginFieldValues = useCallback(() => {
    const email = (loginEmailRef.current?.value ?? loginForm.email).trim();
    const password = loginPasswordRef.current?.value ?? loginForm.password;
    return { email, password };
  }, [loginForm.email, loginForm.password]);

  const getKakaoFieldValues = useCallback(() => {
    const nickname = (suNameRef.current?.value ?? kakaoSignupForm.nickname).trim();
    const Identification = (
      suIdRef.current?.value ?? kakaoSignupForm.Identification
    ).trim();
    return { nickname, Identification };
  }, [kakaoSignupForm.nickname, kakaoSignupForm.Identification]);

  const blurActiveInput = () => {
    const ae = document.activeElement;
    if (ae && ae.tagName === "INPUT") {
      ae.blur();
    }
  };

  const validateCurrentStep = () => {
    setFieldError(null);
    setInlineError(null);
    if (isKakaoSignupMode) {
      if (formStep === 0) {
        const payload = resolveKakaoSignupPayload({
          signupTokenFromState: kakaoSignupToken,
          signupTokenFromUrl: searchParams.get("signupToken"),
          nicknameFromForm: getKakaoFieldValues().nickname,
          identificationFromForm: "",
        });
        if (!payload.nickname) {
          setFieldError("nickname");
          setInlineError("닉네임을 입력해 주세요.");
          suNameRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 1) {
        const { Identification } = getKakaoFieldValues();
        if (!Identification) {
          setFieldError("id");
          setInlineError("아이디를 입력해 주세요.");
          suIdRef.current?.focus();
          return false;
        }
        return true;
      }
      return true;
    }
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
        const email = getSignUpEmailValue();
        if (!isValidEmail(email)) {
          setFieldError("email");
          setInlineError("올바른 이메일 주소를 입력해 주세요.");
          suEmailRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 3) {
        if (isCurrentEmailVerified()) return true;
        if (!/^\d{6}$/.test((emailCode || "").trim())) {
          setFieldError("verify");
          setInlineError("6자리 인증번호를 입력해 주세요.");
          suVerifyRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 4) {
        if (!(signUpForm.password || "").trim()) {
          setFieldError("password");
          setInlineError("비밀번호를 입력해 주세요.");
          suPwRef.current?.focus();
          return false;
        }
        return true;
      }
      if (formStep === 5) {
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
      setAccessToken(data.accessToken || data.token);
      setUser(data.user);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      manchuiModal(error?.response?.data?.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const runKakaoSignup = async () => {
    try {
      setLoading(true);
      const fields = getKakaoFieldValues();
      const payload = resolveKakaoSignupPayload({
        signupTokenFromState: kakaoSignupToken,
        signupTokenFromUrl: searchParams.get("signupToken"),
        nicknameFromForm: fields.nickname,
        identificationFromForm: fields.Identification,
      });

      if (!payload.signupToken) {
        manchuiModal("카카오 가입 세션이 만료되었습니다. 다시 카카오 로그인을 시도해 주세요.");
        return;
      }
      if (!payload.nickname) {
        manchuiModal("닉네임을 입력해 주세요.");
        setFormStep(0);
        return;
      }
      if (!payload.Identification) {
        manchuiModal("아이디를 입력해 주세요.");
        setFormStep(1);
        return;
      }

      const data = await completeKakaoSignup({
        signupToken: payload.signupToken,
        nickname: payload.nickname,
        Identification: payload.Identification,
      });
      clearKakaoSignupSession();
      setAccessToken(data.accessToken || data.token);
      setUser(data.user);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      manchuiModal(
        error?.response?.data?.message || "카카오 회원가입에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const startKakaoLogin = () => {
    window.location.href = getKakaoLoginUrl(redirectTo);
  };

  const runSignup = async () => {
    if (!isCurrentEmailVerified()) {
      const emailChanged =
        verifiedEmail && getSignUpEmail() !== verifiedEmail;
      manchuiModal(
        emailChanged
          ? "이메일이 변경되었습니다. 인증번호를 다시 요청해 주세요."
          : "이메일 인증을 완료해 주세요.",
      );
      setFormStep(emailChanged ? 2 : 3);
      return;
    }
    try {
      setLoading(true);
      await signupClubRoom({
        username: signUpForm.username.trim(),
        Identification: signUpForm.Identification.trim(),
        email: getSignUpEmailValue(),
        password: signUpForm.password,
        emailVerificationToken,
      });
      manchuiModal("회원가입이 완료되었습니다. 로그인 해주세요.");
      setIsSignUpMode(false);
      setFormStep(0);
      setLoginForm((prev) => ({ ...prev, email: getSignUpEmailValue() }));
      setSignUpForm({
        username: "",
        Identification: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setEmailCode("");
      setEmailVerificationToken("");
      setVerifiedEmail("");
      setResendCooldownSec(0);
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
      if (isSignUpMode && formStep === 2) {
        blurActiveInput();
        if (isCurrentEmailVerified()) {
          setInlineError(null);
          setFormStep(4);
          return;
        }
        try {
          setLoading(true);
          const data = await sendSignupEmailCode(getSignUpEmailValue());
          setEmailVerificationToken("");
          setVerifiedEmail("");
          setEmailCode("");
          setResendCooldownSec(60);
          setInlineError(null);
          setFormStep(3);
          await manchuiModal(
            `${data?.sentTo || getSignUpEmailValue()}로 인증번호를 발송했습니다.\n받은편지함·스팸함을 확인해 주세요.`,
          );
        } catch (error) {
          setInlineError(
            error?.response?.data?.message || "인증번호 발송에 실패했습니다.",
          );
          if (error?.response?.status === 409) {
            setFieldError("email");
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      if (isSignUpMode && formStep === 3) {
        blurActiveInput();
        if (isCurrentEmailVerified()) {
          setInlineError(null);
          setFormStep(4);
          return;
        }
        try {
          setLoading(true);
          const data = await verifySignupEmailCode(
            getSignUpEmailValue(),
            emailCode.trim(),
          );
          setEmailVerificationToken(data.emailVerificationToken);
          setVerifiedEmail(getSignUpEmail());
          setInlineError(null);
          setFormStep(4);
        } catch (error) {
          setInlineError(
            error?.response?.data?.message || "인증번호 확인에 실패했습니다.",
          );
          setFieldError("verify");
        } finally {
          setLoading(false);
        }
        return;
      }

      // 로그인 1단계: 브라우저 자동완성으로 비밀번호까지 채워지면 바로 로그인
    if (
      !isSignUpMode &&
      !isKakaoSignupMode &&
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
      if (isKakaoSignupMode) {
        const fields = getKakaoFieldValues();
        setKakaoSignupForm((prev) => ({
          ...prev,
          nickname: fields.nickname || prev.nickname,
          Identification: fields.Identification || prev.Identification,
        }));
      }
      setFormStep((s) => s + 1);
      return;
    }

    if (!isSignUpMode && !isKakaoSignupMode) {
      await runLogin();
    } else if (isKakaoSignupMode) {
      await runKakaoSignup();
    } else {
      await runSignup();
    }
  };

  const toggleSignUpMode = () => {
    if (!isSignUpMode) {
      const loginEmail = (loginEmailRef.current?.value ?? loginForm.email).trim();
      if (loginEmail) {
        setSignUpForm((prev) =>
          prev.email ? prev : { ...prev, email: loginEmail },
        );
      }
    }
    setIsSignUpMode((p) => !p);
    setFormStep(0);
    setFieldError(null);
    setInlineError(null);
    setShowLoginPw(false);
    setShowSignUpPw(false);
    setShowSignUpPw2(false);
    setEmailCode("");
    setEmailVerificationToken("");
    setVerifiedEmail("");
    setResendCooldownSec(0);
  };

  const handleResendEmailCode = async () => {
    if (loading || resendCooldownSec > 0 || !isValidEmail(getSignUpEmailValue())) return;
    try {
      setLoading(true);
      const data = await sendSignupEmailCode(getSignUpEmailValue());
      setEmailVerificationToken("");
      setVerifiedEmail("");
      setEmailCode("");
      setResendCooldownSec(60);
      setInlineError(null);
      await manchuiModal("인증번호를 다시 발송했습니다.");
      suVerifyRef.current?.focus();
    } catch (error) {
      await manchuiModal(
        error?.response?.data?.message || "인증번호 재발송에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
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
    if (!isSignUpMode && !isKakaoSignupMode && boxes.length >= 2) {
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
  }, [formStep, isSignUpMode, isKakaoSignupMode, getInputRefs, loginForm.email, loginForm.password]);

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
    setFieldError(null);
    if (name === "email") {
      const nextEmail = value.trim().toLowerCase();
      if (verifiedEmail && nextEmail && nextEmail !== verifiedEmail) {
        setInlineError("이메일이 변경되었습니다. 인증번호를 다시 요청해 주세요.");
      } else {
        setInlineError(null);
      }
      setEmailVerificationToken("");
      setVerifiedEmail("");
      setEmailCode("");
    } else {
      setInlineError(null);
    }
    setSignUpForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailCodeChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setInlineError(null);
    setFieldError(null);
    setEmailCode(digits);
  };

  const handleKakaoSignupChange = (e) => {
    const { name, value } = e.target;
    setInlineError(null);
    setFieldError(null);
    if (name === "Identification") {
      setKakaoSignupForm({
        ...kakaoSignupForm,
        Identification: "@" + value.split("@").join(""),
      });
    } else {
      setKakaoSignupForm({ ...kakaoSignupForm, [name]: value });
    }
  };

  const nextButtonLabel = (() => {
    if (loading) return "처리 중…";
    if (isKakaoSignupMode) {
      if (formStep >= KAKAO_SIGNUP_STEP_COUNT - 1) return "가입 완료";
      return "다음";
    }
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
    if (!last) {
      if (isSignUpMode && formStep === 2) {
        return isCurrentEmailVerified() ? "다음" : "인증번호 발송";
      }
      if (isSignUpMode && formStep === 3) {
        return isCurrentEmailVerified() ? "다음" : "인증 확인";
      }
      return "다음";
    }
    return isSignUpMode ? "회원가입" : "로그인";
  })();

  const loginUiFields = !isSignUpMode && !isKakaoSignupMode ? getLoginFieldValues() : null;
  const loginEarlyPasswordRow = Boolean(
    loginUiFields &&
      formStep === 0 &&
      isValidEmail(loginUiFields.email) &&
      loginUiFields.password.trim(),
  );

  const inputboxClass = (index, errKey) => {
    let vis;
    if (!isSignUpMode && !isKakaoSignupMode && index === 1) {
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
      ((isSignUpMode || isKakaoSignupMode) && formStep > index) ||
      (!isSignUpMode && !isKakaoSignupMode && formStep === 1 && index === 0);
    return canNavBack ? "clubLoginForm__inputbox--navBack" : "";
  };

  const inputboxNavClick = (index) => (e) => {
    if (e.target.closest(".clubLoginForm__pwToggle")) return;
    if (isSignUpMode || isKakaoSignupMode) {
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
                      if (
                        isSignUpMode &&
                        i >= 4 &&
                        !isCurrentEmailVerified()
                      ) {
                        goToFormStep(3);
                        return;
                      }
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
            aria-label={
              isKakaoSignupMode
                ? "카카오 회원가입 화면"
                : isSignUpMode
                  ? "회원가입 화면"
                  : "로그인 화면"
            }
          >
            {isKakaoSignupMode
              ? "카카오 가입"
              : isSignUpMode
                ? "회원가입"
                : "로그인"}
          </p>
          <div className="clubLoginForm__headline">
            {isSignUpMode && formStep === 3 && isCurrentEmailVerified()
              ? "이메일 인증이 완료되었습니다."
              : headline}
          </div>
          {inlineError ? (
            <div className="clubLoginForm__fieldError">{inlineError}</div>
          ) : null}
          <p className="clubLoginForm__prompt">
            {isKakaoSignupMode
              ? "한 항목씩 입력하면 다음으로 넘어갑니다."
              : isSignUpMode
                ? "한 항목씩 입력하면 다음으로 넘어갑니다."
                : "이메일과 비밀번호를 차례로 입력해 주세요."}
          </p>
          {isKakaoSignupMode && kakaoEmail ? (
            <p className="clubLoginForm__kakaoEmail">카카오 이메일: {kakaoEmail}</p>
          ) : null}
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
          {isSignUpMode && formStep === 3 && !isCurrentEmailVerified() ? (
            <button
              type="button"
              className="clubLoginForm__resendButton"
              onClick={() => void handleResendEmailCode()}
              disabled={loading || resendCooldownSec > 0}
            >
              {resendCooldownSec > 0
                ? `인증번호 재발송 (${resendCooldownSec}초)`
                : "인증번호 재발송"}
            </button>
          ) : null}
          {!isKakaoSignupMode ? (
            <div className="clubLoginForm__socialBlock">
              <div className="clubLoginForm__divider" aria-hidden="true">
                <span>또는</span>
              </div>
              <button
                type="button"
                className="clubLoginForm__kakaoButton"
                onClick={startKakaoLogin}
                disabled={loading}
              >
                <KakaoIcon />
                <span>
                  {isSignUpMode ? "카카오로 회원가입" : "카카오로 로그인"}
                </span>
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="clubLoginForm__modeSwitch"
            onClick={toggleSignUpMode}
            hidden={isKakaoSignupMode}
          >
            {isSignUpMode
              ? "이미 계정이 있나요? 로그인"
              : "계정이 없나요? 회원가입"}
          </button>
        </div>

        {isKakaoSignupMode ? (
          <>
            <div
              className={`${inputboxClass(0, "nickname")} ${inputboxNavClass(0)}`.trim()}
              onClick={inputboxNavClick(0)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 0 ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-kakao-nickname"
              >
                닉네임
              </label>
              <input
                id="club-kakao-nickname"
                ref={suNameRef}
                className="clubLoginForm__input"
                name="nickname"
                value={kakaoSignupForm.nickname}
                onChange={handleKakaoSignupChange}
                autoComplete="nickname"
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
                htmlFor="club-kakao-id"
              >
                아이디
              </label>
              <input
                id="club-kakao-id"
                ref={suIdRef}
                className="clubLoginForm__input"
                name="Identification"
                value={kakaoSignupForm.Identification}
                onChange={handleKakaoSignupChange}
                autoComplete="username"
                required
                disabled={formStep !== 1}
              />
            </div>
          </>
        ) : !isSignUpMode ? (
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
                onInput={handleSignUpChange}
                autoComplete="email"
                required
                disabled={formStep < 2}
                readOnly={formStep > 2}
                onFocus={() => {
                  if (formStep !== 2) goToFormStep(2);
                }}
              />
            </div>
            <div
              className={`${inputboxClass(3, "verify")} ${inputboxNavClass(3)} ${isCurrentEmailVerified() ? "clubLoginForm__inputbox--verified" : ""}`.trim()}
              onClick={inputboxNavClick(3)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 3 ? "clubLoginForm__label--active" : ""}`}
                htmlFor="club-su-verify"
              >
                인증번호
              </label>
              {isCurrentEmailVerified() ? (
                <div
                  className="clubLoginForm__verifyDone"
                  aria-live="polite"
                >
                  <span className="clubLoginForm__verifyDoneBadge">인증 완료</span>
                </div>
              ) : (
                <>
                  <input
                    id="club-su-verify"
                    ref={suVerifyRef}
                    className="clubLoginForm__input clubLoginForm__input--verify"
                    type="text"
                    inputMode="numeric"
                    name="emailCode"
                    value={emailCode}
                    onChange={handleEmailCodeChange}
                    autoComplete="one-time-code"
                    placeholder="6자리 숫자"
                    maxLength={6}
                    required
                    disabled={formStep !== 3}
                  />
                </>
              )}
            </div>
            <div
              className={`${inputboxClass(4, "password")} ${inputboxNavClass(4)}`.trim()}
              onClick={inputboxNavClick(4)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 4 ? "clubLoginForm__label--active" : ""}`}
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
                  disabled={formStep !== 4}
                />
                <button
                  type="button"
                  className="clubLoginForm__pwToggle"
                  disabled={formStep !== 4}
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
              className={`${inputboxClass(5, "confirm")} ${inputboxNavClass(5)}`.trim()}
              onClick={inputboxNavClick(5)}
            >
              <label
                className={`clubLoginForm__label ${formStep === 5 ? "clubLoginForm__label--active" : ""}`}
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
                  disabled={formStep !== 5}
                />
                <button
                  type="button"
                  className="clubLoginForm__pwToggle"
                  disabled={formStep !== 5}
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
