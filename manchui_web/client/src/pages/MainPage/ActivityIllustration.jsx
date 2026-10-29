const Figure = ({ x, y, pose = "open", scale = 1 }) => {
  const arms = pose === "up"
    ? `M ${x - 4 * scale} ${y + 11 * scale} L ${x - 12 * scale} ${y + 1 * scale} M ${x + 4 * scale} ${y + 11 * scale} L ${x + 12 * scale} ${y + 1 * scale}`
    : pose === "step"
      ? `M ${x - 3 * scale} ${y + 12 * scale} L ${x - 13 * scale} ${y + 17 * scale} M ${x + 3 * scale} ${y + 12 * scale} L ${x + 12 * scale} ${y + 6 * scale}`
      : `M ${x - 4 * scale} ${y + 11 * scale} L ${x - 14 * scale} ${y + 10 * scale} M ${x + 4 * scale} ${y + 11 * scale} L ${x + 14 * scale} ${y + 10 * scale}`;

  return (
    <g className="activity-art__figure">
      <circle cx={x} cy={y} r={5 * scale} />
      <path d={`M ${x} ${y + 6 * scale} L ${x} ${y + 28 * scale}`} />
      <path d={arms} />
      <path d={`M ${x} ${y + 28 * scale} L ${x - 10 * scale} ${y + 43 * scale} M ${x} ${y + 28 * scale} L ${x + 12 * scale} ${y + 41 * scale}`} />
    </g>
  );
};

const ActivityIllustration = ({ type }) => (
  <div className={`activity-art activity-art--${type}`} aria-hidden="true">
    <svg viewBox="0 0 640 320" role="presentation">
      <defs>
        <linearGradient id={`activity-glow-${type}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3434" stopOpacity=".92" />
          <stop offset="1" stopColor="#790000" stopOpacity=".45" />
        </linearGradient>
      </defs>
      <rect className="activity-art__frame" x="1" y="1" width="638" height="318" rx="22" />
      <circle className="activity-art__orb" cx="520" cy="50" r="92" />
      <path className="activity-art__floor" d="M 52 264 C 190 244, 394 286, 588 252" />

      {type === "challenge" ? (
        <>
          <rect className="activity-art__device" x="92" y="48" width="164" height="224" rx="22" />
          <circle className="activity-art__device-dot" cx="174" cy="61" r="4" />
          <path className="activity-art__play" d="M 161 126 L 161 166 L 194 146 Z" />
          <Figure x={416} y={90} pose="step" scale={1.45} />
          <path className="activity-art__motion" d="M 360 105 C 333 116, 326 141, 338 162 M 478 104 C 510 120, 516 149, 503 172" />
          <path className="activity-art__accent" d="M 336 211 C 389 232, 457 229, 510 202" />
        </>
      ) : null}

      {type === "popup" ? (
        <>
          <path className="activity-art__spotlight" d="M 314 30 L 218 264 L 414 264 Z" />
          <Figure x={316} y={92} pose="up" scale={1.35} />
          <Figure x={174} y={170} pose="open" scale={.9} />
          <Figure x={454} y={170} pose="open" scale={.9} />
          <path className="activity-art__accent" d="M 126 244 L 502 244" />
        </>
      ) : null}

      {type === "festival" ? (
        <>
          <path className="activity-art__bunting" d="M 70 76 C 220 116, 418 112, 570 64" />
          <path className="activity-art__flags" d="M 123 86 L 136 119 L 154 94 M 217 101 L 234 135 L 250 104 M 340 102 L 357 136 L 374 99 M 468 88 L 486 120 L 502 78" />
          <path className="activity-art__stage" d="M 126 252 L 150 154 L 490 154 L 514 252 Z" />
          <Figure x={260} y={170} pose="up" scale={1} />
          <Figure x={380} y={170} pose="step" scale={1} />
          <path className="activity-art__note" d="M 514 128 L 514 88 L 546 80 L 546 118 M 514 128 C 498 119, 494 140, 510 141 M 546 118 C 530 109, 527 130, 543 131" />
        </>
      ) : null}

      {type === "performance" ? (
        <>
          <path className="activity-art__beam" d="M 126 24 L 245 266 L 365 266 L 250 24 Z" />
          <path className="activity-art__beam activity-art__beam--right" d="M 392 24 L 304 266 L 510 266 L 510 24 Z" />
          <Figure x={322} y={118} pose="step" scale={1.55} />
          <path className="activity-art__crowd" d="M 70 266 C 88 226, 110 226, 128 266 C 148 217, 172 218, 192 266 C 452 218, 478 220, 494 266 C 518 224, 546 225, 566 266" />
          <path className="activity-art__accent" d="M 230 265 L 414 265" />
        </>
      ) : null}

      {type === "community" ? (
        <>
          <circle className="activity-art__table" cx="320" cy="211" r="70" />
          <Figure x={320} y={54} pose="open" scale={.92} />
          <Figure x={187} y={110} pose="open" scale={.92} />
          <Figure x={453} y={110} pose="open" scale={.92} />
          <path className="activity-art__cup" d="M 288 192 L 300 229 L 324 229 L 336 192 Z M 300 202 L 324 202" />
          <path className="activity-art__heart" d="M 370 197 C 356 180, 331 198, 370 230 C 409 198, 384 180, 370 197 Z" />
          <path className="activity-art__accent" d="M 246 260 C 294 276, 350 276, 398 260" />
        </>
      ) : null}
    </svg>
  </div>
);

export default ActivityIllustration;
