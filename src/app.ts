import express from "express";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import requestRoutes from "./routes/requestRoutes";
import supplierRoutes from "./routes/supplierRoutes";

import dotenv from "dotenv";
dotenv.config();
const app = express();
const cors = require("cors");
// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.use("/uploads", express.static("uploads"));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/supplier", supplierRoutes);
// Error Handling
app.use((err: any, req: any, res: any, next: any) => {
  if (err.name === "ValidationError") {
    return res.status(400).send({ error: err.message });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ error: "Invalid token" });
  }

  // Handle other types of errors here...

  return res.status(500).send({ error: "Something went wrong!" });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

export default app;
