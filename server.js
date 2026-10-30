import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import enquiryRoutes from "./src/routes/enquiryRoutes.js";

const app = express();

// Security and middleware configuration.
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Health check.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM REST API is running.",
  });
});

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api/enquiries", enquiryRoutes);

// Handle undefined routes.
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// Global error handler.
app.use((error, req, res, next) => {
  console.error(error);

  // Duplicate MongoDB key.
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "An employee with this email already exists.",
    });
  }

  // Mongoose validation error.
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Invalid JSON body.
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// Start server.
const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
      throw new Error("JWT_SECRET and MONGODB_URI must be configured.");
    }

    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
