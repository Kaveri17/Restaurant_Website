import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB";
dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server listening at port ${PORT}`);
});
