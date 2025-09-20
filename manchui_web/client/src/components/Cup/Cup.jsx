import React, { useRef, useEffect } from "react";
import "./Cup.css";
const Cup = ({ fill }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.imageSmoothingEnabled = false;
    ctx.strokeStyle = "#f5f5f570"; // 테두리 색상
    ctx.lineWidth = 2; // 테두리 두께

    if (fill) {
      ctx.beginPath();
      ctx.lineTo(14, 4);
      ctx.lineTo(12, 19);
      ctx.lineTo(3, 19);
      ctx.lineTo(1, 4);
      ctx.closePath();
      ctx.fillStyle = "#751a0fc4";
      ctx.fill();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(13, 20);
    ctx.lineTo(2, 20);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.stroke();
  }, [fill]);

  return (
    <div>
      <canvas ref={canvasRef} width={15} height={20} />
    </div>
  );
};

export default Cup;
