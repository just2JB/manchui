require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

function collectAllowedOrigins() {
  const origins = new Set();
  const addOrigin = (raw) => {
    const value = (raw || "").trim().replace(/\/$/, "");
    if (value) origins.add(value);
  };

  addOrigin(process.env.CLIENT_URL);
  (process.env.CLIENT_URLS || "").split(",").forEach(addOrigin);

  const clientUrl = (process.env.CLIENT_URL || "").trim().replace(/\/$/, "");
  if (clientUrl.startsWith("https://www.")) {
    origins.add(clientUrl.replace("https://www.", "https://"));
  } else if (clientUrl.startsWith("https://")) {
    origins.add(clientUrl.replace("https://", "https://www."));
  }

  return origins;
}

const allowedOrigins = collectAllowedOrigins();

const userRouter = require("./routes/user");
const reservationRouter = require("./routes/reservation");
const joinRouter = require("./routes/join");
const scheduleRouter = require("./routes/schedule");
const teamRouter = require("./routes/team");
const practiceRouter = require("./routes/practice");
const recommendationRouter = require("./routes/recommendation");
const lotteryRouter = require("./routes/lottery");
const weeklyTimetableRouter = require("./routes/weeklyTimetable");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", userRouter);
app.use("/api/reservation", reservationRouter);
app.use("/api/join", joinRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/team", teamRouter);
app.use("/api/practice", practiceRouter);
app.use("/api/recommendations", recommendationRouter);
app.use("/api/lottery", lotteryRouter);
app.use("/api/weekly-timetable", weeklyTimetableRouter);

app.get("/", (req, res) => {
  res.send("만취 웹사이트의 백엔드 서버 입니다.");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("몽고DB와 연결성공"))
  .catch((error) => console.log("몽고DB와 연결실패", error));

app.listen(PORT, () => {
  console.log("Server is running");
  const { logMailStartupStatus } = require("./utils/mail");
  logMailStartupStatus();
});
