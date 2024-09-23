import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB";
import bodyParser from "body-parser" 
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.route"
import restaurantRoute from "./routes/restaurant.route"
import menuRoute from "./routes/menu.route"
import orderRoute from "./routes/order.route"


import cors from "cors"

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

// default middleware must need for any mern project
app.use(bodyParser.json({limit:'10mb'}))
app.use(express.urlencoded({extended:true, limit:'10mb'}))
app.use(express.json())
app.use(cookieParser())

const corsOptions={
  origin: "http://localhost:5173",
  credentials: true
}
app.use(cors(corsOptions))

// api
app.use("/api/v1/user",userRoute)
app.use("/api/v1/restaurant",restaurantRoute)
app.use("/api/v1/menu",menuRoute)
app.use("/api/v1/order",orderRoute)

app.listen(PORT, () => {
  connectDB();
  console.log(`Server listening at port ${PORT}`);
});
