require("dotenv").config();
const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");

connectToMongo();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL || "https://ecommerce-project-alpw.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error("CORS policy does not allow access from this origin."),
      );
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "auth-token"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

const products = require("./routes/products");
app.use("/api/products", products);

const reviewRoutes = require("./routes/review");
app.use("/api/reviews", reviewRoutes);

const session = require("express-session");
app.use(
  session({
    secret: "mysupersecretkey",
    resave: false,
    saveUninitialized: true,
  }),
);

const auth = require("./routes/auth");
app.use("/api/auth", auth);

const payment = require("./routes/payment");
app.use("/api/payment", payment);

app.get("/", (req, res) => {
  res.send("🚀 Ecommerce Backend is Running Successfully");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
