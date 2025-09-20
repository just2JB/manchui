import React from "react";
import CircularText from "../CircularText/CircularText";
import "./Loading.css";

const Loading = () => {
  return (
    <div className="loading">
      <CircularText
        text="M A N C H U I  M A N C H U I  M A N C H U I  "
        onHover="speedUp"
        spinDuration={7}
        className="custom-class"
      />
      <div className="text">Manchuing..</div>
    </div>
  );
};

export default Loading;
