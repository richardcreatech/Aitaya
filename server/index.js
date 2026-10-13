import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import followRoutes from "./routes/followRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    message: "Glitch Me server is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/follow", followRoutes);


app.listen(PORT, () => {
  console.log(`Glitch Me server running on port ${PORT}`);
});
