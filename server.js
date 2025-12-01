require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const config = require("./config");

const app = express();

// ----------------------
//  MIDDLEWARE
// ----------------------
app.use(express.json());
app.use(
  cors({
    origin: [
      config.frontendUrl,
      "http://localhost:3000", // allow local development as well
    ],
    credentials: true,
  })
);

// Make pool accessible everywhere
let pool;

// ----------------------
//  CONNECT TO MYSQL
// ----------------------
async function connectDatabase() {
  try {
    pool = mysql.createPool({
      uri: config.databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const conn = await pool.getConnection();
    console.log("✅ MySQL Connected Successfully!");
    conn.release();

    // Export globally so routes/controllers can use it
    module.exports.pool = pool;

  } catch (error) {
    console.error("❌ MySQL Connection Failed:", error.message);
    process.exit(1);
  }
}

connectDatabase();


// ----------------------
//  IMPORT ALL ROUTES
// ----------------------
// Example:
// const authRoutes = require("./routes/auth");
// app.use("/api/auth", authRoutes);
//
// (Your existing routes will continue working)
// ------------------------------------------------
// 👉 Add your REAL routes here:
try {
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/subscribers", require("./routes/subscribers"));
} catch (err) {
  console.log("⚠️ Warning: Some routes could not be loaded:", err.message);
}


// ----------------------
//  HEALTH CHECK
// ----------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: config.nodeEnv,
    database: pool ? "connected" : "not connected",
  });
});


// ----------------------
//  START SERVER
// ----------------------
app.listen(config.port, () => {
  console.log("=".repeat(60));
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend: ${config.frontendUrl}`);
  console.log(`📦 DB URL detected: ${!!config.databaseUrl}`);
  console.log("=".repeat(60));
});
