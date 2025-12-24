import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { userRoutes } from "./routes/user.routes.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.PORT,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser);

// userRoutes
app.use("/api/v1/user", userRoutes);

export default app;