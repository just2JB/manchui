require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const PORT = 3000;

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
