import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN ,
    credentials: true,
}));
app.use(express.json({
    limit: "16mb",

}));
app.use(express.urlencoded({
    extended: true,
    limit: "16mb",
}));

app.use(express.static("public"));
app.use(cookieParser());

// Routes Import
import userRoutes from "./routes/user.routes.js";


// routes Declaration
app.use("/api/v1/users", userRoutes);


export { app };
