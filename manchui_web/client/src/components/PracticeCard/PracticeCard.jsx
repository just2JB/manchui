import React from "react";
import "./PracticeCard.css";

const PracticeCard = ({ practice }) => {
  return (
    <div className="card">
      <h4>{practice.name}</h4>
      <div className="info">
        <ul>
          <li>{practice.date}</li>
          <li>
            {practice.startTime}~{practice.endTime}
          </li>
          <li>{practice.place}</li>
        </ul>
      </div>
    </div>
  );
};

export default PracticeCard;
