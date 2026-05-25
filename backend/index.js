require("dotenv").config();
const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");

connectToMongo();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    allowedHeaders: ["Content-Type", "auth-token"],
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
