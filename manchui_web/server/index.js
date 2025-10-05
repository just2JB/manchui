require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const PORT = 3000;

const userRouter = require("./routes/user");
const reservationRouter = require("./routes/reservation");
const joinRouter = require("./routes/join");
const scheduleRouter = require("./routes/schedule");

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use("/api/auth", userRouter);
app.use("/api/reservation", reservationRouter);
app.use("/api/join", joinRouter);
app.use("/api/schedule", scheduleRouter);

app.get("/", (req, res) => {
  res.send("만취 웹사이트의 백엔드 서버 입니다.");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("몽고DB와 연결성공"))
  .catch((error) => console.log("몽고DB와 연결실패", error));

app.listen(PORT, () => {
  console.log("Server is running");
});
