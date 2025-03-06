import express from "express";
import connectDB from "./src/config/database.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import statusRoutes from "./src/routes/statusRoutes.js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());

await connectDB();
console.log("MongoDB connected successfully in app.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/upload", uploadRoutes);
app.use("/api/status", statusRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
