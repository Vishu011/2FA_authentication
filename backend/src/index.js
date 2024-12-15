import express, { json, urlencoded } from "express";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import cors from "cors";
import dbConnect from "./config/dbconnect.js"; 
import authRoutes from "./routes/authRoutes.js";
import "./config/passportConfig.js";
dotenv.config();
dbConnect();
const app = express();

// Middleware
const corsOptions = {
    origin: ["http://localhost:3001"],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(json({ limit: "100mb" })); // For JSON payloads
app.use(urlencoded({ limit: "100mb", extended: true })); // For URL-encoded payloads
app.use(
    session({
        secret: process.env.SESSION_SECRET || "secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 60000 * 60, // 1 hour
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use("/api/auth",authRoutes); 


const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
