import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./ManchuiModal.module.css";
const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [state, setState] = useState({
    isOpen: false,
    type: "",
    message: "",
    resolve: null,
  });
  const modal = useCallback((message, type) => {
    setState({
      isOpen: true,
      type,
      message,
    });
    // 사용자가 버튼을 누를 때까지 기다리는 Promise 반환
    return new Promise((resolve) => {
      setState((prev) => ({ ...prev, resolve }));
    });
  }, []);

  const handleClose = (result) => {
    state.resolve?.(result); // Promise 종료 (true 또는 false 반환)
    setState({ isOpen: false, message: "", resolve: null });
  };

  return (
    <ModalContext.Provider value={modal}>
      {children}
      {state.isOpen &&
        createPortal(
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <p className={styles.message}>{state.message}</p>

              {state.type === "confirm" ? (
                <div className={styles.buttonGroup}>
                  <button
                    className={`${styles.button} ${styles.cancelBtn}`}
                    onClick={() => handleClose(false)}
                  >
                    취소
                  </button>
                  <button
                    className={`${styles.button} ${styles.confirmBtn}`}
                    onClick={() => handleClose(true)}
                    autoFocus
                  >
                    확인
                  </button>
                </div>
              ) : (
                <div className={styles.buttonGroup}>
                  <button
                    className={`${styles.button} ${styles.checkBtn}`}
                    onClick={() => handleClose(false)}
                    autoFocus
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </ModalContext.Provider>
  );
};

export const useManchuiModal = () => {
  const modal = useContext(ModalContext);
  if (!modal) {
    throw new Error("에러");
  }
  return modal;
};
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};
const modalStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  minWidth: "300px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

//사용법
/**
 * 
 *
 *import { useManchuiModal } from "../../hooks/ManchuiModal";

   const modal = useManchuiModal();

   const handelCheck = async () => {
     const isConfirmed = await modal("테스트", "confirm");
     if (isConfirmed) {
       alert("삭제되었습니다.");
     } else {
     }
   };
 
 */
