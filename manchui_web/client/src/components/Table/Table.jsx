import React, { useState } from "react";
import "./Table.css";
const Table = ({ columns, data }) => {
  const [selectOption, setSelectOption] = useState("auto");

  return (
    <div>
      <button onClick={() => setSelectOption("all")}>전체 선택</button>
      <button onClick={() => setSelectOption("auto")}>단일 선택</button>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.Header}</th>
            ))}
          </tr>
        </thead>
        <tbody style={{ userSelect: `${selectOption}` }}>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  <div className="tdCell">{row[column.accessor]}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
