import React from "react";
import customTheme from "./theme.js";
import { VictoryPie } from "victory";

const CustomPieChart = ({ data }) => {
  return (
    <div className="pieChart">
      <VictoryPie
        innerRadius={80}
        labels={[]}
        padAngle={0}
        data={data}
        theme={customTheme}
      />
    </div>
  );
};

export default CustomPieChart;
