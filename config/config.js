require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,

  databaseUrl: process.env.DATABASE_URL, 

  jwtSecret: process.env.JWT_SECRET,

  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,

  frontendUrl: process.env.FRONTEND_URL,

  nodeEnv: process.env.NODE_ENV || "development",
};
